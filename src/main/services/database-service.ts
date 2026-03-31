import * as path from "path";
import { app } from "electron";
import * as fs from "fs";
import log from "electron-log";

interface Transcription {
  id: number;
  text: string;
  audioPath: string | null;
  timestamp: string;
}

interface Settings {
  wakeWord: string;
  sensitivity: number;
  autoType: boolean;
  silenceThreshold: number;
  maxRecordingDuration: number;
}

interface DatabaseData {
  transcriptions: Transcription[];
  settings: Settings;
  nextId: number;
}

export class DatabaseService {
  private dbPath: string = "";
  private data: DatabaseData = {
    transcriptions: [],
    settings: {
      wakeWord: "picovoice",
      sensitivity: 0.5,
      autoType: true,
      silenceThreshold: 500,
      maxRecordingDuration: 60000,
    },
    nextId: 1,
  };

  async initialize(): Promise<void> {
    this.dbPath = path.join(app.getPath("userData"), "naonao-data.json");
    log.info(`Initializing database at: ${this.dbPath}`);

    // Create directory if it doesn't exist
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Load existing data or create new file
    if (fs.existsSync(this.dbPath)) {
      try {
        const fileData = fs.readFileSync(this.dbPath, "utf-8");
        this.data = JSON.parse(fileData);
        log.info("Loaded existing database");
      } catch (error) {
        log.error("Failed to load database, starting fresh:", error);
        this.save();
      }
    } else {
      this.save();
      log.info("Created new database");
    }
  }

  private save(): void {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (error) {
      log.error("Failed to save database:", error);
    }
  }

  async saveTranscription(
    text: string,
    audioPath: string | null = null
  ): Promise<Transcription> {
    const transcription: Transcription = {
      id: this.data.nextId++,
      text,
      audioPath,
      timestamp: new Date().toISOString(),
    };

    this.data.transcriptions.unshift(transcription); // Add to beginning
    
    // Keep only last 1000 transcriptions
    if (this.data.transcriptions.length > 1000) {
      this.data.transcriptions = this.data.transcriptions.slice(0, 1000);
    }

    this.save();
    return transcription;
  }

  async getRecentTranscriptions(limit: number = 50): Promise<Transcription[]> {
    return this.data.transcriptions.slice(0, limit);
  }

  async deleteTranscription(id: number): Promise<void> {
    this.data.transcriptions = this.data.transcriptions.filter(
      (t) => t.id !== id
    );
    this.save();
  }

  async clearAllTranscriptions(): Promise<void> {
    this.data.transcriptions = [];
    this.save();
  }

  async getSettings(): Promise<Settings> {
    return { ...this.data.settings };
  }

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    this.data.settings = {
      ...this.data.settings,
      ...settings,
    };
    this.save();
    return this.getSettings();
  }

  close(): void {
    this.save();
    log.info("Database closed");
  }
}
