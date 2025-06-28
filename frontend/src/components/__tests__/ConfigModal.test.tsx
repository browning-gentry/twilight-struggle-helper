import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfigModal from '../ConfigModal';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock window.electronAPI
const mockElectronAPI = {
    selectFile: jest.fn(),
    selectDirectory: jest.fn(),
};

Object.defineProperty(window, 'electronAPI', {
    value: mockElectronAPI,
    writable: true,
});

// Mock window.location
Object.defineProperty(window, 'location', {
    value: {
        protocol: 'http:',
    },
    writable: true,
});

const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfigSaved: jest.fn(),
};

const mockConfigResponse = {
    success: true,
    config: {
        log_file_path: '/path/to/specific/file.txt',
        log_directory: '/path/to/logs',
    },
};

const mockResetResponse = {
    success: true,
    config: {
        log_file_path: null,
        log_directory: '/default/log/path',
    },
};

const renderConfigModal = (props = {}): void => {
    render(<ConfigModal {...defaultProps} {...props} />);
};

// Helper to wait for loading to complete
const waitForLoadingToComplete = async (): Promise<void> => {
    await waitFor(() => {
        expect(screen.queryByText('Loading configuration...')).not.toBeInTheDocument();
    });
};

describe('ConfigModal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockFetch.mockClear();
        mockElectronAPI.selectFile.mockClear();
        mockElectronAPI.selectDirectory.mockClear();
    });

    describe('Rendering', () => {
        it('renders when isOpen is true', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigResponse,
            });

            renderConfigModal();

            expect(screen.getByText('Configuration')).toBeInTheDocument();
            expect(screen.getByLabelText('Log Directory:')).toBeInTheDocument();
            expect(screen.getByText('Use most recent game file')).toBeInTheDocument();
            expect(screen.getByText('Use specific file')).toBeInTheDocument();
        });

        it('does not render when isOpen is false', () => {
            renderConfigModal({ isOpen: false });

            expect(screen.queryByText('Configuration')).not.toBeInTheDocument();
        });

        it('renders all form elements correctly', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigResponse,
            });

            renderConfigModal();

            await waitForLoadingToComplete();

            expect(screen.getByLabelText('Log Directory:')).toBeInTheDocument();
            expect(screen.getByText('Browse Directory...')).toBeInTheDocument();
            expect(screen.getByLabelText('Use most recent game file')).toBeInTheDocument();
            expect(screen.getByLabelText('Use specific file')).toBeInTheDocument();
            expect(screen.getByText('Reset to Defaults')).toBeInTheDocument();
            expect(screen.getByText('Cancel')).toBeInTheDocument();
            expect(screen.getByText('Save Configuration')).toBeInTheDocument();
        });

        it('shows loading state when loading', async () => {
            mockFetch.mockImplementation(
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                () => new Promise(() => {}), // Never resolves
            );

            renderConfigModal();

            expect(screen.getByText('Loading configuration...')).toBeInTheDocument();
        });

        it('shows error message when error state is set', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            renderConfigModal();

            await waitFor(() => {
                expect(screen.getByText('Failed to load configuration')).toBeInTheDocument();
            });
        });

        it('shows success message when success state is set', async () => {
            // Mock load config
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigResponse,
            });

            // Mock save config
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true }),
            });

            renderConfigModal();

            await waitForLoadingToComplete();

            // Save configuration to trigger success message
            await userEvent.click(screen.getByText('Save Configuration'));

            await waitFor(() => {
                expect(screen.getByText('Configuration saved successfully!')).toBeInTheDocument();
            });
        });
    });

    describe('Form interactions', () => {
        it('allows editing log directory', async () => {
            const user = userEvent.setup();

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigResponse,
            });

            renderConfigModal();

            await waitForLoadingToComplete();

            const directoryInput = screen.getByLabelText('Log Directory:');
            await user.clear(directoryInput);
            await user.type(directoryInput, '/new/log/directory');

            expect(directoryInput).toHaveValue('/new/log/directory');
        });

        it('switches between recent and specific file modes', async () => {
            const user = userEvent.setup();
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    config: {
                        log_file_path: null,
                        log_directory: '/path/to/logs',
                    },
                }),
            });
            renderConfigModal();
            await waitForLoadingToComplete();
            const recentRadio = screen.getByLabelText('Use most recent game file');
            const specificRadio = screen.getByLabelText('Use specific file');
            expect(recentRadio).toBeChecked();
            expect(specificRadio).not.toBeChecked();
            await user.click(specificRadio);
            await waitFor(() => expect(specificRadio).toBeChecked());
            expect(recentRadio).not.toBeChecked();
            expect(screen.getByLabelText('Specific Log File:')).toBeInTheDocument();
        });

        it('allows editing specific log file path when in specific mode', async () => {
            const user = userEvent.setup();

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigResponse,
            });

            renderConfigModal();

            await waitForLoadingToComplete();

            // Switch to specific file mode
            await user.click(screen.getByLabelText('Use specific file'));

            const fileInput = screen.getByLabelText('Specific Log File:');
            await user.clear(fileInput);
            await user.type(fileInput, '/path/to/specific/file.txt');

            expect(fileInput).toHaveValue('/path/to/specific/file.txt');
        });

        it('clears specific file path when switching to recent mode', async () => {
            const user = userEvent.setup();

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigResponse,
            });

            renderConfigModal();

            await waitForLoadingToComplete();

            // Switch to specific file mode and enter a path
            await user.click(screen.getByLabelText('Use specific file'));
            const fileInput = screen.getByLabelText('Specific Log File:');
            await user.type(fileInput, '/path/to/file.txt');

            // Switch back to recent mode
            await user.click(screen.getByLabelText('Use most recent game file'));

            // Specific file input should be hidden
            expect(screen.queryByLabelText('Specific Log File:')).not.toBeInTheDocument();
        });
    });

    describe('API interactions', () => {
        it('loads configuration on mount', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigResponse,
            });

            renderConfigModal();

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/config');
            });
        });

        it('handles load configuration success', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigResponse,
            });

            renderConfigModal();

            await waitFor(() => {
                expect(screen.getByLabelText('Log Directory:')).toHaveValue('/path/to/logs');
            });
        });

        it('handles load configuration error', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            renderConfigModal();

            await waitFor(() => {
                expect(screen.getByText('Failed to load configuration')).toBeInTheDocument();
            });
        });

        it('saves configuration successfully', async () => {
            const user = userEvent.setup();

            // Mock load config
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigResponse,
            });

            // Mock save config
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true }),
            });

            renderConfigModal();

            await waitForLoadingToComplete();

            // Change directory
            const directoryInput = screen.getByLabelText('Log Directory:');
            await user.clear(directoryInput);
            await user.type(directoryInput, '/new/directory');

            // Save configuration
            await user.click(screen.getByText('Save Configuration'));

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/config', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        log_file_path: '/path/to/specific/file.txt',
                        log_directory: '/new/directory',
                    }),
                });
            });
        });

        it('handles save configuration error', async () => {
            const user = userEvent.setup();

            // Mock load config
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigResponse,
            });

            // Mock save config error
            mockFetch.mockRejectedValueOnce(new Error('Save failed'));

            renderConfigModal();

            await waitForLoadingToComplete();

            // Save configuration
            await user.click(screen.getByText('Save Configuration'));

            await waitFor(() => {
                expect(screen.getByText('Failed to save configuration')).toBeInTheDocument();
            });
        });

        it('resets configuration successfully', async () => {
            const user = userEvent.setup();

            // Mock load config
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigResponse,
            });

            // Mock reset config
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResetResponse,
            });

            renderConfigModal();

            await waitForLoadingToComplete();

            // Reset configuration
            await user.click(screen.getByText('Reset to Defaults'));

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/config/reset', {
                    method: 'POST',
                });
            });

            await waitFor(() => {
                expect(screen.getByText('Configuration reset to defaults!')).toBeInTheDocument();
            });
        });

        it('handles reset configuration error', async () => {
            const user = userEvent.setup();

            // Mock load config
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigResponse,
            });

            // Mock reset config error
            mockFetch.mockRejectedValueOnce(new Error('Reset failed'));

            renderConfigModal();

            await waitForLoadingToComplete();

            // Reset configuration
            await user.click(screen.getByText('Reset to Defaults'));

            await waitFor(() => {
                expect(screen.getByText('Failed to reset configuration')).toBeInTheDocument();
            });
        });
    });

    describe('File picker functionality', () => {
        it('opens directory picker when Browse Directory is clicked (Electron)', async () => {
            const user = userEvent.setup();

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigResponse,
            });

            mockElectronAPI.selectDirectory.mockResolvedValue('/selected/directory');

            renderConfigModal();

            await waitForLoadingToComplete();

            await user.click(screen.getByText('Browse Directory...'));

            expect(mockElectronAPI.selectDirectory).toHaveBeenCalled();
        });

        it('handles directory picker error (Electron)', async () => {
            const user = userEvent.setup();

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigResponse,
            });

            mockElectronAPI.selectDirectory.mockRejectedValue(new Error('Picker failed'));

            renderConfigModal();

            await waitForLoadingToComplete();

            await user.click(screen.getByText('Browse Directory...'));

            await waitFor(() => {
                expect(
                    screen.getByText('Error selecting folder. Please enter the path manually.'),
                ).toBeInTheDocument();
            });
        });

        it('shows error for directory picker in web mode', async () => {
            const user = userEvent.setup();
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigResponse,
            });
            // Remove electronAPI to simulate web mode BEFORE rendering
            delete (window as any).electronAPI;
            renderConfigModal();
            await waitForLoadingToComplete();
            await user.click(screen.getByText('Browse Directory...'));
            await waitFor(() => {
                expect(
                    screen.getByText('Error selecting folder. Please enter the path manually.'),
                ).toBeInTheDocument();
            });
        });

        it('opens file picker when Browse is clicked (Electron)', async () => {
            const user = userEvent.setup();

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigResponse,
            });

            renderConfigModal();

            await waitForLoadingToComplete();

            // Switch to specific file mode
            await user.click(screen.getByLabelText('Use specific file'));

            mockElectronAPI.selectFile.mockResolvedValue('/selected/file.txt');

            await user.click(screen.getByText('Browse...'));

            expect(mockElectronAPI.selectFile).toHaveBeenCalledWith('/path/to/logs');
        });

        it('handles file picker error (Electron)', async () => {
            const user = userEvent.setup();

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigResponse,
            });

            renderConfigModal();

            await waitForLoadingToComplete();

            // Switch to specific file mode
            await user.click(screen.getByLabelText('Use specific file'));

            mockElectronAPI.selectFile.mockRejectedValue(new Error('Picker failed'));

            await user.click(screen.getByText('Browse...'));

            await waitFor(() => {
                expect(
                    screen.getByText('Error selecting file. Please enter the path manually.'),
                ).toBeInTheDocument();
            });
        });

        it('shows helpful message for file picker in web mode', async () => {
            const user = userEvent.setup();
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigResponse,
            });
            // Remove electronAPI to simulate web mode BEFORE rendering
            delete (window as any).electronAPI;
            renderConfigModal();
            await waitForLoadingToComplete();
            // Switch to specific file mode
            await user.click(screen.getByLabelText('Use specific file'));
            await user.click(screen.getByText('Browse...'));
            await waitFor(() => {
                expect(
                    screen.getByText('Error selecting file. Please enter the path manually.'),
                ).toBeInTheDocument();
            });
        });
    });

    describe('Modal actions', () => {
        it('calls onClose when close button is clicked', async () => {
            const user = userEvent.setup();
            const onClose = jest.fn();

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigResponse,
            });

            renderConfigModal({ onClose });

            await waitForLoadingToComplete();

            await user.click(screen.getByText('×'));

            expect(onClose).toHaveBeenCalled();
        });

        it('calls onClose when Cancel button is clicked', async () => {
            const user = userEvent.setup();
            const onClose = jest.fn();

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigResponse,
            });

            renderConfigModal({ onClose });

            await waitForLoadingToComplete();

            await user.click(screen.getByText('Cancel'));

            expect(onClose).toHaveBeenCalled();
        });

        it('calls onConfigSaved after successful save', async () => {
            const user = userEvent.setup();
            const onConfigSaved = jest.fn();

            // Mock load config
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockConfigResponse,
            });

            // Mock save config
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true }),
            });

            renderConfigModal({ onConfigSaved });

            await waitForLoadingToComplete();

            // Save configuration
            await user.click(screen.getByText('Save Configuration'));

            // Wait for success message and auto-close
            await waitFor(() => {
                expect(screen.getByText('Configuration saved successfully!')).toBeInTheDocument();
            });

            // Wait for the timeout to complete
            await waitFor(
                () => {
                    expect(onConfigSaved).toHaveBeenCalled();
                },
                { timeout: 2000 },
            );
        });

        it('disables buttons during loading', async () => {
            mockFetch.mockImplementation(
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                () => new Promise(() => {}), // Never resolves
            );

            renderConfigModal();

            expect(screen.getByText('Loading configuration...')).toBeInTheDocument();

            expect(screen.getByText('×')).toBeDisabled();
            expect(screen.getByText('Cancel')).toBeDisabled();
            expect(screen.getByText('Saving...')).toBeInTheDocument(); // Button text changes during loading
            expect(screen.getByText('Reset to Defaults')).toBeDisabled();
        });
    });

    describe('Edge cases', () => {
        it('handles malformed API responses', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: false, error: 'Invalid config' }),
            });

            renderConfigModal();

            await waitFor(() => {
                expect(screen.getByText('Invalid config')).toBeInTheDocument();
            });
        });

        it('handles HTTP error responses', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
            });

            renderConfigModal();

            await waitFor(() => {
                expect(screen.getByText('Failed to load configuration')).toBeInTheDocument();
            });
        });

        it('handles empty config response', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true, config: {} }),
            });

            renderConfigModal();

            // Should not crash and should render with empty values
            await waitFor(() => {
                expect(screen.getByLabelText('Log Directory:')).toHaveValue('');
            });
        });

        it('infers use_specific_file from backend config', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    config: {
                        log_file_path: '/path/to/file.txt',
                        log_directory: '/path/to/logs',
                    },
                }),
            });

            renderConfigModal();

            await waitFor(() => {
                expect(screen.getByLabelText('Use specific file')).toBeChecked();
            });
        });
    });
});
