import './_group.css';
import { Check, Lock, ChevronDown, ChevronRight, Flame, BookOpen, Star } from 'lucide-react';
import { useState } from 'react';

const WEEKS = [
  { num: 1, theme: "Faith & Foundation" },
  { num: 2, theme: "Prayer & Surrender" },
  { num: 3, theme: "The Holy Spirit" },
  { num: 4, theme: "Mary & the Saints" },
  { num: 5, theme: "Transformation" },
];

const DAY_DATA: { day: number; title: string; week: number; isReflection?: boolean }[] = [
  { day: 1, title: "What is Faith?", week: 1 },
  { day: 2, title: "The Creed", week: 1 },
  { day: 3, title: "Grace & Free Will", week: 1 },
  { day: 4, title: "Sacred Scripture", week: 1 },
  { day: 5, title: "The Church's Authority", week: 1 },
  { day: 6, title: "Weekly Reflection", week: 1, isReflection: true },
  { day: 7, title: "Why We Pray", week: 2 },
  { day: 8, title: "The Lord's Prayer", week: 2 },
  { day: 9, title: "Lectio Divina", week: 2 },
  { day: 10, title: "Surrender & Trust", week: 2 },
  { day: 11, title: "Rosary & Mary", week: 2 },
  { day: 12, title: "Weekly Reflection", week: 2, isReflection: true },
  { day: 13, title: "Who is the Holy Spirit?", week: 3 },
  { day: 14, title: "Gifts of the Spirit", week: 3 },
  { day: 15, title: "Baptism in the Spirit", week: 3 },
  { day: 16, title: "Fruits of the Spirit", week: 3 },
  { day: 17, title: "Spiritual Warfare", week: 3 },
  { day: 18, title: "Weekly Reflection", week: 3, isReflection: true },
  { day: 19, title: "Hail Mary & Her Role", week: 4 },
  { day: 20, title: "Communion of Saints", week: 4 },
  { day: 21, title: "The Rosary Mysteries", week: 4 },
  { day: 22, title: "Patron Saints", week: 4 },
  { day: 23, title: "Marian Apparitions", week: 4 },
  { day: 24, title: "Weekly Reflection", week: 4, isReflection: true },
  { day: 25, title: "Dying to Self", week: 5 },
  { day: 26, title: "The Beatitudes", week: 5 },
  { day: 27, title: "Eucharist as Center", week: 5 },
  { day: 28, title: "Living the Gospel", week: 5 },
  { day: 29, title: "Evangelization", week: 5 },
  { day: 30, title: "Final Reflection", week: 5, isReflection: true },
];

const currentDay = 14;
const completedDays = new Set(Array.from({ length: 13 }, (_, i) => i + 1));

export function CompactList() {
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1, 2, 3]));

  const toggleWeek = (w: number) => {
    setExpandedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(w)) next.delete(w);
      else next.add(w);
      return next;
    });
  };

  const totalDone = completedDays.size;
  const streak = 14;
  const progressPct = Math.round((totalDone / 30) * 100);
  const circumference = 2 * Math.PI * 28;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'hsl(var(--background))' }}>
      <div className="px-5 pt-5 pb-5" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
              <circle
                cx="32" cy="32" r="28" fill="none"
                stroke="hsl(35 60% 40%)" strokeWidth="5"
                strokeDasharray={`${circumference * progressPct / 100} ${circumference}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold leading-none" style={{ color: 'hsl(var(--foreground))' }}>{totalDone}</span>
              <span className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>of 30</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Lumen Fidei
            </p>
            <h1 className="text-2xl font-bold leading-tight" style={{ fontFamily: 'var(--font-serif)', color: 'hsl(var(--foreground))' }}>
              30-Day Program
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'hsl(35 60% 40% / 0.12)', color: 'hsl(35 60% 35%)' }}
              >
                <Flame className="w-3 h-3" /> {streak}-day streak
              </span>
              <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {progressPct}% complete
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {WEEKS.map(week => {
          const days = DAY_DATA.filter(d => d.week === week.num);
          const weekDone = days.filter(d => completedDays.has(d.day)).length;
          const isExpanded = expandedWeeks.has(week.num);
          const hasCurrentDay = days.some(d => d.day === currentDay);
          const allDone = weekDone === 6;

          return (
            <div key={week.num} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
              <button
                onClick={() => toggleWeek(week.num)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left"
                style={{ background: hasCurrentDay ? 'hsl(35 60% 40% / 0.05)' : 'transparent' }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: allDone ? 'hsl(35 60% 40%)' : hasCurrentDay ? 'hsl(35 60% 40% / 0.15)' : 'hsl(var(--muted))',
                  }}
                >
                  {allDone
                    ? <Check className="w-4 h-4 text-white" />
                    : <span className="text-xs font-bold" style={{ color: allDone ? 'white' : 'hsl(35 60% 40%)' }}>{week.num}</span>
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                    Week {week.num} — {week.theme}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex gap-0.5">
                      {days.map(d => (
                        <div
                          key={d.day}
                          className="w-2.5 h-1.5 rounded-sm"
                          style={{
                            background: completedDays.has(d.day)
                              ? 'hsl(35 60% 40%)'
                              : d.day === currentDay
                              ? 'hsl(35 60% 40% / 0.4)'
                              : 'hsl(var(--muted))',
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {weekDone} / 6
                    </span>
                  </div>
                </div>

                {isExpanded
                  ? <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
                  : <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
                }
              </button>

              {isExpanded && (
                <div style={{ borderTop: '1px solid hsl(var(--border))' }}>
                  {days.map(({ day, title, isReflection }, idx) => {
                    const isDone = completedDays.has(day);
                    const isToday = day === currentDay;
                    const isLocked = day > currentDay;
                    const isLast = idx === days.length - 1;

                    return (
                      <button
                        key={day}
                        disabled={isLocked}
                        className="w-full flex items-center gap-3 px-5 py-3 text-left"
                        style={{
                          background: isToday ? 'hsl(35 60% 40% / 0.08)' : 'transparent',
                          borderBottom: isLast ? 'none' : '1px solid hsl(var(--border))',
                          opacity: isLocked ? 0.4 : 1,
                        }}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            background: isDone
                              ? 'hsl(35 60% 40%)'
                              : isToday
                              ? 'hsl(35 60% 40% / 0.15)'
                              : 'hsl(var(--muted))',
                          }}
                        >
                          {isDone
                            ? <Check className="w-3.5 h-3.5 text-white" />
                            : isLocked
                            ? <Lock className="w-3 h-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
                            : isReflection
                            ? <Star className="w-3 h-3" style={{ color: 'hsl(35 60% 40%)' }} />
                            : <BookOpen className="w-3 h-3" style={{ color: 'hsl(35 60% 40%)' }} />
                          }
                        </div>

                        <div className="flex items-baseline gap-2 min-w-0 flex-1">
                          <span
                            className="text-xs font-semibold shrink-0"
                            style={{ color: 'hsl(var(--muted-foreground))' }}
                          >
                            {day}
                          </span>
                          <span
                            className="text-sm font-medium truncate"
                            style={{
                              color: isToday ? 'hsl(35 60% 30%)' : 'hsl(var(--foreground))',
                              fontWeight: isToday ? 600 : 500,
                            }}
                          >
                            {title}
                          </span>
                          {isToday && (
                            <span
                              className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                              style={{ background: 'hsl(35 60% 40%)', color: 'white' }}
                            >
                              Today
                            </span>
                          )}
                        </div>

                        {!isLocked && !isToday && (
                          <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(var(--muted-foreground))' }} />
                        )}
                        {isToday && (
                          <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'hsl(35 60% 40%)' }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
