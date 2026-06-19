'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { loadState, saveState, getShareableLink } from '@/lib/storage';
import { generateTimetable, getStats, buildICS } from '@/lib/algorithm';
import { TimetableEvent, Subject, DAYS, SHORT_DAYS } from '@/types';
import { toast } from 'sonner';
import Cursor from '@/components/Cursor';
import GCalModal from '@/components/GCalModal';

const HOURS = Array.from({length:15},(_,i)=>`${String(i+7).padStart(2,'0')}:00`);
const TOTAL_MINS = 14 * 60;

function toPx(time: string, pxPerMin: number) {
  const [h,m] = time.split(':').map(Number);
  return ((h-7)*60+m) * pxPerMin;
}
function durPx(s: string, e: string, pxPerMin: number) {
  const [sh,sm]=s.split(':').map(Number), [eh,em]=e.split(':').map(Number);
  return Math.max(((eh*60+em)-(sh*60+sm))*pxPerMin, 36);
}

export default function TimetablePage() {
  const router = useRouter();
  const [timetable, setTimetable] = useState<TimetableEvent[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [generating, setGenerating] = useState(true);
  const [view, setView] = useState<'week'|'list'>('week');
  const [stats, setStats] = useState<any>(null);
  const [showGcal, setShowGcal] = useState(false);
  const PX = 2.1;

  const generate = useCallback((subs: Subject[]) => {
    setGenerating(true);
    setTimeout(() => {
      const events = generateTimetable(subs);
      setTimetable(events);
      setStats(getStats(subs, events));
      saveState({ timetable:events, generatedAt:new Date().toISOString() });
      setGenerating(false);
    }, 2000);
  }, []);

  useEffect(() => {
    const state = loadState();
    if (!state?.subjects?.length) { router.push('/subjects'); return; }
    setSubjects(state.subjects);
    if (state.timetable?.length) {
      setTimetable(state.timetable);
      setStats(getStats(state.subjects, state.timetable));
      setGenerating(false);
    } else {
      generate(state.subjects);
    }
  }, [router, generate]);

  if (generating) return (
    <main style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', textAlign:'center', padding:40 }}>
      <Cursor />
      <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}}>
        <div style={{ position:'relative', width:96, height:96, margin:'0 auto 28px' }}>
          <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid transparent', borderTopColor:'#6366f1', borderRightColor:'#7c3aed', animation:'spin 1.4s linear infinite' }} />
          <div style={{ position:'absolute', inset:12, borderRadius:'50%', border:'2px solid transparent', borderTopColor:'#f59e0b', borderLeftColor:'#ef4444', animation:'spin 2.2s linear infinite reverse' }} />
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>📚</div>
        </div>
        <h2 style={{ fontFamily:'"DM Serif Display",serif', fontSize:'2rem', marginBottom:12 }}>Building your timetable…</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {['Analysing difficulty…','Matching time preferences…','Distributing sessions…','Adding breaks…'].map((m,i) => (
            <motion.p key={m} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.45+0.2}} style={{ fontSize:13, color:'var(--muted)' }}>{m}</motion.p>
          ))}
        </div>
      </motion.div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  );

  return (
    <main style={{ minHeight:'100vh', background:'var(--bg)' }}>
      <Cursor />
      {showGcal && <GCalModal events={timetable} onClose={()=>setShowGcal(false)} />}

      {/* Nav */}
      <div style={{ position:'sticky', top:0, zIndex:40, background:'rgba(6,6,15,0.9)', backdropFilter:'blur(20px)', borderBottom:'1px solid var(--border)', padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <button onClick={()=>router.push('/subjects')} style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:13, transition:'color 0.2s' }} onMouseEnter={e=>(e.currentTarget.style.color='var(--text)')} onMouseLeave={e=>(e.currentTarget.style.color='var(--muted)')}>← Edit</button>
          <span style={{ color:'var(--border)' }}>|</span>
          <span style={{ fontFamily:'"DM Serif Display",serif', fontSize:'1.1rem' }}>StudySync</span>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ display:'flex', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:3, gap:2 }}>
            {(['week','list'] as const).map(v => (
              <button key={v} onClick={()=>setView(v)} style={{ padding:'6px 14px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12, fontWeight:600, transition:'all 0.2s', background:view===v?'#6366f1':'none', color:view===v?'#fff':'var(--muted)' }}>{v==='week'?'Week':'List'}</button>
            ))}
          </div>
          <button onClick={()=>{const s=loadState();if(s?.subjects)generate(s.subjects)}} style={{ padding:'7px 14px', borderRadius:10, border:'1px solid var(--border)', background:'none', color:'var(--muted)', cursor:'pointer', fontSize:12, transition:'all 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.borderColor='#6366f1';e.currentTarget.style.color='#818cf8'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--muted)'}}>↺ Regenerate</button>
          <button onClick={()=>{const ics=buildICS(timetable);const b=new Blob([ics],{type:'text/calendar'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='studysync.ics';a.click();toast.success('ICS downloaded!')}} style={{ padding:'7px 14px', borderRadius:10, border:'1px solid var(--border)', background:'none', color:'var(--muted)', cursor:'pointer', fontSize:12, transition:'all 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.borderColor='#6366f1';e.currentTarget.style.color='#818cf8'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--muted)'}}>↓ ICS</button>
          <button onClick={()=>{navigator.clipboard.writeText(getShareableLink(timetable));toast.success('Link copied!')}} style={{ padding:'7px 14px', borderRadius:10, border:'1px solid var(--border)', background:'none', color:'var(--muted)', cursor:'pointer', fontSize:12, transition:'all 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.borderColor='#6366f1';e.currentTarget.style.color='#818cf8'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--muted)'}}>🔗 Share</button>
          <button onClick={()=>router.push('/dashboard')} style={{ padding:'7px 14px', borderRadius:10, border:'1px solid var(--border)', background:'none', color:'var(--muted)', cursor:'pointer', fontSize:12, transition:'all 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.borderColor='#6366f1';e.currentTarget.style.color='#818cf8'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--muted)'}}>Dashboard →</button>
        </div>
      </div>

      <div style={{ maxWidth:920, margin:'0 auto', padding:'20px' }}>
        {/* Google Calendar Banner */}
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}
          style={{ background:'linear-gradient(135deg,rgba(66,133,244,0.1),rgba(52,168,83,0.07))', border:'1px solid rgba(66,133,244,0.25)', borderRadius:18, padding:'18px 22px', marginBottom:20, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:180 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <span style={{ fontSize:18 }}>📅</span>
              <span style={{ fontWeight:700, color:'#93c5fd', fontSize:14 }}>One-click Google Calendar export</span>
            </div>
            <p style={{ fontSize:12, color:'rgba(147,197,253,0.7)', lineHeight:1.5 }}>
              {timetable.length} sessions → repeats 16 weeks → <strong style={{ color:'#86efac' }}>30-min + 10-min reminders</strong> on every session
            </p>
          </div>
          <motion.button onClick={()=>setShowGcal(true)} whileHover={{scale:1.03,boxShadow:'0 8px 32px rgba(66,133,244,0.45)'}} whileTap={{scale:0.97}}
            style={{ padding:'12px 22px', borderRadius:14, border:'none', background:'linear-gradient(135deg,#4285f4,#34a853)', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:8, flexShrink:0, position:'relative', overflow:'hidden' }}>
            <span style={{ position:'absolute', inset:0, background:'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.2) 50%,transparent 60%)', backgroundSize:'200% 100%', animation:'shimmer 2.5s infinite 1s' }} />
            <GoogleIcon /> Add to Google Calendar
          </motion.button>
        </motion.div>

        {/* Stats */}
        {stats && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
            {[{icon:'⏱',val:`${stats.totalHours}h`,lbl:'Study hrs/week'},{icon:'📅',val:`${stats.studyDays}/7`,lbl:'Study days'},{icon:'🧘',val:String(stats.freeDays),lbl:'Free days'},{icon:'📚',val:String(stats.sessions),lbl:'Sessions/week'}].map((s,i)=>(
              <motion.div key={s.lbl} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.08}}
                style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'14px 16px' }}>
                <div style={{ fontSize:18, marginBottom:4 }}>{s.icon}</div>
                <div style={{ fontFamily:'"DM Serif Display",serif', fontSize:'1.7rem', color:'var(--text)' }}>{s.val}</div>
                <div style={{ fontSize:11, color:'var(--muted)' }}>{s.lbl}</div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
          {subjects.map(s => (
            <div key={s.id} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:20, background:`${s.color}18`, border:`1px solid ${s.color}40`, fontSize:11, fontWeight:600, color:s.color }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:s.color }} />{s.name}
            </div>
          ))}
        </div>

        {/* Week view */}
        {view === 'week' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:18, overflow:'hidden' }}>
            {/* Header */}
            <div style={{ display:'grid', gridTemplateColumns:'52px repeat(7,1fr)', borderBottom:'1px solid var(--border)' }}>
              <div style={{ padding:10 }} />
              {DAYS.map((d,i) => {
                const has = timetable.some(e=>e.day===i);
                return (
                  <div key={d} style={{ padding:'10px 4px', textAlign:'center', borderLeft:'1px solid var(--border)' }}>
                    <div style={{ fontSize:10, fontWeight:700, color:has?'var(--text)':'var(--muted)', textTransform:'uppercase', letterSpacing:'.5px' }}>{SHORT_DAYS[i]}</div>
                    {has && <div style={{ width:4, height:4, borderRadius:'50%', background:'#6366f1', margin:'4px auto 0' }} />}
                  </div>
                );
              })}
            </div>
            {/* Body */}
            <div style={{ display:'grid', gridTemplateColumns:'52px repeat(7,1fr)' }}>
              {/* Time labels */}
              <div>{HOURS.map(h=><div key={h} style={{ height:32, display:'flex', alignItems:'flex-start', justifyContent:'flex-end', paddingRight:8, paddingTop:3 }}><span style={{ fontSize:9, color:'var(--muted)' }}>{h}</span></div>)}</div>
              {/* Day columns */}
              {DAYS.map((_,di) => (
                <div key={di} style={{ borderLeft:'1px solid #1a1a30', position:'relative', minHeight:HOURS.length*32 }}>
                  {HOURS.map((_,hi) => <div key={hi} style={{ height:32, borderTop:hi>0?'1px solid #1a1a30':'none' }} />)}
                  {timetable.filter(e=>e.day===di).map(ev => (
                    <motion.div key={ev.id} initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}}
                      style={{ position:'absolute', left:2, right:2, top:toPx(ev.startTime,PX), height:durPx(ev.startTime,ev.endTime,PX), background:`${ev.color}22`, border:`1px solid ${ev.color}55`, borderLeft:`3px solid ${ev.color}`, borderRadius:6, padding:'3px 5px', overflow:'hidden' }}>
                      <div style={{ fontSize:9.5, fontWeight:700, color:ev.color, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.subject}</div>
                      <div style={{ fontSize:8.5, color:`${ev.color}bb`, marginTop:1 }}>{ev.startTime}–{ev.endTime}</div>
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* List view */}
        {view === 'list' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {DAYS.map((day,di) => {
              const evs = timetable.filter(e=>e.day===di).sort((a,b)=>a.startTime.localeCompare(b.startTime));
              return (
                <div key={day} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden' }}>
                  <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontWeight:600, fontSize:14 }}>{day}</span>
                    {evs.length===0 && <span style={{ fontSize:12, color:'var(--muted)' }}>Free day 🧘</span>}
                  </div>
                  {evs.length > 0 && (
                    <div style={{ padding:'10px 12px', display:'flex', flexDirection:'column', gap:6 }}>
                      {evs.map(e => (
                        <div key={e.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, background:`${e.color}10`, border:`1px solid ${e.color}30` }}>
                          <div style={{ width:3, height:32, borderRadius:2, background:e.color, flexShrink:0 }} />
                          <div><div style={{ fontWeight:600, fontSize:12, color:e.color }}>{e.subject}</div><div style={{ fontSize:11, color:'var(--muted)' }}>{e.startTime} – {e.endTime}</div></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Bottom GCal CTA */}
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.4}}
          style={{ marginTop:20, padding:'22px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:18, textAlign:'center' }}>
          <p style={{ fontSize:13, color:'var(--muted)', marginBottom:14 }}>Never miss a session — add everything to Google Calendar with reminders</p>
          <motion.button onClick={()=>setShowGcal(true)} whileHover={{scale:1.03}} whileTap={{scale:0.97}}
            style={{ padding:'13px 32px', borderRadius:14, border:'none', background:'linear-gradient(135deg,#4285f4,#34a853)', color:'#fff', cursor:'pointer', fontSize:14, fontWeight:700, display:'inline-flex', alignItems:'center', gap:8, boxShadow:'0 4px 24px rgba(66,133,244,0.35)', position:'relative', overflow:'hidden' }}>
            <span style={{ position:'absolute', inset:0, background:'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.2) 50%,transparent 60%)', backgroundSize:'200% 100%', animation:'shimmer 2.5s infinite 1s' }} />
            <GoogleIcon /> Add to Google Calendar
          </motion.button>
        </motion.div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
    </main>
  );
}

function GoogleIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335"/></svg>;
}
