import { contextBridge, ipcRenderer } from "electron";

const api = {
  // Listening control
  startListening: () => ipcRenderer.invoke("start-listening"),
  stopListening: () => ipcRenderer.invoke("stop-listening"),
  getListeningStatus: () => ipcRenderer.invoke("get-listening-status"),

  // Transcriptions
  getTranscriptions: (limit?: number) =>
    ipcRenderer.invoke("get-transcriptions", limit),
  deleteTranscription: (id: number) =>
    ipcRenderer.invoke("delete-transcription", id),
  clearAllTranscriptions: () => ipcRenderer.invoke("clear-all-transcriptions"),

  // Settings
  getSettings: () => ipcRenderer.invoke("get-settings"),
  updateSettings: (settings: any) =>
    ipcRenderer.invoke("update-settings", settings),

  // Push events from main → renderer
  onOverlayUpdate: (callback: (message: string) => void) => {
    ipcRenderer.on("overlay-update", (_, message) => callback(message));
  },
  onListeningStatusChanged: (callback: (isListening: boolean) => void) => {
    ipcRenderer.on("listening-status-changed", (_, status) => callback(status));
  },
  onNewTranscription: (callback: (transcription: any) => void) => {
    ipcRenderer.on("new-transcription", (_, transcription) => callback(transcription));
  },
  onTranscriptionState: (callback: (state: string) => void) => {
    ipcRenderer.on("transcription-state", (_, state) => callback(state));
  },
};

contextBridge.exposeInMainWorld("electronAPI", api);

export type ElectronAPI = typeof api;
