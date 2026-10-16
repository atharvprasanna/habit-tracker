import React from "react";
import { createPortal } from "react-dom";
import { BookOpen, Sparkles, TrendingUp, X } from "lucide-react";

// ── Info modal content ────────────────────────────────────────────────────────
export interface InfoTopic {
  id: string;
  icon: React.ReactNode;
  title: string;
  accent: string;
  sections: { heading?: string; items: { icon: string; text: string }[] }[];
  quote?: { text: string; author: string };
}

export const INFO_TOPICS: InfoTopic[] = [
  {
    id: "what",
    icon: <BookOpen className="w-6 h-6" />,
    title: "What is Habit Tracker?",
    accent: "#3b82f6",
    sections: [
      {
        items: [
          { icon: "📅", text: "A visual calendar grid that shows every day of the month — tick off each habit as you go." },
          { icon: "🔥", text: "Tracks streaks automatically so you always know how many days in a row you've been consistent." },
          { icon: "🎯", text: "Set a monthly goal per habit and watch your Achievement column fill up in real time." },
          { icon: "📊", text: "Progress section gives you a bar chart, completion rate, and goal tracker — all in one view." },
          { icon: "🔒", text: "Your data lives entirely on your device. No cloud sync, no tracking — just you and your habits." },
        ],
      },
    ],
  },
  {
    id: "how",
    icon: <Sparkles className="w-6 h-6" />,
    title: "How does it work?",
    accent: "#10b981",
    sections: [
      {
        heading: "Getting started",
        items: [
          { icon: "➕", text: "Click Add New Habit and give it a name — exercise, reading, meditation, anything you want to build." },
          { icon: "🎨", text: "Tap the ⋮ menu on a habit to rename it, pick a colour, or reorder it in the list." },
        ],
      },
      {
        heading: "Daily use",
        items: [
          { icon: "✅", text: "Each day's column has a checkbox. Tick it when you complete the habit — the streak updates instantly." },
          { icon: "🔢", text: "Enter your monthly Goal for each habit. The Achievement column shows how close you are." },
          { icon: "⬅️", text: "Use the month arrows to travel back in time and fill in any days you forgot." },
        ],
      },
      {
        heading: "Progress view",
        items: [
          { icon: "📈", text: "Select any habit from the Progress dropdown to see a full bar chart of completed vs missed days." },
          { icon: "💡", text: "Grey bars = missed days. Coloured bars = completed. Faded area = days still to come." },
        ],
      },
    ],
  },
  {
    id: "why",
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Why does it work?",
    accent: "#f59e0b",
    quote: { text: "What gets measured, gets managed.", author: "Peter Drucker" },
    sections: [
      {
        items: [
          { icon: "👁️", text: "Visibility creates accountability. When you can see blank squares staring back at you, skipping feels costly." },
          { icon: "⛓️", text: "The \"don't break the chain\" effect — streaks build a psychological momentum that makes quitting harder than continuing." },
          { icon: "🧠", text: "Checking a box triggers a small dopamine reward. Over time, the habit itself becomes the reward." },
          { icon: "📐", text: "Measurement removes ambiguity. \"I exercise regularly\" is vague; \"I've hit the gym 18 of 31 days\" is a fact you can act on." },
          { icon: "🔄", text: "Seeing all habits together encourages habit stacking — completing one makes you more likely to complete the next." },
        ],
      },
    ],
  },
];

export function InfoModal({ topic, onClose }: { topic: InfoTopic; onClose: () => void }) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card border rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center gap-4 p-6 rounded-t-2xl"
          style={{ background: `linear-gradient(135deg, ${topic.accent}22 0%, ${topic.accent}08 100%)`, borderBottom: `2px solid ${topic.accent}33` }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${topic.accent}22`, color: topic.accent }}
          >
            {topic.icon}
          </div>
          <h2 className="text-xl font-bold flex-1">{topic.title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quote */}
        {topic.quote && (
          <div
            className="mx-6 mt-5 px-4 py-3 rounded-xl border-l-4 italic text-sm"
            style={{ borderColor: topic.accent, backgroundColor: `${topic.accent}10`, color: topic.accent }}
          >
            <div className="font-medium">"{topic.quote.text}"</div>
            <div className="text-xs mt-1 opacity-70 not-italic">— {topic.quote.author}</div>
          </div>
        )}

        {/* Sections */}
        <div className="p-6 space-y-5">
          {topic.sections.map((section, si) => (
            <div key={si}>
              {section.heading && (
                <div
                  className="text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: topic.accent }}
                >
                  {section.heading}
                </div>
              )}
              <ul className="space-y-3">
                {section.items.map((item, ii) => (
                  <li key={ii} className="flex items-start gap-3">
                    <span className="text-lg leading-tight shrink-0 mt-0.5">{item.icon}</span>
                    <span className="text-sm text-foreground/85 leading-relaxed">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: topic.accent }}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
