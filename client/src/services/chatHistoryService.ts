// /services/chatHistoryService.ts
import { apiService } from './api';

export interface RoomWithFirstPrompt {
    room_id: string | number;
    room_name: string;
    first_user_prompt?: string;
    created_at?: string;
    updated_at?: string;
    user_id?: number;
}

export class ChatHistoryService {
    private promptCache = new Map<string, string>();
    private loadingPrompts = new Set<string>();

    /**
     * Get the first user prompt from a room's messages
     */
    async getFirstUserPrompt(roomId: string): Promise<string | null> {
        // Check cache first
        if (this.promptCache.has(roomId)) {
            return this.promptCache.get(roomId) || null;
        }

        // Prevent multiple simultaneous requests for the same room
        if (this.loadingPrompts.has(roomId)) {
            // Wait for the ongoing request to complete
            while (this.loadingPrompts.has(roomId)) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return this.promptCache.get(roomId) || null;
        }

        try {
            this.loadingPrompts.add(roomId);

            console.log(`Fetching first prompt for room: ${roomId}`);
            const messagesResponse = await apiService.getMessages(roomId);

            if (messagesResponse.messages && messagesResponse.messages.length > 0) {
                // Find the first user message
                const firstUserMessage = messagesResponse.messages.find(
                    message => message.role === 'user'
                );

                if (firstUserMessage && firstUserMessage.content) {
                    const prompt = firstUserMessage.content.trim();
                    this.promptCache.set(roomId, prompt);
                    console.log(`Cached first prompt for room ${roomId}:`, prompt.substring(0, 50) + '...');
                    return prompt;
                }
            }

            console.log(`No user messages found for room: ${roomId}`);
            this.promptCache.set(roomId, ''); // Cache empty result to avoid repeated requests
            return null;
        } catch (error) {
            console.error(`Failed to fetch first prompt for room ${roomId}:`, error);
            return null;
        } finally {
            this.loadingPrompts.delete(roomId);
        }
    }

    /**
     * Get first user prompts for multiple rooms in batches
     */
    async getFirstUserPrompts(roomIds: string[], batchSize: number = 5): Promise<Map<string, string>> {
        const results = new Map<string, string>();

        // Process rooms in batches to avoid overwhelming the API
        for (let i = 0; i < roomIds.length; i += batchSize) {
            const batch = roomIds.slice(i, i + batchSize);
            const batchPromises = batch.map(async (roomId) => {
                const prompt = await this.getFirstUserPrompt(roomId);
                if (prompt) {
                    results.set(roomId, prompt);
                }
                return { roomId, prompt };
            });

            await Promise.all(batchPromises);

            // Small delay between batches to be gentle on the API
            if (i + batchSize < roomIds.length) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        return results;
    }

    /**
     * Enhance rooms with first user prompts
     */
    async enhanceRoomsWithPrompts<T extends { room_id: string | number }>(
        rooms: T[]
    ): Promise<(T & { first_user_prompt?: string })[]> {
        if (rooms.length === 0) return [];

        const roomIds = rooms.map(room => room.room_id.toString());
        const prompts = await this.getFirstUserPrompts(roomIds);

        return rooms.map(room => ({
            ...room,
            first_user_prompt: prompts.get(room.room_id.toString()) || undefined
        }));
    }

    /**
     * Generate a smart room name based on the first user prompt
     */
    generateSmartRoomName(firstPrompt: string, maxLength: number = 30): string {
        if (!firstPrompt || firstPrompt.trim().length === 0) {
            return "New Chat";
        }

        let smartName = firstPrompt.trim();

        // Remove common greeting patterns
        smartName = smartName.replace(/^(hi|hello|hey|halo|selamat\s+(pagi|siang|malam|sore))[,!.]?\s*/i, '');

        // Remove question words at the beginning for cleaner titles
        smartName = smartName.replace(/^(bisa|dapat|tolong|please|can you|could you|how to|bagaimana)\s+/i, '');

        // Capitalize first letter
        smartName = smartName.charAt(0).toUpperCase() + smartName.slice(1);

        // Truncate if too long
        if (smartName.length > maxLength) {
            smartName = smartName.substring(0, maxLength - 3) + '...';
        }

        return smartName || "New Chat";
    }

    /**
     * Clear cache for a specific room (useful when room is updated)
     */
    clearRoomCache(roomId: string): void {
        this.promptCache.delete(roomId);
    }

    /**
     * Clear all cached prompts
     */
    clearAllCache(): void {
        this.promptCache.clear();
    }

    /**
     * Get cache statistics (for debugging)
     */
    getCacheStats(): { size: number; roomIds: string[] } {
        return {
            size: this.promptCache.size,
            roomIds: Array.from(this.promptCache.keys())
        };
    }
}

// Export singleton instance
export const chatHistoryService = new ChatHistoryService();