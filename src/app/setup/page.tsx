'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { saveState, loadState } from '@/lib/storage';
import Cursor from '@/components/Cursor';

const SEMESTERS = ['Semester 1','Semester 2','Semester 3','Semester 4','Semester 5','Semester 6','Semester 7','Semester 8'];

export default function SetupPage() {
  const router = useRouter();
  const [name, setName]       = useState('');
  const [college, setCollege] = useState('');
  const [semester, setSemester] = useState('');

  useEffect(() => {
    const s = loadState();
    if (s?.profile) { setName(s.profile.name); setCollege(s.profile.college); setSemester(s.profile.semester||''); }
  }, []);

  const pct = ([name,college,semester].filter(Boolean).length / 3) * 100;
  const valid = name.trim() && college.trim() && semester;

  const next = () => {
    if (!valid) return;
    saveState({ profile:{ name:name.trim(), college:college.trim(), semester }, step:2 });
    router.push('/subjects');
  };

  return (
    <main style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 20px', position:'relative' }}>
      <Cursor />
      <div style={{ position:'fixed', top:'20%', right:'10%', width:300, height:300, background:'radial-gradient(circle,rgba(99,102,241,0.07) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:460, position:'relative', zIndex:1 }}>
        <motion.button initial={{opacity:0}} animate={{opacity:1}} onClick={() => router.push('/')}
          style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', gap:6, marginBottom:28 }}
          whileHover={{ color:'var(--text)' } as any}>
          ← Back
        </motion.button>

        {/* Progress */}
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
            <span style={{ color:'var(--muted)' }}>Step 1 of 3 — Profile</span>
            <span style={{ color:'#818cf8' }}>{Math.round(pct)}%</span>
          </div>
          <div style={{ height:3, background:'var(--border)', borderRadius:2, overflow:'hidden', marginBottom:8 }}>
            <motion.div animate={{ width:`${pct}%` }} transition={{ duration:0.4 }}
              style={{ height:'100%', background:'linear-gradient(90deg,#6366f1,#7c3aed)', borderRadius:2 }} />
          </div>
          <div style={{ display:'flex', gap:12, marginBottom:28 }}>
            {['Profile','Subjects','Generate'].map((s,i) => (
              <div key={s} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:20, height:20, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700,
                  background: i===0?'#6366f1':'var(--surface)', border: i===0?'none':'1px solid var(--border)',
                  color: i===0?'#fff':'var(--muted)' }}>{i+1}</div>
                <span style={{ fontSize:12, color: i===0?'var(--text)':'var(--muted)' }}>{s}</span>
                {i<2 && <span style={{ color:'var(--border)', fontSize:11 }}>—</span>}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Card */}
        <motion.div initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
          style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, padding:32 }}>
          <h1 style={{ fontFamily:'"DM Serif Display",serif', fontSize:'1.9rem', marginBottom:6 }}>Hey there! 👋</h1>
          <p style={{ color:'var(--muted)', fontSize:14, marginBottom:28 }}>Tell us a bit about yourself to get started.</p>

          {/* Name */}
          <div style={{ marginBottom:18 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--muted)', marginBottom:6, letterSpacing:'0.5px', textTransform:'uppercase' }}>Your name</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Alex Johnson"
              style={{ width:'100%', background:'var(--s2)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px', color:'var(--text)', fontSize:14, transition:'border-color 0.2s,box-shadow 0.2s' }}
              onFocus={e=>{e.target.style.borderColor='#6366f1';e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.15)'}}
              onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.boxShadow='none'}} />
          </div>

          {/* College */}
          <div style={{ marginBottom:18 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--muted)', marginBottom:6, letterSpacing:'0.5px', textTransform:'uppercase' }}>College / University</label>
            <input value={college} onChange={e=>setCollege(e.target.value)} placeholder="MIT, IIT Madras, Stanford…"
              style={{ width:'100%', background:'var(--s2)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 14px', color:'var(--text)', fontSize:14, transition:'border-color 0.2s,box-shadow 0.2s' }}
              onFocus={e=>{e.target.style.borderColor='#6366f1';e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.15)'}}
              onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.boxShadow='none'}} />
          </div>

          {/* Semester */}
          <div style={{ marginBottom:28 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--muted)', marginBottom:8, letterSpacing:'0.5px', textTransform:'uppercase' }}>Current semester</label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
              {SEMESTERS.map((s,i) => (
                <button key={s} onClick={()=>setSemester(s)}
                  style={{ padding:'10px 4px', borderRadius:10, border:'1px solid', cursor:'pointer', fontSize:12, fontWeight:600, transition:'all 0.2s',
                    background: semester===s?'rgba(99,102,241,0.15)':'var(--s2)',
                    borderColor: semester===s?'#6366f1':'var(--border)',
                    color: semester===s?'#818cf8':'var(--muted)' }}>
                  {i+1} Sem
                </button>
              ))}
            </div>
          </div>

          <motion.button onClick={next} disabled={!valid}
            whileHover={valid?{scale:1.02}:{}} whileTap={valid?{scale:0.97}:{}}
            style={{ width:'100%', padding:'14px 0', borderRadius:14, border:'none', cursor:valid?'pointer':'not-allowed',
              background:valid?'linear-gradient(135deg,#6366f1,#7c3aed)':'var(--border)',
              color:valid?'#fff':'var(--muted)', fontSize:15, fontWeight:700,
              boxShadow:valid?'0 4px 24px rgba(99,102,241,0.3)':'none', transition:'all 0.3s' }}>
            Continue to Subjects →
          </motion.button>
        </motion.div>
      </div>
    </main>
  );
}
