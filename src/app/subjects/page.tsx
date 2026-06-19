'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { saveState, loadState } from '@/lib/storage';
import { Subject, Difficulty, TimePreference, SUBJECT_COLORS } from '@/types';
import { toast } from 'sonner';
import Cursor from '@/components/Cursor';

const DIFF_COLORS: Record<Difficulty,string> = { Easy:'#22c55e', Medium:'#f59e0b', Hard:'#ef4444' };
const TIME_ICONS: Record<TimePreference,string> = { Morning:'🌅', Afternoon:'☀️', Evening:'🌙', Flexible:'🔄' };

export default function SubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [adding, setAdding] = useState(false);
  const [nm, setNm] = useState('');
  const [cr, setCr] = useState(3);
  const [diff, setDiff] = useState<Difficulty>('Medium');
  const [time, setTime] = useState<TimePreference>('Flexible');

  useEffect(() => {
    const s = loadState();
    if (!s?.profile) { router.push('/setup'); return; }
    if (s.subjects?.length) setSubjects(s.subjects);
  }, [router]);

  const resetForm = () => { setNm(''); setCr(3); setDiff('Medium'); setTime('Flexible'); setAdding(false); };

  const add = () => {
    if (!nm.trim()) { toast.error('Enter a subject name'); return; }
    if (subjects.length >= 12) { toast.error('Max 12 subjects'); return; }
    const s: Subject = { id: Math.random().toString(36).slice(2), name:nm.trim(), creditHours:cr, difficulty:diff, timePreference:time, color:SUBJECT_COLORS[subjects.length%SUBJECT_COLORS.length] };
    const updated = [...subjects, s];
    setSubjects(updated);
    saveState({ subjects: updated });
    resetForm();
    toast.success(`${s.name} added!`);
  };

  const remove = (id: string) => {
    const updated = subjects.filter(s => s.id !== id);
    setSubjects(updated);
    saveState({ subjects: updated });
  };

  const generate = () => {
    if (!subjects.length) { toast.error('Add at least one subject'); return; }
    saveState({ subjects, step:3 });
    router.push('/timetable');
  };

  return (
    <main style={{ minHeight:'100vh', background:'var(--bg)', padding:'24px 20px', position:'relative' }}>
      <Cursor />
      <div style={{ position:'fixed', top:'5%', left:'5%', width:350, height:350, background:'radial-gradient(circle,rgba(124,58,237,0.06) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />

      <div style={{ maxWidth:540, margin:'0 auto', position:'relative', zIndex:1 }}>
        <motion.button initial={{opacity:0}} animate={{opacity:1}} onClick={()=>router.push('/setup')}
          style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', gap:6, marginBottom:24, marginTop:8 }}
          whileHover={{ color:'var(--text)' } as any}>
          ← Back to Profile
        </motion.button>

        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
            <span style={{ color:'var(--muted)' }}>Step 2 of 3 — Subjects</span>
            <span style={{ color:'#818cf8' }}>{subjects.length}/12</span>
          </div>
          <div style={{ height:3, background:'var(--border)', borderRadius:2, overflow:'hidden', marginBottom:24 }}>
            <motion.div animate={{ width:`${Math.min((subjects.length/4)*100,100)}%` }} transition={{ duration:0.4 }}
              style={{ height:'100%', background:'linear-gradient(90deg,#6366f1,#7c3aed)', borderRadius:2 }} />
          </div>
        </motion.div>

        <motion.h1 initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}}
          style={{ fontFamily:'"DM Serif Display",serif', fontSize:'2rem', marginBottom:6 }}>Add your subjects</motion.h1>
        <motion.p initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.15}}
          style={{ color:'var(--muted)', fontSize:13, marginBottom:24 }}>
          Add 1–12 subjects with difficulty and preferred study time.
        </motion.p>

        {/* Subject list */}
        <AnimatePresence>
          {subjects.map((s,i) => (
            <motion.div key={s.id} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:20,height:0}} transition={{delay:i*0.04}}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, marginBottom:8, transition:'border-color 0.2s,transform 0.2s' }}
              onMouseEnter={e=>(e.currentTarget.style.borderColor='var(--b2)')}
              onMouseLeave={e=>(e.currentTarget.style.borderColor='var(--border)')}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:s.color, flexShrink:0, boxShadow:`0 0 8px ${s.color}66` }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:600, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</div>
                <div style={{ fontSize:11, color:'var(--muted)', display:'flex', gap:10, marginTop:2 }}>
                  <span>{s.creditHours} credits</span>
                  <span style={{ color:DIFF_COLORS[s.difficulty] }}>● {s.difficulty}</span>
                  <span>{TIME_ICONS[s.timePreference]} {s.timePreference}</span>
                </div>
              </div>
              <button onClick={()=>remove(s.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:20, lineHeight:1, padding:4, borderRadius:6, transition:'color 0.2s' }}
                onMouseEnter={e=>(e.currentTarget.style.color='#ef4444')} onMouseLeave={e=>(e.currentTarget.style.color='var(--muted)')}>×</button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add form */}
        <AnimatePresence mode="wait">
          {adding ? (
            <motion.div key="form" initial={{opacity:0,y:12,scale:0.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8,scale:0.98}}
              style={{ background:'var(--surface)', border:'1px solid #6366f1', borderRadius:18, padding:24, marginBottom:16 }}>
              <div style={{ fontWeight:600, fontSize:15, marginBottom:20 }}>New Subject</div>

              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>Subject name</label>
                <input autoFocus value={nm} onChange={e=>setNm(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()}
                  placeholder="e.g. Algorithms, Calculus, Physics…"
                  style={{ width:'100%', background:'var(--s2)', border:'1px solid var(--border)', borderRadius:10, padding:'11px 14px', color:'var(--text)', fontSize:14, transition:'border-color 0.2s,box-shadow 0.2s' }}
                  onFocus={e=>{e.target.style.borderColor='#6366f1';e.target.style.boxShadow='0 0 0 3px rgba(99,102,241,0.15)'}}
                  onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.boxShadow='none'}} />
              </div>

              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>
                  Credit hours: <span style={{ color:'#818cf8' }}>{cr}</span>
                </label>
                <input type="range" min={1} max={5} value={cr} onChange={e=>setCr(+e.target.value)} />
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--muted)', marginTop:4 }}>
                  <span>1 credit</span><span>5 credits</span>
                </div>
              </div>

              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>Difficulty</label>
                <div style={{ display:'flex', gap:8 }}>
                  {(['Easy','Medium','Hard'] as Difficulty[]).map(d => (
                    <button key={d} onClick={()=>setDiff(d)}
                      style={{ flex:1, padding:'10px 0', borderRadius:10, border:'1px solid', cursor:'pointer', fontSize:13, fontWeight:600, transition:'all 0.2s',
                        background: diff===d?`${DIFF_COLORS[d]}22`:'var(--s2)', borderColor: diff===d?DIFF_COLORS[d]:'var(--border)', color: diff===d?DIFF_COLORS[d]:'var(--muted)' }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={{ display:'block', fontSize:11, fontWeight:600, color:'var(--muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>Preferred time</label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {(['Morning','Afternoon','Evening','Flexible'] as TimePreference[]).map(t => (
                    <button key={t} onClick={()=>setTime(t)}
                      style={{ padding:'10px 0', borderRadius:10, border:'1px solid', cursor:'pointer', fontSize:12, fontWeight:600, transition:'all 0.2s',
                        background: time===t?'rgba(99,102,241,0.15)':'var(--s2)', borderColor: time===t?'#6366f1':'var(--border)', color: time===t?'#818cf8':'var(--muted)' }}>
                      {TIME_ICONS[t]} {t}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={resetForm}
                  style={{ flex:1, padding:'12px 0', borderRadius:12, border:'1px solid var(--border)', background:'none', color:'var(--muted)', cursor:'pointer', fontSize:13, transition:'all 0.2s' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--b2)';e.currentTarget.style.color='var(--text)'}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--muted)'}}>
                  Cancel
                </button>
                <button onClick={add}
                  style={{ flex:2, padding:'12px 0', borderRadius:12, border:'none', background:'linear-gradient(135deg,#6366f1,#7c3aed)', color:'#fff', cursor:'pointer', fontSize:14, fontWeight:700, transition:'opacity 0.2s' }}
                  onMouseEnter={e=>(e.currentTarget.style.opacity='0.9')} onMouseLeave={e=>(e.currentTarget.style.opacity='1')}>
                  Add Subject
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button key="add-btn" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              onClick={()=>subjects.length<12&&setAdding(true)} disabled={subjects.length>=12}
              style={{ width:'100%', padding:'16px', borderRadius:14, border:'2px dashed var(--border)', background:'none', color:'var(--muted)', cursor:subjects.length<12?'pointer':'not-allowed', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:16, transition:'all 0.25s' }}
              whileHover={subjects.length<12?{borderColor:'#6366f1',color:'#818cf8'}:{}}>
              <span style={{ fontSize:20, lineHeight:1 }}>+</span> Add Subject
            </motion.button>
          )}
        </AnimatePresence>

        {subjects.length > 0 && (
          <motion.button initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} onClick={generate}
            whileHover={{scale:1.02}} whileTap={{scale:0.97}}
            style={{ width:'100%', padding:'15px 0', borderRadius:14, border:'none', background:'linear-gradient(135deg,#6366f1,#7c3aed)', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 28px rgba(99,102,241,0.3)' }}>
            Generate Timetable →
          </motion.button>
        )}
        {subjects.length > 0 && <p style={{ textAlign:'center', fontSize:12, color:'var(--muted)', marginTop:10 }}>{subjects.length} subject{subjects.length!==1?'s':''} ready</p>}
      </div>
    </main>
  );
}
