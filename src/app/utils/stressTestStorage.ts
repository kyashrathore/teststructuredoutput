import { SavedTest, SystemPromptTest } from "../types/stress-test";

// Simple hash function for strings (djb2)
export function generateHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return hash.toString(16);
}
