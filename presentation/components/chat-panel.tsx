"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { ArrowUp, Sparkles, X } from "lucide-react";
import { MAX_CHAT_QUESTION_LENGTH } from "@/lib/chat-constraints";

type ChatPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function ChatPanel({ open, onClose }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { error, messages, sendMessage, status } = useChat();

  const isBusy = status === "submitted" || status === "streaming";
  const latestMessage = messages.at(-1);
  const latestAnswerHasText = latestMessage?.role === "assistant" && latestMessage.parts.some(
    (part) => part.type === "text" && part.text.length > 0,
  );
  const isThinking = isBusy && !latestAnswerHasText;

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = input.trim();

    if (!question || isBusy) {
      return;
    }

    void sendMessage({ text: question });
    setInput("");
  };

  if (!open) {
    return null;
  }

  return (
    <>
      <button className="chat-backdrop" onClick={onClose} aria-label="Close assistant" />
      <aside className="chat-panel" role="dialog" aria-modal="true" aria-labelledby="chat-title">
        <header className="chat-header">
          <span className="chat-title-icon"><Sparkles size={16} /></span>
          <div>
            <h2 id="chat-title">Ask CUVoC</h2>
            <p>Ask about the dashboard data.</p>
          </div>
          <button className="chat-close" onClick={onClose} aria-label="Close assistant" type="button"><X size={19} /></button>
        </header>

        <div className="chat-messages" aria-live="polite">
          {messages.length === 0 && (
            <div className="chat-empty">
              <Sparkles size={18} />
              <p>What would you like to know?</p>
            </div>
          )}

          {messages.map((message) => {
            const text = message.parts
              .filter((part) => part.type === "text")
              .map((part) => part.text)
              .join("");

            if (!text) {
              return null;
            }

            return (
              <div className={`chat-message ${message.role}`} key={message.id}>
                {text}
              </div>
            );
          })}

          {isThinking && <div className="chat-thinking">Thinking...</div>}
          {error && <div className="chat-error">The assistant is unavailable right now. Please try again.</div>}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about the data"
            maxLength={MAX_CHAT_QUESTION_LENGTH}
            disabled={isBusy}
            aria-label="Question for CUVoC"
          />
          <button type="submit" disabled={!input.trim() || isBusy} aria-label="Send question">
            <ArrowUp size={17} />
          </button>
        </form>
      </aside>
    </>
  );
}
