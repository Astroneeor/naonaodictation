import { useEffect, useState, useRef, useCallback } from "react";
import { Label } from "./ui/label.js";
import { Switch } from "./ui/switch.js";
import { Slider } from "./ui/slider.js";
import { Mic, Keyboard, Volume2, Type, Clock } from "lucide-react";

export function SettingsView() {
  const [settings, setSettings] = useState({
    wakeWord: "picovoice",
    sensitivity: 0.5,
    autoType: true,
    silenceThreshold: 500,
    maxRecordingDuration: 60000,
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await window.electronAPI.getSettings();
      setSettings(data);
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-save with debounce
  const autoSave = useCallback((newSettings: typeof settings) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await window.electronAPI.updateSettings(newSettings);
        setSaved(true);
        setTimeout(() => setSaved(false), 1200);
      } catch (error) {
        console.error("Error saving settings:", error);
      }
    }, 400);
  }, []);

  const update = useCallback((patch: Partial<typeof settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      autoSave(next);
      return next;
    });
  }, [autoSave]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      {/* Save indicator */}
      <div className={`text-xs text-green-400 h-4 transition-opacity duration-300 ${saved ? "opacity-100" : "opacity-0"}`}>
        Settings saved
      </div>

      {/* Wake Word */}
      <SettingsCard
        icon={<Mic className="h-4 w-4" />}
        title="Wake Word"
        description="Detected by Porcupine engine"
      >
        <div className="bg-gray-800/50 rounded-md px-3 py-1.5 text-sm font-medium text-blue-400 w-fit">
          "Hey NaoNao"
        </div>
      </SettingsCard>

      {/* Sensitivity */}
      <SettingsCard
        icon={<Volume2 className="h-4 w-4" />}
        title="Wake Word Sensitivity"
        description="Lower = fewer false triggers, higher = more responsive"
      >
        <div className="flex items-center gap-4">
          <Slider
            min={0}
            max={1}
            step={0.05}
            value={[settings.sensitivity]}
            onValueChange={(value) => update({ sensitivity: value[0] })}
            className="flex-1"
          />
          <span className="text-sm font-mono text-gray-300 w-10 text-right">
            {settings.sensitivity.toFixed(2)}
          </span>
        </div>
      </SettingsCard>

      {/* Auto Type */}
      <SettingsCard
        icon={<Type className="h-4 w-4" />}
        title="Auto-Type"
        description="Automatically type transcribed text into the focused window"
      >
        <Switch
          checked={settings.autoType}
          onCheckedChange={(checked) => update({ autoType: checked })}
        />
      </SettingsCard>

      {/* Silence Threshold */}
      <SettingsCard
        icon={<Volume2 className="h-4 w-4" />}
        title="Silence Threshold"
        description="Audio amplitude below this level stops recording"
      >
        <div className="flex items-center gap-4">
          <Slider
            min={100}
            max={2000}
            step={50}
            value={[settings.silenceThreshold]}
            onValueChange={(value) => update({ silenceThreshold: value[0] })}
            className="flex-1"
          />
          <span className="text-sm font-mono text-gray-300 w-12 text-right">
            {settings.silenceThreshold}
          </span>
        </div>
      </SettingsCard>

      {/* Shortcuts info */}
      <SettingsCard
        icon={<Keyboard className="h-4 w-4" />}
        title="Keyboard Shortcuts"
        description="Global shortcuts that work even when NaoNao is in the background"
      >
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Toggle listening</span>
            <kbd className="bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-xs text-gray-300 font-mono">
              Ctrl+Shift+Space
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Stop recording</span>
            <kbd className="bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-xs text-gray-300 font-mono">
              Escape
            </kbd>
          </div>
        </div>
      </SettingsCard>

      {/* Info footer */}
      <div className="text-[10px] text-gray-600 pt-2">
        Whisper turbo model running locally on GPU. Settings are applied immediately.
      </div>
    </div>
  );
}

function SettingsCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-900/60 border border-gray-800/80 rounded-lg p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-gray-400">{icon}</span>
            <Label className="text-sm font-medium text-gray-100">{title}</Label>
          </div>
          <p className="text-xs text-gray-500 mb-3">{description}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
