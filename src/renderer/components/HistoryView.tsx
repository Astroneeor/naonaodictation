import { useEffect, useState, useCallback } from "react";
import { Button } from "./ui/button.js";
import { ScrollArea } from "./ui/scroll-area.js";
import { Trash2, Copy, Check, Search, XCircle } from "lucide-react";

interface Transcription {
  id: number;
  text: string;
  audioPath: string | null;
  timestamp: string;
}

export function HistoryView() {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    loadTranscriptions();

    // Auto-add new transcriptions as they come in
    window.electronAPI.onNewTranscription((transcription: Transcription) => {
      setTranscriptions((prev) => [transcription, ...prev]);
    });
  }, []);

  const loadTranscriptions = async () => {
    try {
      const data = await window.electronAPI.getTranscriptions(100);
      setTranscriptions(data);
    } catch (error) {
      console.error("Error loading transcriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await window.electronAPI.deleteTranscription(id);
      setTranscriptions((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Error deleting transcription:", error);
    }
  };

  const handleClearAll = async () => {
    try {
      await window.electronAPI.clearAllTranscriptions();
      setTranscriptions([]);
    } catch (error) {
      console.error("Error clearing transcriptions:", error);
    }
  };

  const handleCopy = useCallback((id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }, []);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filtered = searchQuery
    ? transcriptions.filter((t) =>
        t.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : transcriptions;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (transcriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-12 w-12 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-4">
          <Copy className="h-5 w-5 text-gray-600" />
        </div>
        <p className="text-gray-400 text-sm font-medium">No transcriptions yet</p>
        <p className="text-gray-600 text-xs mt-1">
          Say "Hey NaoNao" or press Ctrl+Shift+Space to start dictating
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search & controls bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search transcriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-8 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-gray-700 focus:ring-1 focus:ring-gray-700 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <XCircle className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
        </div>
        {transcriptions.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-xs text-gray-500 hover:text-red-400 hover:bg-gray-800/50"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Transcription list */}
      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-2">
          {filtered.map((transcription) => (
            <div
              key={transcription.id}
              className="group bg-gray-900/60 border border-gray-800/80 rounded-lg p-4 hover:bg-gray-900 hover:border-gray-700/80 transition-all duration-150"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-100 text-sm leading-relaxed">{transcription.text}</p>
                  <span className="text-[10px] text-gray-600 mt-2 block">
                    {formatDate(transcription.timestamp)}
                  </span>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(transcription.id, transcription.text)}
                    className="h-7 w-7 p-0 text-gray-500 hover:text-blue-400 hover:bg-gray-800"
                  >
                    {copiedId === transcription.id ? (
                      <Check className="h-3.5 w-3.5 text-green-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(transcription.id)}
                    className="h-7 w-7 p-0 text-gray-500 hover:text-red-400 hover:bg-gray-800"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
