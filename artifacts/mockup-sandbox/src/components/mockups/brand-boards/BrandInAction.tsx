import './_group.css';
import { Check, Lock, BookOpen, ChevronRight, Flame, Home, BookMarked, Star, User } from 'lucide-react';

const days = [
  { num: 13, title: 'Who is the Holy Spirit?', done: true },
  { num: 14, title: 'Gifts of the Spirit', today: true },
  { num: 15, title: 'Baptism in the Spirit', locked: true },
  { num: 16, title: 'Fruits of the Spirit', locked: true },
];

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: 375,
      margin: '0 auto',
      background: '#FFFFFF',
      borderRadius: 40,
      boxShadow: '0 24px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)',
      overflow: 'hidden',
      minHeight: 780,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
    }}>
      <div style={{ height: 44, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>9:41</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ width: 16, height: 8, borderRadius: 2, background: '#111827', opacity: 0.8 }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#111827', opacity: 0.8 }} />
          <div style={{ width: 22, height: 11, borderRadius: 3, border: '1.5px solid #111827', opacity: 0.8, display: 'flex', alignItems: 'center', padding: '0 2px' }}>
            <div style={{ width: 14, height: 6, borderRadius: 1.5, background: '#111827' }} />
          </div>
        </div>
      </div>

      {children}

      <div style={{
        marginTop: 'auto',
        borderTop: '1px solid #F3F4F6',
        display: 'flex',
        padding: '8px 0 20px',
        background: '#fff',
      }}>
        {[
          { icon: Home, label: 'Home', active: true },
          { icon: BookMarked, label: 'Journal', active: false },
          { icon: Star, label: 'Saints', active: false },
          { icon: User, label: 'Profile', active: false },
        ].map(({ icon: Icon, label, active }) => (
          <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 0' }}>
            <Icon style={{ width: 20, height: 20, color: active ? '#F07830' : '#9CA3AF' }} />
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? '#F07830' : '#9CA3AF' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BrandInAction() {
  return (
    <div className="min-h-screen py-10 px-8" style={{ background: '#F9FAFB', fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
      <div className="mb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#9CA3AF' }}>Brand Board 3</p>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2" style={{ letterSpacing: '-0.03em', color: '#111827' }}>Brand in Action</h1>
        <p style={{ color: '#6B7280' }} className="text-base">Lumen Fidei Day Overview · Direction A: Radiance</p>
      </div>

      <PhoneFrame>
        <div style={{ padding: '4px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #F07830 0%, #F5C030 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'white', opacity: 0.9 }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>Lumen Fidei</span>
            </div>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User style={{ width: 16, height: 16, color: '#6B7280' }} />
            </div>
          </div>
        </div>

        <div style={{
          margin: '0 20px 16px',
          borderRadius: 16,
          background: 'linear-gradient(135deg, #F07830 0%, #E56120 60%, #BE4C14 100%)',
          padding: '16px',
          color: 'white',
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Week 3 of 5 · The Holy Spirit
          </p>
          <p style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: 10 }}>
            Good morning, Maria
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Flame style={{ width: 12, height: 12 }} />
                <span style={{ fontSize: 11, fontWeight: 600 }}>14-day streak</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>13</p>
              <p style={{ fontSize: 10, opacity: 0.7, marginTop: 1 }}>of 30 done</p>
            </div>
          </div>
          <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.2)', borderRadius: 4, height: 4, overflow: 'hidden' }}>
            <div style={{ width: '43%', height: '100%', background: '#F5C030', borderRadius: 4 }} />
          </div>
        </div>

        <div style={{ padding: '0 20px', marginBottom: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>This Week</p>
        </div>

        <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {days.map(d => (
            <div
              key={d.num}
              style={{
                borderRadius: 14,
                padding: '14px',
                background: d.today ? '#F07830' : d.done ? '#FFF7F0' : d.locked ? '#F9FAFB' : '#fff',
                border: d.today ? 'none' : d.done ? '1px solid #FFD0A8' : '1px solid #E5E7EB',
                opacity: d.locked ? 0.5 : 1,
                boxShadow: d.today ? '0 4px 16px rgba(240,120,48,0.35)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: d.today ? 'rgba(255,255,255,0.7)' : '#9CA3AF' }}>
                  Day {d.num}
                </span>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: d.today ? 'rgba(255,255,255,0.2)' : d.done ? '#F07830' : '#F3F4F6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {d.done && <Check style={{ width: 10, height: 10, color: 'white' }} />}
                  {d.locked && <Lock style={{ width: 9, height: 9, color: '#9CA3AF' }} />}
                  {d.today && <BookOpen style={{ width: 9, height: 9, color: 'white' }} />}
                </div>
              </div>
              <p style={{
                fontSize: 13, fontWeight: 600, lineHeight: 1.35, color: d.today ? 'white' : '#111827',
                marginBottom: d.today ? 8 : 0,
              }}>
                {d.title}
              </p>
              {d.today && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>Start now</span>
                  <ChevronRight style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.85)' }} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ margin: '16px 20px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Daily Prayers</p>
          <ChevronRight style={{ width: 14, height: 14, color: '#9CA3AF' }} />
        </div>
        <div style={{ margin: '0 20px', borderRadius: 14, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
          {['Morning Prayers', 'Evening Examen'].map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#fff', borderBottom: i === 0 ? '1px solid #F3F4F6' : 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: '#FFF7F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen style={{ width: 15, height: 15, color: '#F07830' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#374151', flex: 1 }}>{label}</span>
              <ChevronRight style={{ width: 14, height: 14, color: '#D1D5DB' }} />
            </div>
          ))}
        </div>
      </PhoneFrame>
    </div>
  );
}
