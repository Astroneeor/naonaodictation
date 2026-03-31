import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";
import log from "electron-log";
import { app } from "electron";

export class TranscriptionService {
  private pythonPath: string;
  private scriptPath: string;

  constructor() {
    // Use system Python (where whisper is installed)
    this.pythonPath = "python";
    
    // Path to our transcription script
    this.scriptPath = app.isPackaged
      ? path.join(process.resourcesPath, "scripts", "transcribe.py")
      : path.join(app.getAppPath(), "scripts", "transcribe.py");
    
    log.info("TranscriptionService initialized - using local Python Whisper");
    log.info(`Script path: ${this.scriptPath}`);
  }

  async transcribe(audioPath: string): Promise<string> {
    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file not found: ${audioPath}`);
    }

    if (!fs.existsSync(this.scriptPath)) {
      throw new Error(`Transcription script not found: ${this.scriptPath}`);
    }

    log.info(`Transcribing audio with local Whisper: ${audioPath}`);

    return new Promise((resolve, reject) => {
      const process = spawn(this.pythonPath, [this.scriptPath, audioPath]);
      
      let stdout = "";
      let stderr = "";

      process.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      process.stderr.on("data", (data) => {
        stderr += data.toString();
        log.info(`Whisper: ${data.toString().trim()}`);
      });

      process.on("close", (code) => {
        if (code === 0) {
          const text = stdout.trim();
          log.info(`Transcription result: ${text}`);
          resolve(text);
        } else {
          const error = `Transcription failed (exit code ${code}): ${stderr}`;
          log.error(error);
          reject(new Error(error));
        }
      });

      process.on("error", (error) => {
        log.error("Failed to start Python process:", error);
        reject(new Error(`Failed to start transcription: ${error.message}`));
      });
    });
  }
}
