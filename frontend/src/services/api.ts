import type { Card } from '../types';

const API_BASE_URL = 'http://localhost:8000';

export interface ApiResponse<T> {
    success?: boolean;
    error?: string;
    data?: T;
}

export interface GameStatusResponse {
    status?: string;
    turn?: number;
    deck: Card[];
    discarded: Card[];
    removed: Card[];
    cards_in_hands: Card[];
    your_hand: Card[];
    opponent_hand: Card[];
    filename?: string | null;
    error?: string;
}

export const apiService = {
    async fetchGameStatus(): Promise<GameStatusResponse> {
        const response = await fetch(`${API_BASE_URL}/api/current-status`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    },

    async resetState(): Promise<GameStatusResponse> {
        const response = await fetch(`${API_BASE_URL}/api/current-status`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    },
};
