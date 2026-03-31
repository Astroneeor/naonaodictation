import { useEffect, useState, useRef } from "react";

type OverlayState = "recording" | "processing" | "done" | "no-speech" | "error";

const STATE_CONFIG: Record<OverlayState, { label: string; dotColor: string; showBars: boolean }> = {
  recording:   { label: "Listening...",       dotColor: "bg-red-500",    showBars: true },
  processing:  { label: "Transcribing...",    dotColor: "bg-yellow-400", showBars: false },
  done:        { label: "Done!",              dotColor: "bg-green-400",  showBars: false },
  "no-speech": { label: "No speech detected", dotColor: "bg-gray-400",   showBars: false },
  error:       { label: "Error occurred",     dotColor: "bg-red-400",    showBars: false },
};

export function Overlay() {
  const [state, setState] = useState<OverlayState>("recording");
  const [bars, setBars] = useState(() => Array.from({ length: 10 }, () => 0.3));
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    window.electronAPI?.onOverlayUpdate?.((msg: string) => {
      if (msg in STATE_CONFIG) {
        setState(msg as OverlayState);
      }
    });
  }, []);

  // Smooth bar animation using requestAnimationFrame
  useEffect(() => {
    if (!STATE_CONFIG[state].showBars) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    let frame = 0;
    const animate = () => {
      frame++;
      setBars((prev) =>
        prev.map((_, i) => {
          const t = frame * 0.06;
          const wave = Math.sin(t + i * 0.7) * 0.35 + 0.45;
          const noise = Math.sin(t * 2.3 + i * 1.7) * 0.15;
          return Math.max(0.08, Math.min(1, wave + noise));
        })
      );
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [state]);

  const config = STATE_CONFIG[state];

  return (
    <div className="flex items-center justify-center h-full w-full select-none" style={{ WebkitAppRegion: "drag" } as React.CSSProperties}>
      <div className="bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40 border border-gray-700/30 px-4 py-2.5 flex items-center gap-3">
        {/* Status dot */}
        <div className="relative flex items-center justify-center">
          <div className={`h-2 w-2 rounded-full ${config.dotColor}`} />
          {state === "recording" && (
            <div className={`absolute h-2 w-2 rounded-full ${config.dotColor} animate-ping`} />
          )}
        </div>

        {/* Audio visualizer */}
        {config.showBars && (
          <div className="flex items-center justify-center gap-[2px] h-5 w-12">
            {bars.map((height, i) => (
              <div
                key={i}
                className="w-[3px] bg-gradient-to-t from-blue-500 to-purple-400 rounded-full"
                style={{
                  height: `${height * 100}%`,
                  transition: "height 0.04s linear",
                  opacity: 0.7 + height * 0.3,
                }}
              />
            ))}
          </div>
        )}

        {/* Processing spinner */}
        {state === "processing" && (
          <div className="h-4 w-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        )}

        {/* Status text */}
        <span className="text-white text-xs font-medium tracking-wide">{config.label}</span>
      </div>
    </div>
  );
}
