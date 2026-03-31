import { Porcupine, BuiltinKeyword } from "@picovoice/porcupine-node";
import { PvRecorder } from "@picovoice/pvrecorder-node";
import { app } from "electron";
import path from "path";
import log from "electron-log";

export class WakeWordService {
  private porcupine: Porcupine | null = null;
  private recorder: PvRecorder | null = null;
  private isRunning = false;
  private callback: (() => void) | null = null;
  private sensitivity = 0.5;

  setSensitivity(value: number): void {
    this.sensitivity = Math.max(0, Math.min(1, value));
    log.info(`Wake word sensitivity updated to ${this.sensitivity}`);
    // Note: Porcupine sensitivity is set at init time, so this
    // takes effect on the next start cycle
  }

  async start(onWakeWord: () => void): Promise<void> {
    if (this.isRunning) {
      log.warn("Wake word service already running");
      return;
    }

    this.callback = onWakeWord;

    try {
      const accessKey = process.env.PORCUPINE_ACCESS_KEY;
      
      if (!accessKey) {
        throw new Error("PORCUPINE_ACCESS_KEY not found in environment. Check your .env file.");
      }
      
      log.info("Porcupine access key loaded successfully");

      // Initialize Porcupine with custom "Hey NaoNao" wake word
      const keywordPath = app.isPackaged
        ? path.join(process.resourcesPath, "assets", "naonao_windows.ppn")
        : path.join(app.getAppPath(), "src", "assets", "naonao_windows.ppn");

      this.porcupine = new Porcupine(
        accessKey,
        [keywordPath], // Custom "Hey NaoNao" wake word
        [this.sensitivity] // Sensitivity (0-1)
      );

      // Get available audio devices
      const devices = PvRecorder.getAvailableDevices();
      log.info(`Available audio devices: ${devices.join(", ")}`);

      // Initialize recorder
      this.recorder = new PvRecorder(
        this.porcupine.frameLength,
        -1 // Use default audio device
      );

      this.recorder.start();
      this.isRunning = true;

      log.info("Wake word service started, listening for 'Hey NaoNao'...");

      // Start listening loop
      this.listenLoop();
    } catch (error) {
      log.error("Failed to start wake word service:", error);
      this.cleanup();
      throw error;
    }
  }

  private async listenLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        if (!this.recorder || !this.porcupine) break;

        const pcm = await this.recorder.read();
        const keywordIndex = this.porcupine.process(pcm);

        if (keywordIndex >= 0) {
          log.info(`Wake word detected! (index: ${keywordIndex})`);
          if (this.callback) {
            this.callback();
          }
        }

        // Small delay to prevent CPU spinning
        await new Promise((resolve) => setTimeout(resolve, 10));
      } catch (error) {
        log.error("Error in wake word listen loop:", error);
        break;
      }
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    log.info("Stopping wake word service...");
    this.isRunning = false;
    this.cleanup();
  }

  private cleanup(): void {
    try {
      if (this.recorder) {
        this.recorder.stop();
        this.recorder.release();
        this.recorder = null;
      }

      if (this.porcupine) {
        this.porcupine.release();
        this.porcupine = null;
      }
    } catch (error) {
      log.error("Error during wake word service cleanup:", error);
    }
  }
}
