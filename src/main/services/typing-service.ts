import log from "electron-log";
const ks = require("node-key-sender");

export class TypingService {
  async typeText(text: string): Promise<void> {
    if (!text || !text.trim()) {
      log.warn("No text to type");
      return;
    }

    log.info(`Typing text: ${text.substring(0, 50)}...`);

    try {
      // Small delay to ensure the target window is focused
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Type the text character by character
      await ks.sendText(text);
      
      log.info("Text typed successfully");
    } catch (error) {
      log.error("Error typing text:", error);
      throw error;
    }
  }
}
