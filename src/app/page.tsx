'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Cursor from '@/components/Cursor';

const DEMO = [
  {t:'9:00', blocks:[{d:0,c:'#6366f1',n:'Algorithms'},{d:2,c:'#ec4899',n:'Stats'}]},
  {t:'10:00',blocks:[{d:1,c:'#10b981',n:'Physics'},{d:3,c:'#f59e0b',n:'Calculus'}]},
  {t:'11:00',blocks:[{d:0,c:'#ec4899',n:'Stats'},{d:4,c:'#6366f1',n:'Algorithms'}]},
  {t:'13:00',blocks:[{d:2,c:'#10b981',n:'Physics'},{d:1,c:'#f59e0b',n:'Calculus'}]},
];
const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri'];

const features = ['⚡ Smart algorithm','📅 Google Calendar','🔔 Auto reminders','📊 Dashboard','🎨 Color-coded','💾 Auto-saved'];

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <main style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 20px', position:'relative', overflow:'hidden' }}>
      <Cursor />

      {/* Ambient */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', top:'15%', left:'50%', transform:'translateX(-50%)', width:600, height:600, background:'radial-gradient(circle,rgba(99,102,241,0.1) 0%,transparent 70%)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', bottom:'10%', left:'5%', width:300, height:300, background:'radial-gradient(circle,rgba(124,58,237,0.07) 0%,transparent 70%)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', top:'5%', right:'5%', width:250, height:250, background:'radial-gradient(circle,rgba(6,182,212,0.06) 0%,transparent 70%)', borderRadius:'50%' }} />
      </div>

      <div style={{ position:'relative', zIndex:1, textAlign:'center', maxWidth:640, width:'100%' }}>
        {/* Badge */}
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.5}}
          style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:30, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.25)', color:'#a5b4fc', fontSize:12, fontWeight:600, marginBottom:28 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#6366f1', display:'inline-block', animation:'pulse 2s infinite' }} />
          Built for students, by students
        </motion.div>

        {/* Title */}
        <motion.h1 initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.6,delay:0.1}}
          style={{ fontFamily:'"DM Serif Display",Georgia,serif', fontSize:'clamp(2.8rem,6vw,4.5rem)', lineHeight:1.08, color:'var(--text)', marginBottom:20 }}>
          Your semester,<br />
          <em style={{ fontStyle:'italic', color:'#818cf8' }}>perfectly sorted.</em>
        </motion.h1>

        {/* Sub */}
        <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.6,delay:0.2}}
          style={{ fontSize:'1.05rem', color:'var(--muted)', maxWidth:440, margin:'0 auto 32px', lineHeight:1.7 }}>
          Add your subjects → get a balanced timetable → export to Google Calendar with reminders. Done in 2 minutes.
        </motion.p>

        {/* Features */}
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.5,delay:0.3}}
          style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center', marginBottom:36 }}>
          {features.map(f => (
            <span key={f} style={{ padding:'6px 14px', borderRadius:20, background:'var(--surface)', border:'1px solid var(--border)', fontSize:12, color:'var(--muted)' }}>{f}</span>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.button initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.5,delay:0.4}}
          whileHover={{ scale:1.04, boxShadow:'0 8px 40px rgba(99,102,241,0.45)' }} whileTap={{ scale:0.97 }}
          onClick={() => router.push('/setup')}
          style={{ padding:'16px 40px', borderRadius:16, border:'none', background:'linear-gradient(135deg,#6366f1,#7c3aed)', color:'#fff', fontSize:16, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 28px rgba(99,102,241,0.35)', position:'relative', overflow:'hidden' }}>
          <span style={{ position:'absolute', inset:0, background:'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.2) 50%,transparent 60%)', backgroundSize:'200% 100%', animation:'shimmer 2.5s infinite 1s' }} />
          Build my timetable →
        </motion.button>

        <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.8}}
          style={{ fontSize:12, color:'var(--muted)', marginTop:14 }}>
          Takes 2 minutes · Fully responsive · Works everywhere
        </motion.p>

        {/* Preview grid */}
        <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:0.7,delay:0.5}}
          style={{ marginTop:48, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, padding:16, boxShadow:'0 40px 80px rgba(0,0,0,0.4)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'52px repeat(5,1fr)', gap:2, marginBottom:4 }}>
            <div />{DAYS_SHORT.map(d => <div key={d} style={{ textAlign:'center', fontSize:10, fontWeight:700, color:'var(--muted)', padding:'4px 0' }}>{d}</div>)}
          </div>
          {DEMO.map((row, ri) => (
            <div key={ri} style={{ display:'grid', gridTemplateColumns:'52px repeat(5,1fr)', gap:2, marginBottom:3 }}>
              <div style={{ fontSize:10, color:'var(--muted)', textAlign:'right', paddingRight:8, paddingTop:6 }}>{row.t}</div>
              {[0,1,2,3,4].map(di => {
                const b = row.blocks.find(x => x.d === di);
                return (
                  <div key={di} style={{ height:36, borderRadius:6, background: b ? b.c+'22' : 'var(--s2)', border: b ? `1px solid ${b.c}44` : '1px solid transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color: b?.c, overflow:'hidden' }}>
                    {b?.n}
                  </div>
                );
              })}
            </div>
          ))}
        </motion.div>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}} @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
    </main>
  );
}
