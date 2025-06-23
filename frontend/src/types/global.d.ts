declare global {
    interface Window {
        electronAPI?: {
            selectFile: (startPath?: string) => Promise<string | null>;
            selectDirectory: (startPath?: string) => Promise<string | null>;
        };
    }
}

export {};
