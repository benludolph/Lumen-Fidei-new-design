import './_group.css';
import { Check, Lock, Sun, Moon, ChevronRight } from 'lucide-react';

const WEEKS = [
  { num: 1, theme: "Faith & Foundation", color: '#7c5c2e' },
  { num: 2, theme: "Prayer & Surrender", color: '#5a6e3a' },
  { num: 3, theme: "The Holy Spirit", color: '#3a5a7a' },
  { num: 4, theme: "Mary & the Saints", color: '#6a3a6a' },
  { num: 5, theme: "Transformation", color: '#7a4a3a' },
];

const DAY_DATA: { day: number; title: string; subtitle: string; week: number }[] = [
  { day: 1, title: "What is Faith?", subtitle: "Foundation of belief", week: 1 },
  { day: 2, title: "The Creed", subtitle: "Core declarations", week: 1 },
  { day: 3, title: "Grace & Free Will", subtitle: "God's gift & our response", week: 1 },
  { day: 4, title: "Sacred Scripture", subtitle: "Word of God", week: 1 },
  { day: 5, title: "Church's Authority", subtitle: "Tradition & magisterium", week: 1 },
  { day: 6, title: "Weekly Reflection", subtitle: "Consolidate learnings", week: 1 },
  { day: 7, title: "Why We Pray", subtitle: "Conversation with God", week: 2 },
  { day: 8, title: "The Lord's Prayer", subtitle: "Our Father unpacked", week: 2 },
  { day: 9, title: "Lectio Divina", subtitle: "Divine reading practice", week: 2 },
  { day: 10, title: "Surrender & Trust", subtitle: "Letting go of control", week: 2 },
  { day: 11, title: "Rosary & Mary", subtitle: "Praying with our Mother", week: 2 },
  { day: 12, title: "Weekly Reflection", subtitle: "Review and integrate", week: 2 },
  { day: 13, title: "Who is the Holy Spirit?", subtitle: "Third person of Trinity", week: 3 },
  { day: 14, title: "Gifts of the Spirit", subtitle: "Charisms for mission", week: 3 },
  { day: 15, title: "Baptism in the Spirit", subtitle: "Full immersion", week: 3 },
  { day: 16, title: "Fruits of the Spirit", subtitle: "Signs of God's presence", week: 3 },
  { day: 17, title: "Spiritual Warfare", subtitle: "Armor of God", week: 3 },
  { day: 18, title: "Weekly Reflection", subtitle: "Encounter and rest", week: 3 },
  { day: 19, title: "Hail Mary & Her Role", subtitle: "Model of discipleship", week: 4 },
  { day: 20, title: "Communion of Saints", subtitle: "Cloud of witnesses", week: 4 },
  { day: 21, title: "The Rosary Mysteries", subtitle: "Mysteries of salvation", week: 4 },
  { day: 22, title: "Patron Saints", subtitle: "Friends in heaven", week: 4 },
  { day: 23, title: "Marian Apparitions", subtitle: "Heaven's messages", week: 4 },
  { day: 24, title: "Weekly Reflection", subtitle: "Marian consecration", week: 4 },
  { day: 25, title: "Dying to Self", subtitle: "Kenosis & surrender", week: 5 },
  { day: 26, title: "The Beatitudes", subtitle: "Kingdom values", week: 5 },
  { day: 27, title: "Eucharist as Center", subtitle: "Source and summit", week: 5 },
  { day: 28, title: "Living the Gospel", subtitle: "Daily discipleship", week: 5 },
  { day: 29, title: "Evangelization", subtitle: "Go and make disciples", week: 5 },
  { day: 30, title: "Final Reflection", subtitle: "Integration and renewal", week: 5 },
];

const currentDay = 14;
const completedDays = new Set(Array.from({ length: 13 }, (_, i) => i + 1));

export function TimelineScroll() {
  const totalComplete = completedDays.size;
  const progressPct = Math.round((totalComplete / 30) * 100);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'hsl(var(--background))' }}>

      <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest mb-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Lumen Fidei · Track A
            </p>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'hsl(var(--foreground))' }}>
              30-Day Program
            </h1>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold" style={{ color: 'hsl(35 60% 40%)' }}>{totalComplete}</span>
            <span className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}> / 30</span>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>days complete</p>
          </div>
        </div>

        <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all"
            style={{ width: `${progressPct}%`, background: 'hsl(35 60% 40%)' }}
          />
          {WEEKS.map((w, i) => (
            <div
              key={w.num}
              className="absolute inset-y-0 w-px"
              style={{ left: `${((i + 1) / 5) * 100}%`, background: 'hsl(var(--background))', opacity: 0.6 }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          {WEEKS.map(w => (
            <span key={w.num} className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>W{w.num}</span>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {WEEKS.map(week => {
          const days = DAY_DATA.filter(d => d.week === week.num);
          const weekDone = days.filter(d => completedDays.has(d.day)).length;
          const isCurrentWeek = days.some(d => d.day === currentDay);

          return (
            <div key={week.num}>
              <div
                className="sticky top-0 z-10 flex items-center gap-3 px-5 py-2.5"
                style={{ background: 'hsl(var(--background))', borderBottom: '1px solid hsl(var(--border))' }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                  style={{ background: week.color }}
                >
                  {week.num}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold truncate" style={{ color: 'hsl(var(--foreground))' }}>
                    {week.theme}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex gap-0.5">
                    {days.map(d => (
                      <div
                        key={d.day}
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: completedDays.has(d.day)
                            ? week.color
                            : d.day === currentDay
                            ? `${week.color}60`
                            : 'hsl(var(--muted))',
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium" style={{ color: week.color }}>
                    {weekDone}/6
                  </span>
                </div>
              </div>

              <div className="px-5 py-3 flex flex-col gap-2">
                {days.map(({ day, title, subtitle }) => {
                  const isDone = completedDays.has(day);
                  const isToday = day === currentDay;
                  const isLocked = day > currentDay;

                  return (
                    <button
                      key={day}
                      disabled={isLocked}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-left w-full transition-all"
                      style={{
                        background: isToday
                          ? `${week.color}15`
                          : isDone
                          ? 'hsl(40 20% 97%)'
                          : 'hsl(var(--card))',
                        border: isToday
                          ? `2px solid ${week.color}60`
                          : `1.5px solid hsl(var(--border))`,
                        opacity: isLocked ? 0.45 : 1,
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: isDone
                            ? week.color
                            : isToday
                            ? `${week.color}20`
                            : 'hsl(var(--muted))',
                        }}
                      >
                        {isDone
                          ? <Check className="w-4 h-4 text-white" />
                          : isLocked
                          ? <Lock className="w-3.5 h-3.5" style={{ color: 'hsl(var(--muted-foreground))' }} />
                          : <span className="text-xs font-bold" style={{ color: week.color }}>{day}</span>
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-semibold leading-tight truncate"
                          style={{
                            color: 'hsl(var(--foreground))',
                            fontFamily: 'var(--font-serif)',
                          }}
                        >
                          {title}
                        </p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {isToday ? '▶ Continue today' : subtitle}
                        </p>
                      </div>

                      {!isLocked && (
                        <ChevronRight
                          className="w-4 h-4 shrink-0"
                          style={{ color: isToday ? week.color : 'hsl(var(--muted-foreground))' }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
