"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useHubData } from "@/hooks/use-hub-data";
import { Bot, Send, X, Minimize2, Zap, ZapOff, Mic, MicOff } from "lucide-react";

const FAB_SIZE = 56;
const PANEL_W = 380;
const PANEL_H = 560;
const GAP = 12;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function relTime(ts: number): string {
  const d = Date.now() - ts;
  if (d < 90_000) return "now";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

const QUICK_PROMPTS = [
  "What's my current power draw?",
  "Any anomalies right now?",
  "What's the weather today?",
  "Show today's forecast",
];

// All realistic transcriptions of the made-up word "Energenius" across browsers.
// Chrome returns "energy genius" or "energenius"; Safari returns "energy genius" or "energize us".
const WAKE_VARIANTS = ["energenius", "energy genius", "energize us", "energia", "energize"];

function isSpeechSupported() {
  return typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
}

function getSR() {
  return (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition ?? null;
}

function useSpeechRecognition(onResult: (text: string) => void, onEnd?: () => void) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  const manualStopRef = useRef(false);
  const supported = isSpeechSupported();

  const start = useCallback(() => {
    const SR = getSR();
    if (!SR) return;
    const rec = new SR() as any;
    rec.lang = "en-NG";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      const text = e.results[0]?.[0]?.transcript ?? "";
      if (text) onResult(text);
    };
    rec.onend = () => {
      setListening(false);
      if (!manualStopRef.current) onEnd?.();
      manualStopRef.current = false;
    };
    rec.onerror = (e: any) => {
      if (e.error === "aborted") return;
      console.error("[STT] error:", e.error);
      setListening(false);
    };
    rec.start();
    recRef.current = rec;
    manualStopRef.current = false;
    setListening(true);
  }, [onResult, onEnd]);

  const stop = useCallback(() => {
    manualStopRef.current = true;
    recRef.current?.stop();
    setListening(false);
  }, []);

  const startWakeWord = useCallback((onWake: () => void) => {
    const SR = getSR();
    if (!SR) return () => {};
    let aborted = false;

    function createSession() {
      if (aborted) return;
      const rec = new SR() as any;
      rec.lang = "en-NG";
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (e: any) => {
        const transcript = Array.from(e.results as any[])
          .map((r: any) => r[0].transcript)
          .join(" ")
          .toLowerCase();
        if (WAKE_VARIANTS.some((v) => transcript.includes(v))) onWake();
      };
      // Use setTimeout to let the browser fully reset before restarting.
      // Calling rec.start() synchronously inside onend throws InvalidStateError.
      rec.onend = () => { if (!aborted) setTimeout(createSession, 300); };
      rec.onerror = (e: any) => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          aborted = true; // mic permission denied — stop loop
        }
      };
      rec.start();
      recRef.current = rec;
    }

    createSession();
    return () => { aborted = true; recRef.current?.abort(); };
  }, []);

  return { listening, start, stop, startWakeWord, supported };
}

export function EnergeniusWidget() {
  const { activeHub } = useHubData();
  const hubId = activeHub?._id;
  const scrollRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [wakeWordOn, setWakeWordOn] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);

  // --- Draggable position (viewport px, top-left of FAB) ---
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{
    startClientX: number;
    startClientY: number;
    startPosX: number;
    startPosY: number;
    moved: boolean;
  } | null>(null);

  // Init position from localStorage, fallback to bottom-right
  useEffect(() => {
    try {
      const saved = localStorage.getItem("energenius-fab-pos");
      if (saved) {
        const p = JSON.parse(saved) as { x: number; y: number };
        setPos({
          x: clamp(p.x, 0, window.innerWidth - FAB_SIZE),
          y: clamp(p.y, 0, window.innerHeight - FAB_SIZE),
        });
        return;
      }
    } catch {}
    setPos({
      x: window.innerWidth - FAB_SIZE - 24,
      y: window.innerHeight - FAB_SIZE - 24,
    });
  }, []);

  // Persist position
  useEffect(() => {
    if (pos) localStorage.setItem("energenius-fab-pos", JSON.stringify(pos));
  }, [pos]);

  // Drag listeners — added/removed based on dragging state
  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: MouseEvent | TouchEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
      const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
      const dx = cx - d.startClientX;
      const dy = cy - d.startClientY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.moved = true;
      setPos({
        x: clamp(d.startPosX + dx, 0, window.innerWidth - FAB_SIZE),
        y: clamp(d.startPosY + dy, 0, window.innerHeight - FAB_SIZE),
      });
    };

    const onUp = () => {
      if (dragRef.current && !dragRef.current.moved) {
        setOpen((o) => !o);
        setMinimized(false);
      }
      dragRef.current = null;
      setDragging(false);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove as EventListener, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove as EventListener);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragging]);

  const onFabPointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const cx = "touches" in e ? e.touches[0].clientX : e.clientX;
    const cy = "touches" in e ? e.touches[0].clientY : e.clientY;
    const current = pos ?? { x: window.innerWidth - FAB_SIZE - 24, y: window.innerHeight - FAB_SIZE - 24 };
    dragRef.current = {
      startClientX: cx,
      startClientY: cy,
      startPosX: current.x,
      startPosY: current.y,
      moved: false,
    };
    setDragging(true);
    e.preventDefault();
  }, [pos]);

  // --- Panel placement relative to FAB ---
  const panelStyle = pos ? (() => {
    const pw = Math.min(PANEL_W, window.innerWidth - 24);
    // Reserve 60px at top (header) + 80px at bottom (mobile browser chrome + tab bar)
    const ph = Math.min(PANEL_H, window.innerHeight - 140);
    const fabCx = pos.x + FAB_SIZE / 2;
    const left = clamp(fabCx - pw / 2, 12, window.innerWidth - pw - 12);
    const spaceAbove = pos.y - GAP;
    const top = spaceAbove >= ph
      ? spaceAbove - ph
      : clamp(pos.y + FAB_SIZE + GAP, 60, window.innerHeight - ph - 80);
    return { left, top, width: pw, height: ph };
  })() : null;

  // --- AI ---
  const messages = useQuery(api.ai.getMessages, hubId && open ? { hubId } : "skip");
  const sendMessageAction = useAction(api.ai.sendMessage);

  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || !hubId || sending) return;
    setInput("");
    setError(null);
    setSending(true);
    try {
      await sendMessageAction({ hubId, content: text });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }, [input, hubId, sending, sendMessageAction]);

  // Stable ref so onSpeechEnd (stable callback) always reads latest input
  const inputRef = useRef(input);
  useEffect(() => { inputRef.current = input; }, [input]);

  const onSpeechEnd = useCallback(() => {
    const text = inputRef.current.trim();
    if (text) handleSend(text);
  }, [handleSend]);

  const { listening, start: startMic, stop: stopMic, startWakeWord, supported: sttSupported } = useSpeechRecognition(
    (text) => setInput(text),
    onSpeechEnd
  );

  // Auto-enable wake word on mount when STT is supported (always-on like Alexa)
  useEffect(() => {
    if (isSpeechSupported()) setWakeWordOn(true);
  }, []);

  useEffect(() => {
    if (!wakeWordOn) return;
    const stop = startWakeWord(() => {
      setOpen(true);
      setMinimized(false);
      setPulse(true);
      setTimeout(() => setPulse(false), 800);
      // Auto-start mic immediately after wake — user can speak without tapping
      setTimeout(() => startMic(), 400);
    });
    return stop;
  }, [wakeWordOn, startWakeWord, startMic]);

  useEffect(() => {
    if (scrollRef.current && open) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending, open]);

  const msgs = messages ?? [];

  // Wait for position to be initialized before rendering (avoids position flash)
  if (!pos) return null;

  return (
    <>
      {/* Draggable FAB */}
      <button
        onMouseDown={onFabPointerDown}
        onTouchStart={onFabPointerDown}
        className={`fixed z-50 w-14 h-14 rounded-full flex items-center justify-center ${pulse ? "scale-125" : "scale-100"} ${dragging ? "" : "transition-[transform,box-shadow] duration-300"}`}
        style={{
          left: pos.x,
          top: pos.y,
          cursor: dragging ? "grabbing" : "grab",
          background: open
            ? "rgba(255,107,107,0.15)"
            : "linear-gradient(135deg, #2bf0aa 0%, #10b981 100%)",
          border: open
            ? "2px solid rgba(255,107,107,0.4)"
            : "2px solid rgba(43,240,170,0.5)",
          boxShadow: dragging
            ? "0 8px 32px -4px rgba(0,0,0,0.6), 0 0 0 3px rgba(24,227,154,0.25)"
            : open
              ? "0 0 24px -6px rgba(255,107,107,0.5)"
              : "0 0 28px -6px rgba(24,227,154,0.7), 0 4px 20px rgba(0,0,0,0.4)",
          userSelect: "none",
          touchAction: "none",
        }}
        title={open ? "Close Energenius" : "Open Energenius AI · drag to reposition"}
      >
        {open ? <X size={22} style={{ color: "#ff6b6b" }} /> : <Bot size={22} style={{ color: "#03130c" }} />}
      </button>

      {/* Chat panel */}
      {open && !minimized && panelStyle && (
        <div
          className="fixed z-50 flex flex-col rounded-[20px] overflow-hidden"
          style={{
            ...panelStyle,
            background: "rgba(7,11,18,0.92)",
            border: "1px solid rgba(255,255,255,0.10)",
            backdropFilter: "blur(24px) saturate(160%)",
            boxShadow: "0 24px 60px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(24,227,154,0.08)",
            animation: "slideUpIn 0.22s ease-out",
          }}
        >
          {/* Header */}
          <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="w-9 h-9 rounded-[11px] grid place-items-center flex-shrink-0"
              style={{ background: "rgba(24,227,154,0.14)", border: "1px solid rgba(24,227,154,0.28)" }}>
              <Bot size={16} style={{ color: "#18e39a" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-white leading-tight">Energenius</p>
              <p className="text-[10px]" style={{ color: "rgba(148,163,184,0.55)" }}>
                Energenius · AI Energy Assistant
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setWakeWordOn((w) => !w)}
                disabled={!sttSupported}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold transition-all"
                style={!sttSupported
                  ? { background: "rgba(255,255,255,0.04)", color: "rgba(148,163,184,0.3)", border: "1px solid rgba(255,255,255,0.08)", cursor: "not-allowed" }
                  : wakeWordOn
                    ? { background: "rgba(24,227,154,0.18)", color: "#18e39a", border: "1px solid rgba(24,227,154,0.3)" }
                    : { background: "rgba(255,255,255,0.06)", color: "rgba(148,163,184,0.6)", border: "1px solid rgba(255,255,255,0.10)" }}
                title={!sttSupported ? "Voice requires Chrome or Safari" : wakeWordOn ? "Wake word ON — say 'Energenius' to open" : "Enable voice wake word"}
              >
                {wakeWordOn ? <Mic size={10} /> : <MicOff size={10} />}
                {wakeWordOn ? "Wake on" : "Wake"}
              </button>
              <button
                onClick={() => setMinimized(true)}
                className="w-7 h-7 rounded-lg grid place-items-center transition-colors"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(148,163,184,0.5)" }}
              >
                <Minimize2 size={13} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ minHeight: 0 }}>
            {msgs.length === 0 && !sending && (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-6">
                <div className="w-14 h-14 rounded-[16px] grid place-items-center"
                  style={{ background: "rgba(24,227,154,0.10)", border: "1px solid rgba(24,227,154,0.22)", boxShadow: "0 0 24px -6px rgba(24,227,154,0.35)" }}>
                  <Bot size={24} style={{ color: "#18e39a" }} />
                </div>
                <div className="text-center">
                  <p className="text-[15px] font-bold text-white mb-1">Hi, I'm Energenius</p>
                  <p className="text-[12px] leading-relaxed" style={{ color: "rgba(148,163,184,0.7)" }}>
                    Ask about energy, weather impact, anomalies, or control circuits.
                  </p>
                </div>
                {hubId && (
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {QUICK_PROMPTS.map((p) => (
                      <button key={p} onClick={() => handleSend(p)}
                        className="px-2.5 py-1 rounded-full text-[11px] transition-all"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(148,163,184,0.85)" }}>
                        {p}
                      </button>
                    ))}
                  </div>
                )}
                {!hubId && (
                  <p className="text-[11px]" style={{ color: "rgba(255,107,107,0.8)" }}>
                    No hub connected — complete onboarding first.
                  </p>
                )}
              </div>
            )}

            {msgs.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div key={msg._id} className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                  {!isUser && (
                    <div className="w-6 h-6 rounded-[7px] grid place-items-center flex-shrink-0 mt-0.5"
                      style={{ background: "rgba(24,227,154,0.12)", border: "1px solid rgba(24,227,154,0.22)" }}>
                      <Bot size={11} style={{ color: "#18e39a" }} />
                    </div>
                  )}
                  <div className="max-w-[80%] rounded-[14px] px-3 py-2"
                    style={isUser
                      ? { background: "rgba(24,227,154,0.14)", border: "1px solid rgba(24,227,154,0.28)", borderBottomRightRadius: 3 }
                      : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderBottomLeftRadius: 3 }}>
                    <p className="text-[12.5px] leading-relaxed text-white whitespace-pre-wrap">{msg.content}</p>
                    {msg.relayAction && (
                      <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{
                          background: msg.relayAction.state ? "rgba(24,227,154,0.12)" : "rgba(255,107,107,0.12)",
                          border: `1px solid ${msg.relayAction.state ? "rgba(24,227,154,0.28)" : "rgba(255,107,107,0.28)"}`,
                          color: msg.relayAction.state ? "#18e39a" : "#ff6b6b",
                        }}>
                        {msg.relayAction.state ? <Zap size={9} /> : <ZapOff size={9} />}
                        {msg.relayAction.state ? "ON" : "OFF"} — {msg.relayAction.circuitName}
                      </div>
                    )}
                    <p className="text-[9.5px] mt-1 font-mono"
                      style={{ color: "rgba(88,105,128,0.8)", textAlign: isUser ? "right" : "left" }}>
                      {relTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-[7px] grid place-items-center flex-shrink-0"
                  style={{ background: "rgba(24,227,154,0.12)", border: "1px solid rgba(24,227,154,0.22)" }}>
                  <Bot size={11} style={{ color: "#18e39a" }} />
                </div>
                <div className="rounded-[14px] px-4 py-3 flex items-center gap-1"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderBottomLeftRadius: 3 }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "#18e39a", display: "inline-block", animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="text-[11px] px-3 py-2 rounded-[10px]"
                style={{ background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", color: "#ff6b6b" }}>
                {error}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex-shrink-0 p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            {listening && (
              <div className="flex items-center gap-1.5 mb-2 px-3 py-1.5 rounded-lg text-[11px]"
                style={{ background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.18)", color: "#ff6b6b" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                Listening… speak now
              </div>
            )}
            {!sttSupported && (
              <div className="mb-2 px-3 py-1.5 rounded-lg text-[11px]"
                style={{ background: "rgba(255,181,71,0.08)", border: "1px solid rgba(255,181,71,0.2)", color: "rgba(255,181,71,0.9)" }}>
                Voice input requires Chrome or Safari
              </div>
            )}
            <div className="flex items-end gap-1.5 rounded-[14px] px-2 py-2"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
              <button
                onClick={listening ? stopMic : startMic}
                disabled={!sttSupported}
                className="w-8 h-8 rounded-[9px] grid place-items-center flex-shrink-0 transition-colors"
                style={!sttSupported
                  ? { background: "rgba(255,255,255,0.04)", color: "rgba(148,163,184,0.2)", cursor: "not-allowed" }
                  : listening
                    ? { background: "rgba(255,107,107,0.15)", border: "1px solid rgba(255,107,107,0.3)", color: "#ff6b6b" }
                    : { background: "rgba(255,255,255,0.05)", color: "rgba(148,163,184,0.5)" }}>
                {listening ? <MicOff size={13} /> : <Mic size={13} />}
              </button>
              <textarea
                className="flex-1 bg-transparent text-white text-[13px] outline-none resize-none placeholder:text-muted-foreground leading-relaxed"
                placeholder={hubId ? "Ask Energenius…" : "Connect a hub first…"}
                rows={1}
                value={input}
                disabled={!hubId || sending}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                style={{ maxHeight: 100, overflowY: "auto" }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || !hubId || sending}
                className="w-8 h-8 rounded-[9px] grid place-items-center flex-shrink-0 transition-all"
                style={!input.trim() || !hubId || sending
                  ? { background: "rgba(255,255,255,0.06)", color: "rgba(148,163,184,0.3)" }
                  : { background: "linear-gradient(135deg,#2bf0aa,#10b981)", color: "#03130c", boxShadow: "0 0 12px -3px rgba(24,227,154,0.5)" }}>
                <Send size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUpIn {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)     scale(1); }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%            { transform: translateY(-5px); }
        }
      `}</style>
    </>
  );
}
