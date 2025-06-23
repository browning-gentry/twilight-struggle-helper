import '@testing-library/jest-dom';

// Mock window.electronAPI for tests
Object.defineProperty(window, 'electronAPI', {
    value: {
        selectFile: jest.fn(),
        selectDirectory: jest.fn(),
    },
    writable: true,
});

// Mock fetch for API tests
global.fetch = jest.fn();

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));
