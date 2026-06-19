'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { loadState, clearState } from '@/lib/storage';
import { getStats } from '@/lib/algorithm';
import { TimetableEvent, Subject, DAYS, SHORT_DAYS } from '@/types';
import Cursor from '@/components/Cursor';
import GCalModal from '@/components/GCalModal';

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetable, setTimetable] = useState<TimetableEvent[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [studied, setStudied] = useState<number[]>([]);
  const [showGcal, setShowGcal] = useState(false);

  useEffect(() => {
    const s = loadState();
    if (!s?.timetable?.length) { router.push('/'); return; }
    setProfile(s.profile);
    setSubjects(s.subjects||[]);
    setTimetable(s.timetable);
    setStats(getStats(s.subjects||[], s.timetable));
    try { const sv=localStorage.getItem('ss_studied'); if(sv) setStudied(JSON.parse(sv)); } catch {}
  }, [router]);

  const toggleStudied = (d: number) => {
    const next = studied.includes(d) ? studied.filter(x=>x!==d) : [...studied,d];
    setStudied(next);
    try { localStorage.setItem('ss_studied', JSON.stringify(next)); } catch {}
  };

  const todayDay = (new Date().getDay()+6)%7;
  const todaySess = timetable.filter(e=>e.day===todayDay).sort((a,b)=>a.startTime.localeCompare(b.startTime));

  const getDur = (s: string, e: string) => {
    const [sh,sm]=s.split(':').map(Number),[eh,em]=e.split(':').map(Number);
    return ((eh*60+em)-(sh*60+sm))/60;
  };

  return (
    <main style={{ minHeight:'100vh', background:'var(--bg)', padding:'24px 20px', position:'relative' }}>
      <Cursor />
      {showGcal && <GCalModal events={timetable} onClose={()=>setShowGcal(false)} />}
      <div style={{ position:'fixed', top:0, right:'10%', width:400, height:400, background:'radial-gradient(circle,rgba(99,102,241,0.06) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />

      <div style={{ maxWidth:720, margin:'0 auto', position:'relative', zIndex:1 }}>
        {/* Header */}
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12, paddingTop:8 }}>
          <div>
            <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4, letterSpacing:'.5px', textTransform:'uppercase' }}>Dashboard</div>
            <h1 style={{ fontFamily:'"DM Serif Display",serif', fontSize:'2.2rem', marginBottom:4 }}>Hey, {profile?.name?.split(' ')[0]||'there'} 👋</h1>
            <p style={{ color:'var(--muted)', fontSize:13 }}>{profile?.college} · {profile?.semester}</p>
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button onClick={()=>router.push('/timetable')} style={{ padding:'10px 20px', borderRadius:12, border:'1px solid #6366f1', background:'rgba(99,102,241,0.1)', color:'#818cf8', cursor:'pointer', fontSize:13, fontWeight:600, transition:'all 0.2s' }} onMouseEnter={e=>(e.currentTarget.style.background='rgba(99,102,241,0.2)')} onMouseLeave={e=>(e.currentTarget.style.background='rgba(99,102,241,0.1)')}>View Timetable</button>
            <button onClick={()=>{if(confirm('Reset everything?')){clearState();router.push('/')}}} style={{ padding:'10px 20px', borderRadius:12, border:'1px solid var(--border)', background:'none', color:'var(--muted)', cursor:'pointer', fontSize:13, transition:'all 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.borderColor='#ef4444';e.currentTarget.style.color='#ef4444'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--muted)'}}>Reset</button>
          </div>
        </motion.div>

        {/* Stats */}
        {stats && (
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
            style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
            {[{i:'⏱',v:`${stats.totalHours}h`,l:'hrs/week',c:'#6366f1'},{i:'📚',v:stats.sessions,l:'sessions',c:'#ec4899'},{i:'🧘',v:stats.freeDays,l:'free days',c:'#10b981'},{i:'✅',v:`${studied.length}/7`,l:'studied',c:'#f59e0b'}].map((s,i)=>(
              <motion.div key={s.l} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.15+i*0.07}}
                style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'14px 16px' }}>
                <div style={{ fontSize:20, marginBottom:4 }}>{s.i}</div>
                <div style={{ fontFamily:'"DM Serif Display",serif', fontSize:'1.7rem', color:s.c }}>{s.v}</div>
                <div style={{ fontSize:11, color:'var(--muted)' }}>{s.l}</div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Main grid */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {/* Today */}
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.25}}
            style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:18, padding:22 }}>
            <div style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>Today — {DAYS[todayDay]}</div>
            <p style={{ fontSize:12, color:'var(--muted)', marginBottom:14 }}>
              {todaySess.length ? `${todaySess.length} session${todaySess.length!==1?'s':''}` : 'Free day! Rest up 🌿'}
            </p>
            {todaySess.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {todaySess.map(e => (
                  <div key={e.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, background:`${e.color}10`, border:`1px solid ${e.color}30` }}>
                    <div style={{ width:3, height:32, borderRadius:2, background:e.color, flexShrink:0 }} />
                    <div><div style={{ fontWeight:600, fontSize:12, color:e.color }}>{e.subject}</div><div style={{ fontSize:11, color:'var(--muted)' }}>{e.startTime} – {e.endTime}</div></div>
                  </div>
                ))}
              </div>
            ) : <div style={{ textAlign:'center', padding:'20px 0', fontSize:32 }}>🌿</div>}
          </motion.div>

          {/* Weekly tracker */}
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
            style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:18, padding:22 }}>
            <div style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>Weekly tracker</div>
            <p style={{ fontSize:12, color:'var(--muted)', marginBottom:14 }}>Tap days you've completed</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:5 }}>
              {DAYS.map((d,di) => {
                const has = timetable.some(e=>e.day===di);
                const done = studied.includes(di);
                const isToday = di===todayDay;
                return (
                  <button key={d} onClick={()=>has&&toggleStudied(di)}
                    style={{ padding:'7px 2px', borderRadius:10, border:'1px solid', cursor:has?'pointer':'default', textAlign:'center', transition:'all 0.2s',
                      background:done?'rgba(34,197,94,0.12)':isToday?'rgba(99,102,241,0.1)':'var(--s2)',
                      borderColor:done?'#22c55e':isToday?'#6366f1':'var(--border)', opacity:has?1:0.4 }}>
                    <div style={{ fontSize:9, fontWeight:700, color:done?'#22c55e':isToday?'#818cf8':'var(--muted)', marginBottom:2 }}>{SHORT_DAYS[di]}</div>
                    <div style={{ fontSize:13 }}>{done?'✅':has?'📚':'–'}</div>
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop:12, padding:'10px 12px', borderRadius:12, background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', fontSize:12, color:'#6ee7b7', textAlign:'center' }}>
              {studied.length===0?'🎯 Start marking your progress!':studied.length<3?`💪 ${studied.length} day${studied.length!==1?'s':''} — keep going!`:studied.length<6?`🔥 ${studied.length} days — great streak!`:'🏆 Perfect week!'}
            </div>
          </motion.div>

          {/* Subject breakdown */}
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.35}}
            style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:18, padding:22 }}>
            <div style={{ fontWeight:600, fontSize:14, marginBottom:16 }}>Subject breakdown</div>
            {subjects.map(s => {
              const hrs = timetable.filter(e=>e.subjectId===s.id).reduce((a,e)=>a+getDur(e.startTime,e.endTime),0);
              const pct = Math.min((hrs/5)*100,100);
              return (
                <div key={s.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:10, background:'var(--s2)', border:'1px solid var(--border)', marginBottom:6 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:s.color, flexShrink:0 }} />
                  <div style={{ fontSize:12, fontWeight:500, minWidth:70, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</div>
                  <div style={{ flex:1, height:4, background:'var(--border)', borderRadius:2, overflow:'hidden' }}>
                    <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.8,delay:0.5,ease:'easeOut'}}
                      style={{ height:'100%', background:s.color, borderRadius:2 }} />
                  </div>
                  <div style={{ fontSize:11, color:'var(--muted)', flexShrink:0 }}>{Math.round(hrs*10)/10}h</div>
                </div>
              );
            })}
          </motion.div>

          {/* Motivation + GCal */}
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.4}}
            style={{ background:'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(124,58,237,0.07))', border:'1px solid rgba(99,102,241,0.2)', borderRadius:18, padding:22, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:12, animation:'float 3s ease-in-out infinite' }}>🎯</div>
              <div style={{ fontFamily:'"DM Serif Display",serif', fontSize:'1.15rem', marginBottom:8 }}>Consistency beats perfection</div>
              <p style={{ fontSize:12, color:'var(--muted)', lineHeight:1.7 }}>30 minutes every day compounds into thousands of hours by semester end.</p>
            </div>
            <motion.button onClick={()=>setShowGcal(true)} whileHover={{scale:1.03}} whileTap={{scale:0.97}}
              style={{ marginTop:20, padding:'13px', borderRadius:14, border:'none', background:'linear-gradient(135deg,#4285f4,#34a853)', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 4px 20px rgba(66,133,244,0.3)', position:'relative', overflow:'hidden' }}>
              <span style={{ position:'absolute', inset:0, background:'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.2) 50%,transparent 60%)', backgroundSize:'200% 100%', animation:'shimmer 2.5s infinite 1s' }} />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335"/></svg>
              Add to Google Calendar
            </motion.button>
          </motion.div>
        </div>
      </div>
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}} @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
    </main>
  );
}
