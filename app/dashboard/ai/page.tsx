"use client";

export const dynamic = "force-dynamic";

import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useHubData } from "@/hooks/use-hub-data";
import { Bot, Send, Zap, ZapOff, Volume2, VolumeX } from "lucide-react";

function relTime(ts: number): string {
  const d = Date.now() - ts;
  if (d < 90_000) return "now";
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

const SUGGESTIONS = [
  "What's my current power draw?",
  "Are there any active anomalies?",
  "Turn on relay 1",
  "How much energy did I use today?",
];

export default function AiPage() {
  const { activeHub } = useHubData();
  const hubId = activeHub?._id;
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = useQuery(
    api.ai.getMessages,
    hubId ? { hubId } : "skip"
  );

  const sendMessage = useAction(api.ai.sendMessage);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const speak = useCallback((text: string, id: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (speakingId === id) {
      setSpeakingId(null);
      return;
    }
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1.05;
    utt.pitch = 1.0;
    utt.onend = () => setSpeakingId(null);
    utt.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utt);
  }, [speakingId]);

  // Stop speech on unmount
  useEffect(() => () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !hubId || sending) return;
    setInput("");
    setError(null);
    setSending(true);
    try {
      await sendMessage({ hubId, content: text });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }, [input, hubId, sending, sendMessage]);

  const msgs = messages ?? [];

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col eg-anim-fade-in">
      {/* Page header */}
      <div className="flex-shrink-0 mb-4">
        <p className="text-[10px] font-semibold tracking-[0.16em] uppercase mb-1.5" style={{ color: "rgba(148,163,184,0.55)" }}>
          Energenius · Function calling
        </p>
        <h1 className="text-2xl font-bold text-white tracking-tight">Energenius</h1>
      </div>

      {/* Chat container */}
      <div
        className="flex-1 flex flex-col rounded-[18px] overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Messages area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
          style={{ minHeight: 0 }}
        >
          {/* Welcome state */}
          {msgs.length === 0 && !sending && (
            <div className="flex flex-col items-center justify-center h-full gap-5 py-10">
              <div
                className="w-16 h-16 rounded-[18px] grid place-items-center"
                style={{
                  background: "rgba(24,227,154,0.12)",
                  border: "1px solid rgba(24,227,154,0.28)",
                  boxShadow: "0 0 30px -6px rgba(24,227,154,0.3)",
                }}
              >
                <Bot size={28} style={{ color: "#18e39a" }} />
              </div>
              <div className="text-center max-w-sm">
                <h2 className="text-[18px] font-bold text-white mb-2">Hi, I'm Energenius</h2>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  Ask about your energy usage, forecasts, today's weather impact, anomalies, or say "turn on relay 1" to control circuits.
                </p>
              </div>
              {hubId && (
                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="px-3 py-1.5 rounded-full text-[12px] transition-all"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "rgba(148,163,184,0.9)",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {!hubId && (
                <p className="text-[12px] mt-2" style={{ color: "rgba(255,107,107,0.8)" }}>
                  No hub connected — complete onboarding first.
                </p>
              )}
            </div>
          )}

          {/* Message list */}
          {msgs.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div key={msg._id} className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar */}
                {!isUser && (
                  <div
                    className="w-8 h-8 rounded-[9px] grid place-items-center flex-shrink-0 mt-0.5"
                    style={{
                      background: "rgba(24,227,154,0.12)",
                      border: "1px solid rgba(24,227,154,0.22)",
                    }}
                  >
                    <Bot size={14} style={{ color: "#18e39a" }} />
                  </div>
                )}
                {/* Bubble */}
                <div
                  className="max-w-[75%] rounded-[16px] px-4 py-2.5"
                  style={
                    isUser
                      ? {
                          background: "rgba(24,227,154,0.14)",
                          border: "1px solid rgba(24,227,154,0.28)",
                          borderBottomRightRadius: 4,
                        }
                      : {
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.10)",
                          borderBottomLeftRadius: 4,
                        }
                  }
                >
                  <p className="text-[13.5px] leading-relaxed text-white whitespace-pre-wrap">
                    {msg.content}
                  </p>
                  {/* Relay action badge */}
                  {msg.relayAction && (
                    <div
                      className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                      style={{
                        background: msg.relayAction.state ? "rgba(24,227,154,0.12)" : "rgba(255,107,107,0.12)",
                        border: `1px solid ${msg.relayAction.state ? "rgba(24,227,154,0.3)" : "rgba(255,107,107,0.3)"}`,
                        color: msg.relayAction.state ? "#18e39a" : "#ff6b6b",
                      }}
                    >
                      {msg.relayAction.state ? <Zap size={10} /> : <ZapOff size={10} />}
                      {msg.relayAction.state ? "ON" : "OFF"} — {msg.relayAction.circuitName}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1.5" style={{ justifyContent: isUser ? "flex-end" : "flex-start" }}>
                    <p
                      className="text-[10px] font-mono"
                      style={{ color: "rgba(88,105,128,0.9)" }}
                    >
                      {relTime(msg.timestamp)}
                    </p>
                    {!isUser && (
                      <button
                        onClick={() => speak(msg.content, msg._id)}
                        title={speakingId === msg._id ? "Stop speaking" : "Read aloud"}
                        className="transition-opacity"
                        style={{ color: speakingId === msg._id ? "#18e39a" : "rgba(88,105,128,0.6)", opacity: 0.9 }}
                      >
                        {speakingId === msg._id
                          ? <VolumeX size={11} />
                          : <Volume2 size={11} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {sending && (
            <div className="flex gap-3">
              <div
                className="w-8 h-8 rounded-[9px] grid place-items-center flex-shrink-0 mt-0.5"
                style={{ background: "rgba(24,227,154,0.12)", border: "1px solid rgba(24,227,154,0.22)" }}
              >
                <Bot size={14} style={{ color: "#18e39a" }} />
              </div>
              <div
                className="rounded-[16px] px-5 py-3 flex items-center gap-1.5"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderBottomLeftRadius: 4,
                }}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: "#18e39a",
                      animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                      display: "inline-block",
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-[10px] text-[12px]"
              style={{ background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", color: "#ff6b6b" }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Input bar */}
        <div
          className="flex-shrink-0 p-3 md:p-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div
            className="flex items-end gap-2 rounded-[16px] px-4 py-2"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <textarea
              className="flex-1 bg-transparent text-white text-[14px] outline-none resize-none placeholder:text-muted-foreground leading-relaxed"
              placeholder={hubId ? "Ask about your energy…" : "Connect a hub first…"}
              rows={1}
              value={input}
              disabled={!hubId || sending}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              style={{ maxHeight: 120, overflowY: "auto" }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || !hubId || sending}
              className="w-9 h-9 rounded-[10px] grid place-items-center flex-shrink-0 transition-all"
              style={
                !input.trim() || !hubId || sending
                  ? { background: "rgba(255,255,255,0.06)", color: "rgba(148,163,184,0.4)" }
                  : {
                      background: "linear-gradient(135deg,#2bf0aa,#10b981)",
                      color: "#03130c",
                      boxShadow: "0 0 16px -4px rgba(24,227,154,0.5)",
                    }
              }
            >
              <Send size={15} />
            </button>
          </div>
          <p className="text-[10px] mt-1.5 text-center" style={{ color: "rgba(88,105,128,0.6)" }}>
            Enter to send · Shift+Enter for new line · AI can control relays
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
