import { useMemo } from "react";
import { Quote } from "lucide-react";

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
  const quote = useMemo(() => {
    const now = new Date();
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000
    );
    return QUOTES[dayOfYear % QUOTES.length];
  }, []);

  return (
    <div className="mb-6 rounded-2xl border bg-card px-5 py-4 flex items-start gap-3">
      <Quote className="w-4 h-4 mt-0.5 ht-accent-text shrink-0 opacity-70" />
      <div className="min-w-0">
        <p className="text-sm italic text-foreground/80 leading-relaxed">"{quote.text}"</p>
        <p className="text-xs text-muted-foreground mt-1.5 font-medium">— {quote.author}</p>
      </div>
    </div>
  );
}
