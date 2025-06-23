import React, { useState, useEffect, useRef } from 'react';
import './ConfigModal.css';

interface Config {
    log_file_path: string | null;
    log_directory: string;
    use_specific_file: boolean;
}

interface ConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfigSaved: () => void;
}

const API_BASE_URL = 'http://localhost:8000';

const ConfigModal: React.FC<ConfigModalProps> = ({
    isOpen,
    onClose,
    onConfigSaved,
}): JSX.Element | null => {
    const [config, setConfig] = useState<Config>({
        log_file_path: null,
        log_directory: '',
        use_specific_file: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setSuccess(null);
            setError(null);
            loadConfig();
        }
    }, [isOpen]);

    const loadConfig = async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_BASE_URL}/api/config`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                // Backend doesn't have use_specific_file field, so we need to infer it
                const backendConfig = data.config;
                const use_specific_file =
                    backendConfig.log_file_path !== null && backendConfig.log_file_path !== '';

                setConfig({
                    log_file_path: backendConfig.log_file_path,
                    log_directory: backendConfig.log_directory,
                    use_specific_file: use_specific_file,
                });
            } else {
                setError(data.error || 'Failed to load configuration');
            }
        } catch (error) {
            setError('Failed to load configuration');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConfig = async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            // Only send the fields that the backend expects
            const configToSend = {
                log_file_path: config.use_specific_file ? config.log_file_path : null,
                log_directory: config.log_directory,
            };

            const response = await fetch(`${API_BASE_URL}/api/config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(configToSend),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                setSuccess('Configuration saved successfully!');
                setError(null);
                setTimeout(() => {
                    onConfigSaved();
                    onClose();
                }, 1500);
            } else {
                setError(data.error || 'Failed to save configuration');
                setSuccess(null);
            }
        } catch (error) {
            setError('Failed to save configuration');
            setSuccess(null);
        } finally {
            setLoading(false);
        }
    };

    const handleResetConfig = async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_BASE_URL}/api/config/reset`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                setConfig(data.config);
                setSuccess('Configuration reset to defaults!');
            } else {
                setError(data.error || 'Failed to reset configuration');
            }
        } catch (error) {
            setError('Failed to reset configuration');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0];
        if (file) {
            // In Electron, files have a 'path' property, in web browsers they don't
            const filePath = (file as { path?: string }).path || file.name;
            setConfig((prev) => ({
                ...prev,
                log_file_path: filePath,
            }));
        }
    };

    const openFilePicker = async (): Promise<void> => {
        // Check if we're in Electron
        if (window.electronAPI) {
            try {
                const filePath = await (
                    window.electronAPI as {
                        selectFile: (startPath?: string) => Promise<string | null>;
                    }
                ).selectFile(config.log_directory);
                if (filePath) {
                    setConfig((prev) => ({
                        ...prev,
                        log_file_path: filePath,
                    }));
                }
            } catch (error) {
                setError('Error selecting file. Please enter the path manually.');
            }
        } else {
            // Fallback for web/debug mode - show helpful message
            const suggestedPath = config.log_directory
                ? `Suggested path: ${config.log_directory}/[filename].txt`
                : 'Please enter the full path to your log file';

            setError(
                `File picker with directory support is only available in the Electron app.\n\n${suggestedPath}\n\nPlease enter the file path manually in the text field above.`,
            );
        }
    };

    if (!isOpen) return null;

    return (
        <div className="config-modal-overlay">
            <div className="config-modal">
                <div className="config-modal-header">
                    <h2>Configuration</h2>
                    <button className="config-modal-close" onClick={onClose} disabled={loading}>
                        ×
                    </button>
                </div>

                <div className="config-modal-content">
                    {loading && <div className="config-loading">Loading configuration...</div>}

                    {error && <div className="config-error">{error}</div>}

                    {success && <div className="config-success">{success}</div>}

                    <div className="config-section">
                        <label htmlFor="log-directory" className="config-label">
                            Log Directory:
                        </label>
                        <div className="file-input-group">
                            <input
                                id="log-directory"
                                type="text"
                                value={config.log_directory}
                                onChange={(e): void =>
                                    setConfig((prev) => ({
                                        ...prev,
                                        log_directory: e.target.value,
                                    }))
                                }
                                placeholder="Directory containing log files"
                                disabled={loading}
                                className="config-input"
                            />
                            <button
                                type="button"
                                onClick={async (): Promise<void> => {
                                    // Check if we're in Electron
                                    if (window.electronAPI) {
                                        try {
                                            const folderPath =
                                                await window.electronAPI.selectDirectory();
                                            if (folderPath) {
                                                setConfig((prev) => ({
                                                    ...prev,
                                                    log_directory: folderPath,
                                                }));
                                            }
                                        } catch (error) {
                                            setError(
                                                'Error selecting folder. Please enter the path manually.',
                                            );
                                        }
                                    } else {
                                        // Fallback for web/debug mode - just let user type manually
                                        setError(
                                            'Directory picker not available in web mode. Please enter the directory path manually.',
                                        );
                                    }
                                }}
                                disabled={loading}
                                className="file-picker-button"
                            >
                                Browse Directory...
                            </button>
                        </div>
                        <small>
                            The application will automatically find the most recent .txt file in
                            this directory.
                        </small>
                    </div>

                    <div className="config-section">
                        <fieldset>
                            <legend className="config-label">Log File Selection:</legend>
                            <div className="radio-group">
                                <label htmlFor="log-file-recent" className="radio-option">
                                    <input
                                        id="log-file-recent"
                                        type="radio"
                                        name="logFileMode"
                                        value="recent"
                                        checked={!config.use_specific_file}
                                        onChange={(): void =>
                                            setConfig((prev) => ({
                                                ...prev,
                                                use_specific_file: false,
                                                log_file_path: null,
                                            }))
                                        }
                                        disabled={loading}
                                    />
                                    Use most recent game file
                                </label>
                                <label htmlFor="log-file-specific" className="radio-option">
                                    <input
                                        id="log-file-specific"
                                        type="radio"
                                        name="logFileMode"
                                        value="specific"
                                        checked={config.use_specific_file}
                                        onChange={(): void =>
                                            setConfig((prev) => ({
                                                ...prev,
                                                use_specific_file: true,
                                                log_file_path: '',
                                            }))
                                        }
                                        disabled={loading}
                                    />
                                    Use specific file
                                </label>
                            </div>
                        </fieldset>
                    </div>

                    {config.use_specific_file && (
                        <div className="config-section">
                            <label htmlFor="specific-log-file" className="config-label">
                                Specific Log File:
                            </label>
                            <div className="file-input-group">
                                <input
                                    id="specific-log-file"
                                    type="text"
                                    value={config.log_file_path || ''}
                                    onChange={(e): void =>
                                        setConfig((prev) => ({
                                            ...prev,
                                            log_file_path: e.target.value,
                                        }))
                                    }
                                    placeholder="Path to specific log file"
                                    disabled={loading}
                                    className="config-input"
                                />
                                <button
                                    type="button"
                                    onClick={openFilePicker}
                                    disabled={loading}
                                    className="file-picker-button"
                                >
                                    Browse...
                                </button>
                            </div>
                            <small>
                                This file will be used instead of searching the log directory.
                            </small>
                        </div>
                    )}

                    <div className="config-actions">
                        <button
                            onClick={handleResetConfig}
                            disabled={loading}
                            className="config-reset-button"
                        >
                            Reset to Defaults
                        </button>

                        <div className="config-save-actions">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="config-cancel-button"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveConfig}
                                disabled={loading}
                                className="config-save-button"
                            >
                                {loading ? 'Saving...' : 'Save Configuration'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Hidden file input for file picker */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />
            </div>
        </div>
    );
};

export default ConfigModal;
