const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const http = require('http');
const path = require('path');
const isDev = !app.isPackaged;
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
let mainWindow;
let backendProcess;
let backendStarted = false;
let proxyServer;
let logWatcher;

// Enable logging
process.env.ELECTRON_ENABLE_LOGGING = '1';

// Set up logging
const LOG_FILE = path.join(os.homedir(), 'twilight-helper.log');

function log(...args) {
    const message = `[${new Date().toISOString()}] [Main Process]: ${args.join(' ')}\n`;
    fs.appendFileSync(LOG_FILE, message);
    process.stdout.write(message);
}

function logError(...args) {
    const message = `[${new Date().toISOString()}] [Main Process ERROR]: ${args.join(' ')}\n`;
    fs.appendFileSync(LOG_FILE, message);
    process.stderr.write(message);
}

// Log startup information
log('=== Application Startup ===');
log('Platform:', process.platform);
log('Architecture:', process.arch);
log('Node version:', process.version);
log('Electron version:', process.versions.electron);
log('Chrome version:', process.versions.chrome);
log('Working directory:', process.cwd());
log('Executable path:', process.execPath);
log('Is packaged:', app.isPackaged);
log('Resources path:', process.resourcesPath);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logError('Uncaught Exception:', error.message);
    logError('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    logError('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Single instance enforcement
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    console.log('Another instance is already running. Exiting...');
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}

// IPC handler for folder selection
ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });

    if (!result.canceled) {
        return result.filePaths[0]; // path to selected folder
    } else {
        return null;
    }
});

// IPC handler for file selection
ipcMain.handle('select-file', async (event, startingDirectory) => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'Text Files', extensions: ['txt'] },
            { name: 'All Files', extensions: ['*'] }
        ],
        defaultPath: startingDirectory || undefined
    });

    if (!result.canceled) {
        return result.filePaths[0]; // path to selected file
    } else {
        return null;
    }
});

function createWindow() {
    log('Creating window');
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false,
            devTools: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Handle DevTools disconnection
    mainWindow.webContents.on('devtools-opened', () => {
        log('DevTools opened');
        mainWindow.focus();
    });

    mainWindow.webContents.on('crashed', () => {
        logError('Renderer process crashed');
    });

    mainWindow.on('unresponsive', () => {
        logError('Window became unresponsive');
    });

    mainWindow.loadURL(
        isDev 
            ? 'http://localhost:3000' 
            : `file://${path.join(__dirname, '../build/index.html')}`
    );

    // Add error handling
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        logError('Failed to load:', errorCode, errorDescription);
    });
}

function setupProxy() {
    log('Setting up proxy server...');
    proxyServer = http.createServer((req, res) => {
        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        log('Proxy received request:', req.method, req.url);
        const options = {
            hostname: 'localhost',
            port: 5001,
            path: req.url,
            method: req.method,
            headers: req.headers
        };

        const proxyReq = http.request(options, (proxyRes) => {
            log('Proxy received response:', proxyRes.statusCode);
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (err) => {
            logError('Proxy request error:', err.message);
            res.writeHead(500);
            res.end('Proxy Error: ' + err.message);
        });

        req.pipe(proxyReq);
    }).listen(3001);

    proxyServer.on('error', (err) => {
        logError('Proxy server error:', err.message);
    });

    log('Proxy server started on port 3001');
}

function monitorLogFile() {
    const logFile = path.join(os.homedir(), 'twilight-helper-backend.log');
    log('Monitoring log file:', logFile);

    // List contents of temp directory
    try {
        log('Contents of temp directory:', fs.readdirSync(os.tmpdir()));
    } catch (err) {
        logError('Error reading temp directory:', err.message);
    }

    // Create empty log file if it doesn't exist
    if (!fs.existsSync(logFile)) {
        fs.writeFileSync(logFile, '');
    }

    let lastSize = 0;
    logWatcher = setInterval(() => {
        try {
            const stats = fs.statSync(logFile);
            if (stats.size > lastSize) {
                const buffer = Buffer.alloc(stats.size - lastSize);
                const fd = fs.openSync(logFile, 'r');
                fs.readSync(fd, buffer, 0, buffer.length, lastSize);
                fs.closeSync(fd);
                log('[Backend Log]:', buffer.toString());
                lastSize = stats.size;

                // Check for Flask server start
                if (buffer.toString().includes('Running on http://')) {
                    backendStarted = true;
                }
            }
        } catch (err) {
            logError('Error reading log file:', err.message);
        }
    }, 100);
}

function startBackend() {
    log('Starting backend process...');
    log('Current directory:', process.cwd());
    log('Is dev mode:', isDev);
    log('Platform:', process.platform);
    log('Architecture:', process.arch);
    log('Process bits:', process.arch === 'x64' ? '64-bit' : '32-bit');
    
    // Wait a bit for any existing processes to be killed
    setTimeout(() => {
        // Get the correct backend path for the platform
        const backendPath = isDev
            ? path.join(__dirname, '../../backend/app.py')
            : path.join(process.resourcesPath, 'backend', 'app' + (process.platform === 'win32' ? '.exe' : ''));

        log('Starting backend with path:', backendPath);
        log('Resources path:', process.resourcesPath);
        log('Backend directory contents:', fs.readdirSync(path.join(process.resourcesPath, 'backend')));

        // Check if file exists
        if (!fs.existsSync(backendPath)) {
            logError('Backend executable not found at:', backendPath);
            logError('Contents of resources directory:', fs.readdirSync(process.resourcesPath));
            logError('Contents of backend directory:', fs.readdirSync(path.join(process.resourcesPath, 'backend')));
            return;
        }

        // Make the file executable (only on Unix systems)
        if (!isDev && process.platform !== 'win32') {
            try {
                fs.chmodSync(backendPath, '755');
                log('Made backend executable');
            } catch (error) {
                logError('Error making backend executable:', error);
            }
        }

        backendProcess = isDev 
            ? spawn('python', [backendPath])
            : process.platform === 'win32' 
              ? spawn(`"${backendPath}"`, [], {
                  env: {
                      ...process.env,
                      PYTHONUNBUFFERED: '1',
                      FLASK_ENV: 'development',
                      FLASK_DEBUG: '1',
                      PYTHONIOENCODING: 'utf-8'
                  },
                  windowsHide: true,
                  stdio: ['pipe', 'pipe', 'pipe'],
                  shell: true,
                  windowsVerbatimArguments: true,
                  cwd: path.dirname(backendPath)  // Set working directory to backend location
              })
              : spawn(backendPath, [], {
                  env: {
                      ...process.env,
                      PYTHONUNBUFFERED: '1',
                      FLASK_ENV: 'development',
                      FLASK_DEBUG: '1',
                      PYTHONIOENCODING: 'utf-8'
                  },
                  stdio: ['pipe', 'pipe', 'pipe']
              });

        log('Spawning backend with command:', process.platform === 'win32' ? `"${backendPath}"` : backendPath);

        // Log process info immediately
        log('Backend process started with PID:', backendProcess.pid);

        // Check if process is actually running
        if (!backendProcess.pid) {
            logError('Backend process failed to start');
            return;
        }

        // Test if port 5001 becomes available
        const testPort = () => {
            const net = require('net');
            const tester = net.createServer();
            tester.once('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    console.log('Port 5001 still in use, waiting...');
                    setTimeout(testPort, 1000);
                }
            });
            tester.once('listening', () => {
                tester.close();
                console.log('Port 5001 is available');
                backendStarted = true;
            });
            tester.listen(5001);
        };
        
        // Start testing port after a short delay
        setTimeout(testPort, 1000);

        // Immediately set up output handlers
        backendProcess.stdout.on('data', (data) => {
            log('Backend stdout:', data.toString());
        });

        backendProcess.stderr.on('data', (data) => {
            logError('Backend stderr:', data.toString());
        });

        // Add more detailed error handling
        backendProcess.on('error', (err) => {
            logError('Backend process error:', err);
            logError('Error code:', err.code);
            logError('Error message:', err.message);
            logError('Error stack:', err.stack);
        });

        // Handle output for both dev and prod
        const handleOutput = (data) => {
            // Split the output into lines and log each one
            const lines = data.toString().split('\n');
            lines.forEach(line => {
                if (line.trim()) {  // Only log non-empty lines
                    console.log(`[Backend]: ${line}`);
                }
            });
            if (data.toString().includes(' * Running on')) {
                backendStarted = true;
            }
        };

        const handleError = (data) => {
            // Split error output into lines and log each one
            const lines = data.toString().split('\n');
            lines.forEach(line => {
                if (line.trim()) {  // Only log non-empty lines
                    console.error(`[Backend Error]: ${line}`);
                }
            });
        };

        // Add exit handler
        backendProcess.on('exit', (code, signal) => {
            console.error(`Backend process exited with code ${code} and signal ${signal}`);
            backendStarted = false;
        });

        if (isDev) {
            backendProcess.stdout.on('data', handleOutput);
            backendProcess.stderr.on('data', handleError);
        } else {
            backendProcess.stdout.on('data', handleOutput);
            backendProcess.stderr.on('data', handleError);
        }

        // Add a delay before setting up proxy
        const waitForBackend = () => {
            if (backendStarted) {
                console.log('Backend started, setting up proxy...');
                setupProxy();
            } else {
                // Check if process is still running
                if (!backendProcess.pid) {
                    console.error('Backend process died before starting');
                    return;
                }
                console.log('Waiting for backend to start...');
                setTimeout(waitForBackend, 1000);
            }
        };

        // Start waiting for backend with timeout
        let startupTimeout = setTimeout(() => {
            if (!backendStarted) {
                logError('Backend failed to start within 30 seconds');
                if (backendProcess) {
                    backendProcess.kill();
                }
                app.quit();
            }
        }, 30000);

        const waitForBackendWithTimeout = () => {
            if (backendStarted) {
                clearTimeout(startupTimeout);
                console.log('Backend started, setting up proxy...');
                setupProxy();
            } else {
                // Check if process is still running
                if (!backendProcess.pid) {
                    clearTimeout(startupTimeout);
                    console.error('Backend process died before starting');
                    return;
                }
                console.log('Waiting for backend to start...');
                setTimeout(waitForBackendWithTimeout, 1000);
            }
        };

        // Start waiting for backend
        waitForBackendWithTimeout();

        // Start monitoring the log file
        monitorLogFile();

        // Add more error handling for Windows
        if (process.platform === 'win32') {
            backendProcess.on('error', (err) => {
                logError('Backend process error:', err);
                if (err.code === 'ENOENT') {
                    logError('Backend executable not found. Path:', backendPath);
                }
            });
        }
    }, 2000);  // Wait 2 seconds before starting backend
}

app.whenReady().then(() => {
    console.log('App ready');
    startBackend();
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
    if (backendProcess) {
        backendProcess.kill();
    }
    if (proxyServer) {
        proxyServer.close();
    }
    if (logWatcher) {
        clearInterval(logWatcher);
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
    console.log('App activated');
}); 