import './_group.css';
import { Check, Lock, BookOpen, ChevronRight, Flame } from 'lucide-react';

const WEEKS = [
  { num: 1, theme: "Faith & Foundation" },
  { num: 2, theme: "Prayer & Surrender" },
  { num: 3, theme: "The Holy Spirit" },
  { num: 4, theme: "Mary & the Saints" },
  { num: 5, theme: "Transformation" },
];

const ALL_DAYS: { day: number; title: string; week: number }[] = [
  { day: 1, title: "What is Faith?", week: 1 },
  { day: 2, title: "The Creed", week: 1 },
  { day: 3, title: "Grace & Free Will", week: 1 },
  { day: 4, title: "Sacred Scripture", week: 1 },
  { day: 5, title: "The Church's Authority", week: 1 },
  { day: 6, title: "Weekly Reflection", week: 1 },
  { day: 7, title: "Why We Pray", week: 2 },
  { day: 8, title: "The Lord's Prayer", week: 2 },
  { day: 9, title: "Lectio Divina", week: 2 },
  { day: 10, title: "Surrender & Trust", week: 2 },
  { day: 11, title: "Rosary & Mary", week: 2 },
  { day: 12, title: "Weekly Reflection", week: 2 },
  { day: 13, title: "Who is the Holy Spirit?", week: 3 },
  { day: 14, title: "Gifts of the Spirit", week: 3 },
  { day: 15, title: "Baptism in the Spirit", week: 3 },
  { day: 16, title: "Fruits of the Spirit", week: 3 },
  { day: 17, title: "Spiritual Warfare", week: 3 },
  { day: 18, title: "Weekly Reflection", week: 3 },
  { day: 19, title: "Hail Mary & Her Role", week: 4 },
  { day: 20, title: "Communion of Saints", week: 4 },
  { day: 21, title: "The Rosary Mysteries", week: 4 },
  { day: 22, title: "Patron Saints", week: 4 },
  { day: 23, title: "Marian Apparitions", week: 4 },
  { day: 24, title: "Weekly Reflection", week: 4 },
  { day: 25, title: "Dying to Self", week: 5 },
  { day: 26, title: "The Beatitudes", week: 5 },
  { day: 27, title: "Eucharist as Center", week: 5 },
  { day: 28, title: "Living the Gospel", week: 5 },
  { day: 29, title: "Evangelization", week: 5 },
  { day: 30, title: "Final Reflection", week: 5 },
];

const currentDay = 14;
const completedDays = new Set(Array.from({ length: 13 }, (_, i) => i + 1));

export function WeekFocus() {
  const activeWeek = WEEKS[2];
  const weekDays = ALL_DAYS.filter(d => d.week === activeWeek.num);
  const completedCount = ALL_DAYS.filter(d => completedDays.has(d.day)).length;
  const progress = Math.round((completedCount / 30) * 100);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'hsl(var(--background))' }}>

      <div style={{ background: 'hsl(35 60% 40%)', color: 'hsl(40 20% 98%)' }} className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-medium opacity-70 uppercase tracking-widest mb-1">Lumen Fidei · Track A</p>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-serif)' }}>
              {activeWeek.theme}
            </h1>
          </div>
          <div className="flex flex-col items-center">
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="23" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                <circle
                  cx="28" cy="28" r="23" fill="none"
                  stroke="rgba(255,255,255,0.9)" strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 23 * progress / 100} ${2 * Math.PI * 23}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-bold leading-none">{completedCount}</span>
                <span className="text-[9px] opacity-70">/{30}</span>
              </div>
            </div>
            <span className="text-[10px] opacity-70 mt-1">days done</span>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {WEEKS.map(w => {
            const weekDays = ALL_DAYS.filter(d => d.week === w.num);
            const weekDone = weekDays.filter(d => completedDays.has(d.day)).length;
            const isActive = w.num === activeWeek.num;
            const isCompleted = weekDone === 6;
            return (
              <button
                key={w.num}
                className="flex flex-col items-center shrink-0 rounded-xl px-3 py-2 text-center transition-all"
                style={{
                  background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                  border: isActive ? '1.5px solid rgba(255,255,255,0.6)' : '1.5px solid transparent',
                  minWidth: 64,
                }}
              >
                <span className="text-[10px] opacity-60 font-medium mb-0.5">WK {w.num}</span>
                <div className="flex gap-0.5 mt-1">
                  {weekDays.map(d => (
                    <div
                      key={d.day}
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: completedDays.has(d.day)
                          ? 'rgba(255,255,255,0.9)'
                          : d.day === currentDay
                          ? 'rgba(255,255,255,0.5)'
                          : 'rgba(255,255,255,0.15)',
                      }}
                    />
                  ))}
                </div>
                <span className="text-[10px] mt-1 opacity-70">{weekDone}/6</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 pt-5 pb-2">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
            Week 3 · Days 13 – 18
          </h2>
          <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: 'hsl(35 60% 40% / 0.12)', color: 'hsl(35 60% 35%)' }}>
            <Flame className="w-3 h-3" /> Day {currentDay} today
          </span>
        </div>
      </div>

      <div className="flex-1 px-5 pb-6">
        <div className="grid grid-cols-2 gap-3">
          {weekDays.map(({ day, title }) => {
            const isDone = completedDays.has(day);
            const isToday = day === currentDay;
            const isLocked = day > currentDay;

            return (
              <button
                key={day}
                disabled={isLocked}
                className="relative rounded-xl p-4 text-left transition-all overflow-hidden"
                style={{
                  background: isToday
                    ? 'hsl(35 60% 40%)'
                    : isDone
                    ? 'hsl(35 40% 92%)'
                    : isLocked
                    ? 'hsl(40 15% 92%)'
                    : 'hsl(40 30% 99%)',
                  border: isToday
                    ? 'none'
                    : `1.5px solid hsl(${isLocked ? '40 15% 86%' : '40 15% 88%'})`,
                  opacity: isLocked ? 0.5 : 1,
                  boxShadow: isToday ? '0 4px 20px hsl(35 60% 40% / 0.3)' : isDone ? 'none' : '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: isToday ? 'rgba(255,255,255,0.7)' : 'hsl(var(--muted-foreground))' }}
                  >
                    Day {day}
                  </span>
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                      background: isDone
                        ? 'hsl(35 60% 40%)'
                        : isToday
                        ? 'rgba(255,255,255,0.2)'
                        : isLocked
                        ? 'hsl(40 15% 85%)'
                        : 'hsl(40 20% 94%)',
                    }}
                  >
                    {isDone && <Check className="w-3 h-3 text-white" />}
                    {isLocked && !isDone && <Lock className="w-2.5 h-2.5" style={{ color: 'hsl(var(--muted-foreground))' }} />}
                    {isToday && <BookOpen className="w-2.5 h-2.5 text-white" />}
                  </div>
                </div>

                <p
                  className="text-sm font-semibold leading-snug"
                  style={{
                    color: isToday ? 'white' : 'hsl(var(--foreground))',
                    fontFamily: 'var(--font-serif)',
                  }}
                >
                  {title}
                </p>

                {isToday && (
                  <div className="mt-3 flex items-center gap-1"
                    style={{ color: 'rgba(255,255,255,0.8)' }}>
                    <span className="text-xs font-medium">Start lesson</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
