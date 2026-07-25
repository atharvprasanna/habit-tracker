import { useMemo, useEffect, useRef } from "react";

const QUOTES = [
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "A habit is a formula our brain automatically follows.", author: "Charles Duhigg" },
  { text: "First forget inspiration. Habit is more dependable.", author: "Octavia Butler" },
  { text: "The chains of habit are too light to be felt until they are too heavy to be broken.", author: "Warren Buffett" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "Consistency is the hallmark of the unimaginative.", author: "Oscar Wilde" },
  { text: "Your net worth to the world is usually determined by what remains after your bad habits are subtracted from your good ones.", author: "Benjamin Franklin" },
  { text: "Habits are the invisible architecture of daily life.", author: "Gretchen Rubin" },
  { text: "The difference between who you are and who you want to be is what you do.", author: "Unknown" },
  { text: "Don't break the chain.", author: "Jerry Seinfeld" },
  { text: "In essence, if we want to direct our lives, we must take control of our consistent actions.", author: "Tony Robbins" },
  { text: "Excellence is not a singular act, but a habit. You are what you repeatedly do.", author: "Shaquille O'Neal" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "The only way to do great work is to love what you do — and build habits that support it.", author: "Steve Jobs" },
  { text: "Winning is a habit. Unfortunately, so is losing.", author: "Vince Lombardi" },
  { text: "You'll never change your life until you change something you do daily.", author: "John C. Maxwell" },
  { text: "Successful people are simply those with successful habits.", author: "Brian Tracy" },
  { text: "It's not what we do once in a while that shapes our lives. It's what we do consistently.", author: "Tony Robbins" },
  { text: "Habit is the intersection of knowledge, skill, and desire.", author: "Stephen Covey" },
  { text: "The groundwork of all happiness is health — and healthy habits.", author: "Leigh Hunt" },
  { text: "Make each day your masterpiece.", author: "John Wooden" },
  { text: "Progress is the sum of small wins stacked deliberately over time.", author: "Robin Sharma" },
  { text: "One day or day one. You decide.", author: "Unknown" },
  { text: "A year from now you may wish you had started today.", author: "Karen Lamb" },
  { text: "What gets measured, gets managed.", author: "Peter Drucker" },
  { text: "The secret to getting ahead is getting started.", author: "Mark Twain" },
];

export default function QuoteOfDay() {
  const cardRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const authorRef = useRef<HTMLDivElement>(null);

  const quote = useMemo(() => {
    const now = new Date();
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000
    );
    return QUOTES[dayOfYear % QUOTES.length];
  }, []);

  // Fade + slide up on mount
  useEffect(() => {
    const card = cardRef.current;
    const text = textRef.current;
    const author = authorRef.current;
    if (!card || !text || !author) return;

    // Start hidden
    card.style.opacity = "0";
    card.style.transform = "translateY(10px)";
    text.style.opacity = "0";
    text.style.transform = "translateY(6px)";
    author.style.opacity = "0";

    // Card fades in
    requestAnimationFrame(() => {
      card.style.transition = "opacity 0.5s ease, transform 0.5s ease";
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";

      // Text slides in slightly after
      setTimeout(() => {
        text.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        text.style.opacity = "1";
        text.style.transform = "translateY(0)";
      }, 150);

      // Author fades in last
      setTimeout(() => {
        author.style.transition = "opacity 0.5s ease";
        author.style.opacity = "1";
      }, 350);
    });
  }, []);

  return (
    <div
      ref={cardRef}
      className="mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/30 dark:via-amber-950/20 dark:to-yellow-950/10 border border-orange-100 dark:border-orange-900/40 px-6 py-5 group cursor-default"
      style={{ transition: "box-shadow 0.3s ease, transform 0.3s ease, border-color 0.3s ease" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 30px rgba(249,115,22,0.15)";
        e.currentTarget.style.borderColor = "rgba(249,115,22,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "";
      }}
    >
      {/* Decorative large quote mark — grows on hover */}
      <span
        className="absolute -top-3 -left-1 text-8xl font-serif leading-none select-none pointer-events-none"
        style={{
          color: "#f97316",
          opacity: 0.12,
          transition: "opacity 0.3s ease, transform 0.3s ease",
          transformOrigin: "top left",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.opacity = "0.22";
          (e.currentTarget as HTMLElement).style.transform = "scale(1.15)";
        }}
      >
        "
      </span>

      {/* Animated left accent bar */}
      <div
        className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full"
        style={{
          background: "linear-gradient(to bottom, #f97316, #fbbf24)",
          transform: "scaleY(0)",
          transformOrigin: "top",
          transition: "transform 0.35s ease",
        }}
        ref={(el) => {
          if (!el) return;
          const card = el.closest(".group");
          if (!card) return;
          card.addEventListener("mouseenter", () => { el.style.transform = "scaleY(1)"; });
          card.addEventListener("mouseleave", () => { el.style.transform = "scaleY(0)"; });
        }}
      />

      {/* Content */}
      <div className="relative">
        <p
          ref={textRef}
          className="text-sm md:text-[15px] italic text-foreground/85 leading-relaxed font-medium"
          style={{ transition: "color 0.3s ease" }}
        >
          {quote.text}
        </p>
        <div ref={authorRef} className="flex items-center gap-2 mt-3">
          <div
            className="h-px flex-1 bg-orange-200 dark:bg-orange-800/50"
            style={{ transition: "background-color 0.3s ease" }}
          />
          <p
            className="text-xs font-semibold tracking-wide"
            style={{ color: "#f97316", transition: "letter-spacing 0.3s ease" }}
          >
            {quote.author}
          </p>
        </div>
      </div>
    </div>
  );
}
