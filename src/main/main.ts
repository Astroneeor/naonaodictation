// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();

import { app, BrowserWindow, ipcMain, Tray, Menu, globalShortcut } from "electron";
import path from "path";
import started from "electron-squirrel-startup";
import log from "electron-log";
import { WakeWordService } from "./services/wake-word-service.js";
import { RecordingService } from "./services/recording-service.js";
import { TranscriptionService } from "./services/transcription-service.js";
import { DatabaseService } from "./services/database-service.js";
import { TypingService } from "./services/typing-service.js";

if (started) {
  app.quit();
}

// Configure logging
log.transports.file.level = "info";
log.transports.console.level = "debug";

class AppManager {
  private mainWindow: BrowserWindow | null = null;
  private overlayWindow: BrowserWindow | null = null;
  private tray: Tray | null = null;

  // Services
  private wakeWordService: WakeWordService;
  private recordingService: RecordingService;
  private transcriptionService: TranscriptionService;
  private databaseService: DatabaseService;
  private typingService: TypingService;

  private isListening = false;
  private isProcessing = false;

  constructor() {
    this.wakeWordService = new WakeWordService();
    this.recordingService = new RecordingService();
    this.transcriptionService = new TranscriptionService();
    this.databaseService = new DatabaseService();
    this.typingService = new TypingService();
  }

  async initialize() {
    log.info("Initializing NaoNao...");

    // Register IPC handlers FIRST before anything can call them
    this.registerIpcHandlers();

    // Initialize database
    await this.databaseService.initialize();

    // Apply saved settings to services
    const settings = await this.databaseService.getSettings();
    this.recordingService.setSilenceThreshold(settings.silenceThreshold);

    // Create windows
    this.createMainWindow();
    this.createOverlayWindow();

    // Create tray (wrap in try-catch for icon errors)
    try {
      this.createTray();
    } catch (error) {
      log.error("Failed to create tray:", error);
    }

    // Register global shortcuts
    this.registerShortcuts();

    log.info("NaoNao initialized successfully");
  }

  private createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1000,
      height: 700,
      minWidth: 800,
      minHeight: 600,
      show: false,
      title: "NaoNao",
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      this.mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
      this.mainWindow.loadFile(
        path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
      );
    }

    this.mainWindow.on("close", (event: any) => {
      if (!(app as any).isQuitting) {
        event.preventDefault();
        this.mainWindow?.hide();
      }
    });

    // Show window after it finishes loading
    this.mainWindow.once("ready-to-show", () => {
      this.mainWindow?.show();
    });
  }

  private createOverlayWindow() {
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    const overlayWidth = 280;
    const overlayHeight = 70;

    this.overlayWindow = new BrowserWindow({
      width: overlayWidth,
      height: overlayHeight,
      x: Math.floor((screenWidth - overlayWidth) / 2),
      y: screenHeight - overlayHeight - 30,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      this.overlayWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}#overlay`);
    } else {
      this.overlayWindow.loadFile(
        path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
        { hash: "overlay" }
      );
    }

    this.overlayWindow.setIgnoreMouseEvents(false);
  }

  private createTray() {
    const iconPath = app.isPackaged
      ? path.join(process.resourcesPath, "assets", "icon.png")
      : path.join(app.getAppPath(), "src", "assets", "icon.png");

    log.info(`Loading tray icon from: ${iconPath}`);
    this.tray = new Tray(iconPath);

    this.updateTrayMenu();
    this.tray.setToolTip("NaoNao - Voice Dictation");

    this.tray.on("click", () => {
      this.showMainWindow();
    });
  }

  private registerIpcHandlers() {
    ipcMain.handle("start-listening", async () => {
      return await this.startListening();
    });

    ipcMain.handle("stop-listening", async () => {
      return await this.stopListening();
    });

    ipcMain.handle("get-listening-status", () => {
      return this.isListening;
    });

    ipcMain.handle("get-transcriptions", async (_, limit: number = 50) => {
      return await this.databaseService.getRecentTranscriptions(limit);
    });

    ipcMain.handle("get-settings", async () => {
      return await this.databaseService.getSettings();
    });

    ipcMain.handle("update-settings", async (_, settings: any) => {
      const updated = await this.databaseService.updateSettings(settings);

      // Apply settings to services immediately
      if (settings.silenceThreshold !== undefined) {
        this.recordingService.setSilenceThreshold(settings.silenceThreshold);
      }
      if (settings.sensitivity !== undefined) {
        this.wakeWordService.setSensitivity(settings.sensitivity);
      }

      return updated;
    });

    ipcMain.handle("delete-transcription", async (_, id: number) => {
      return await this.databaseService.deleteTranscription(id);
    });

    ipcMain.handle("clear-all-transcriptions", async () => {
      return await this.databaseService.clearAllTranscriptions();
    });
  }

  private registerShortcuts() {
    // Global shortcut to toggle listening
    globalShortcut.register("CommandOrControl+Shift+Space", () => {
      this.toggleListening();
    });

    // Escape key to stop recording
    globalShortcut.register("Escape", () => {
      log.info("Escape key pressed");
      this.recordingService.forceStop();
    });
  }

  private showMainWindow() {
    if (this.mainWindow) {
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  /** Push a status change to the renderer */
  private notifyListeningStatus() {
    this.mainWindow?.webContents.send("listening-status-changed", this.isListening);
  }

  /** Push transcription state to both windows */
  private notifyTranscriptionState(state: string) {
    this.mainWindow?.webContents.send("transcription-state", state);
  }

  private async startListening() {
    if (this.isListening) {
      log.warn("Already listening");
      return false;
    }

    log.info("Starting wake word listener...");
    this.isListening = true;
    this.notifyListeningStatus();
    this.updateTrayMenu();

    try {
      await this.wakeWordService.start(async () => {
        log.info("Wake word detected!");
        await this.handleWakeWord();
      });

      return true;
    } catch (error) {
      log.error("Failed to start listening:", error);
      this.isListening = false;
      this.notifyListeningStatus();
      this.updateTrayMenu();
      return false;
    }
  }

  private async stopListening() {
    if (!this.isListening) {
      return false;
    }

    log.info("Stopping wake word listener...");
    this.isListening = false;
    this.notifyListeningStatus();
    this.updateTrayMenu();

    try {
      await this.wakeWordService.stop();
      return true;
    } catch (error) {
      log.error("Failed to stop listening:", error);
      return false;
    }
  }

  private toggleListening() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  private updateTrayMenu() {
    if (!this.tray) return;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Show NaoNao",
        click: () => this.showMainWindow(),
      },
      {
        label: this.isListening ? "Stop Listening" : "Start Listening",
        click: () => this.toggleListening(),
        id: "toggle-listening",
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          (app as any).isQuitting = true;
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  private async handleWakeWord() {
    if (this.isProcessing) {
      log.warn("Already processing a transcription, ignoring wake word");
      return;
    }

    this.isProcessing = true;
    log.info("Handling wake word detection...");

    // Pause wake word listener to free the audio device for recording
    await this.wakeWordService.stop();

    // Show overlay & notify renderer
    this.showOverlay("recording");
    this.notifyTranscriptionState("recording");

    try {
      const audioPath = await this.recordingService.startRecording();

      this.showOverlay("processing");
      this.notifyTranscriptionState("processing");

      const text = await this.transcriptionService.transcribe(audioPath);

      if (text && text.trim()) {
        const transcription = await this.databaseService.saveTranscription(text, audioPath);

        // Push new transcription to renderer
        this.mainWindow?.webContents.send("new-transcription", transcription);

        // Check if auto-type is enabled
        const settings = await this.databaseService.getSettings();
        if (settings.autoType) {
          await this.typingService.typeText(text);
        }

        this.showOverlay("done");
        this.notifyTranscriptionState("idle");
        log.info(`Transcribed and typed: ${text}`);
      } else {
        this.showOverlay("no-speech");
        this.notifyTranscriptionState("idle");
      }
    } catch (error) {
      log.error("Error handling wake word:", error);
      this.showOverlay("error");
      this.notifyTranscriptionState("idle");
    } finally {
      this.isProcessing = false;
      setTimeout(() => this.hideOverlay(), 2500);

      // Resume wake word listener if we were listening before
      if (this.isListening) {
        try {
          await this.wakeWordService.start(async () => {
            await this.handleWakeWord();
          });
        } catch (error) {
          log.error("Failed to resume wake word listener:", error);
        }
      }
    }
  }

  private showOverlay(state: string) {
    if (this.overlayWindow) {
      this.overlayWindow.webContents.send("overlay-update", state);
      this.overlayWindow.show();
    }
  }

  private hideOverlay() {
    if (this.overlayWindow) {
      this.overlayWindow.hide();
    }
  }

  cleanup() {
    log.info("Cleaning up...");

    globalShortcut.unregisterAll();

    this.wakeWordService.stop();
    this.recordingService.stop();
    this.databaseService.close();
  }

  handleActivate() {
    if (this.mainWindow === null) {
      this.createMainWindow();
    } else {
      this.showMainWindow();
    }
  }
}

// App lifecycle
const appManager = new AppManager();

app.whenReady().then(() => appManager.initialize());
app.on("will-quit", () => appManager.cleanup());
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("activate", () => appManager.handleActivate());

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;
