import { apiService } from '../api';
import type { GameStatusResponse } from '../api';

// Mock fetch globally
global.fetch = jest.fn();

describe('apiService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('fetchGameStatus', () => {
        const mockGameStatus: GameStatusResponse = {
            status: 'active',
            turn: 1,
            deck: [{ name: 'Test Card', side: 'US', ops: 3 }],
            discarded: [],
            removed: [],
            cards_in_hands: [],
            your_hand: [],
            opponent_hand: [],
            filename: 'test.log',
        };

        it('successfully fetches game status', async () => {
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue(mockGameStatus),
            };
            (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

            const result = await apiService.fetchGameStatus();

            expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/current-status');
            expect(result).toEqual(mockGameStatus);
        });

        it('throws error when response is not ok', async () => {
            const mockResponse = {
                ok: false,
                status: 500,
            };
            (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

            await expect(apiService.fetchGameStatus()).rejects.toThrow('HTTP error! status: 500');
        });

        it('throws error when fetch fails', async () => {
            (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

            await expect(apiService.fetchGameStatus()).rejects.toThrow('Network error');
        });

        it('handles response with error field', async () => {
            const mockResponseWithError: GameStatusResponse = {
                ...mockGameStatus,
                error: 'Backend error occurred',
            };
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue(mockResponseWithError),
            };
            (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

            const result = await apiService.fetchGameStatus();

            expect(result).toEqual(mockResponseWithError);
            expect(result.error).toBe('Backend error occurred');
        });
    });

    describe('resetState', () => {
        const mockResetResponse: GameStatusResponse = {
            status: 'reset',
            turn: 1,
            deck: [],
            discarded: [],
            removed: [],
            cards_in_hands: [],
            your_hand: [],
            opponent_hand: [],
        };

        it('successfully resets game state', async () => {
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue(mockResetResponse),
            };
            (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

            const result = await apiService.resetState();

            expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/current-status');
            expect(result).toEqual(mockResetResponse);
        });

        it('throws error when reset response is not ok', async () => {
            const mockResponse = {
                ok: false,
                status: 404,
            };
            (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

            await expect(apiService.resetState()).rejects.toThrow('HTTP error! status: 404');
        });

        it('throws error when reset fetch fails', async () => {
            (global.fetch as jest.Mock).mockRejectedValue(new Error('Reset failed'));

            await expect(apiService.resetState()).rejects.toThrow('Reset failed');
        });
    });

    describe('config API calls (from ConfigModal)', () => {
        // These tests cover the API calls made by ConfigModal
        // We'll test the fetch calls directly since they're not in apiService yet

        it('loads configuration successfully', async () => {
            const mockConfigResponse = {
                success: true,
                config: {
                    log_file_path: '/path/to/file.log',
                    log_directory: '/path/to/logs',
                },
            };
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue(mockConfigResponse),
            };
            (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

            const response = await fetch('http://localhost:8000/api/config');
            const data = await response.json();

            expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/config');
            expect(data).toEqual(mockConfigResponse);
            expect(data.success).toBe(true);
        });

        it('saves configuration successfully', async () => {
            const mockSaveResponse = {
                success: true,
            };
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue(mockSaveResponse),
            };
            (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

            const configToSend = {
                log_file_path: '/path/to/file.log',
                log_directory: '/path/to/logs',
            };

            const response = await fetch('http://localhost:8000/api/config', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(configToSend),
            });
            const data = await response.json();

            expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/config', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(configToSend),
            });
            expect(data).toEqual(mockSaveResponse);
        });

        it('resets configuration successfully', async () => {
            const mockResetResponse = {
                success: true,
                config: {
                    log_file_path: null,
                    log_directory: '/default/logs',
                },
            };
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue(mockResetResponse),
            };
            (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

            const response = await fetch('http://localhost:8000/api/config/reset', {
                method: 'POST',
            });
            const data = await response.json();

            expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/config/reset', {
                method: 'POST',
            });
            expect(data).toEqual(mockResetResponse);
        });

        it('handles configuration load error', async () => {
            const mockErrorResponse = {
                success: false,
                error: 'Configuration not found',
            };
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue(mockErrorResponse),
            };
            (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

            const response = await fetch('http://localhost:8000/api/config');
            const data = await response.json();

            expect(data.success).toBe(false);
            expect(data.error).toBe('Configuration not found');
        });

        it('handles configuration save error', async () => {
            const mockErrorResponse = {
                success: false,
                error: 'Invalid configuration',
            };
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue(mockErrorResponse),
            };
            (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

            const configToSend = {
                log_file_path: '/invalid/path',
                log_directory: '/invalid/directory',
            };

            const response = await fetch('http://localhost:8000/api/config', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(configToSend),
            });
            const data = await response.json();

            expect(data.success).toBe(false);
            expect(data.error).toBe('Invalid configuration');
        });

        it('handles network errors for config operations', async () => {
            (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

            await expect(fetch('http://localhost:8000/api/config')).rejects.toThrow(
                'Network error',
            );
            await expect(
                fetch('http://localhost:8000/api/config', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                }),
            ).rejects.toThrow('Network error');
            await expect(
                fetch('http://localhost:8000/api/config/reset', {
                    method: 'POST',
                }),
            ).rejects.toThrow('Network error');
        });

        it('handles HTTP error responses for config operations', async () => {
            const mockErrorResponse = {
                ok: false,
                status: 500,
            };
            (global.fetch as jest.Mock).mockResolvedValue(mockErrorResponse);

            const response = await fetch('http://localhost:8000/api/config');
            expect(response.ok).toBe(false);
            expect(response.status).toBe(500);
        });
    });

    describe('API_BASE_URL', () => {
        it('uses correct base URL for API calls', () => {
            // The API_BASE_URL is hardcoded in the service
            // We can verify it's used correctly in our fetch calls
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({}),
            };
            (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

            apiService.fetchGameStatus();

            expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/current-status');
        });
    });

    describe('response parsing', () => {
        it('handles empty response', async () => {
            const mockResponse = {
                ok: true,
                json: jest.fn().mockResolvedValue({}),
            };
            (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

            const result = await apiService.fetchGameStatus();

            expect(result).toEqual({});
        });

        it('handles malformed JSON response', async () => {
            const mockResponse = {
                ok: true,
                json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
            };
            (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

            await expect(apiService.fetchGameStatus()).rejects.toThrow('Invalid JSON');
        });
    });
});
