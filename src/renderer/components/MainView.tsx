import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs.js";
import { Button } from "./ui/button.js";
import { HistoryView } from "./HistoryView.js";
import { SettingsView } from "./SettingsView.js";
import { Play, Square, Mic, Keyboard } from "lucide-react";

declare global {
  interface Window {
    electronAPI: {
      startListening: () => Promise<boolean>;
      stopListening: () => Promise<boolean>;
      getListeningStatus: () => Promise<boolean>;
      getTranscriptions: (limit?: number) => Promise<any[]>;
      deleteTranscription: (id: number) => Promise<void>;
      clearAllTranscriptions: () => Promise<void>;
      getSettings: () => Promise<any>;
      updateSettings: (settings: any) => Promise<void>;
      onListeningStatusChanged: (callback: (isListening: boolean) => void) => void;
      onNewTranscription: (callback: (transcription: any) => void) => void;
      onTranscriptionState: (callback: (state: string) => void) => void;
      onOverlayUpdate: (callback: (message: string) => void) => void;
    };
  }
}

type TranscriptionState = "idle" | "recording" | "processing";

export function MainView() {
  const [isListening, setIsListening] = useState(false);
  const [transcriptionState, setTranscriptionState] = useState<TranscriptionState>("idle");
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    // Get initial status
    window.electronAPI.getListeningStatus().then(setIsListening).catch(console.error);

    // Listen for push updates
    window.electronAPI.onListeningStatusChanged((status) => {
      setIsListening(status);
      setToggling(false);
    });

    window.electronAPI.onTranscriptionState((state) => {
      setTranscriptionState(state as TranscriptionState);
    });
  }, []);

  const toggleListening = useCallback(async () => {
    setToggling(true);
    try {
      if (isListening) {
        await window.electronAPI.stopListening();
      } else {
        await window.electronAPI.startListening();
      }
    } catch (error) {
      console.error("Error toggling listening:", error);
      setToggling(false);
    }
  }, [isListening]);

  const statusText = (() => {
    if (toggling) return isListening ? "Stopping..." : "Starting...";
    if (transcriptionState === "recording") return "Recording...";
    if (transcriptionState === "processing") return "Transcribing...";
    return isListening ? "Listening for wake word" : "Idle";
  })();

  const statusColor = (() => {
    if (transcriptionState === "recording") return "bg-red-500";
    if (transcriptionState === "processing") return "bg-yellow-500";
    if (isListening) return "bg-green-500";
    return "bg-gray-500";
  })();

  return (
    <div className="h-screen bg-gray-950 text-white">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
          <div className="px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Mic className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight">NaoNao</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className={`h-1.5 w-1.5 rounded-full ${statusColor} ${isListening && transcriptionState === "idle" ? "animate-pulse" : ""}`} />
                  <p className="text-xs text-gray-400">{statusText}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-gray-600 bg-gray-800/50 rounded-md px-2 py-1">
                <Keyboard className="h-3 w-3" />
                <span>Ctrl+Shift+Space</span>
              </div>
              <Button
                onClick={toggleListening}
                disabled={toggling}
                size="sm"
                className={`transition-all duration-200 ${
                  isListening
                    ? "bg-red-500/90 hover:bg-red-500 text-white shadow-lg shadow-red-500/20"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                }`}
              >
                {isListening ? (
                  <>
                    <Square className="mr-1.5 h-3.5 w-3.5" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="mr-1.5 h-3.5 w-3.5" />
                    Start
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="history" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-8 mt-6 w-fit bg-gray-900/80 border border-gray-800">
            <TabsTrigger value="history" className="data-[state=active]:bg-gray-700/80 data-[state=active]:text-white">
              History
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-gray-700/80 data-[state=active]:text-white">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="flex-1 mt-4 px-8 pb-8 min-h-0">
            <HistoryView />
          </TabsContent>

          <TabsContent value="settings" className="flex-1 mt-4 px-8 pb-8 overflow-y-auto">
            <SettingsView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
