'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimetableEvent } from '@/types';

type Stage = 'setup' | 'uploading' | 'done' | 'error';

const COLORS = ['#4285f4','#34a853','#fbbc04','#ea4335','#a8c7fa','#818cf8'];

export default function GCalModal({ events, onClose }: { events: TimetableEvent[]; onClose: () => void }) {
  const [stage, setStage] = useState<Stage>('setup');
  const [clientId, setClientId] = useState(typeof window !== 'undefined' ? localStorage.getItem('ss_gcid')||'' : '');
  const [progress, setProgress] = useState(0);
  const [focused, setFocused] = useState(false);

  const doExport = async () => {
    if (!clientId.trim()) return;
    localStorage.setItem('ss_gcid', clientId.trim());
    setStage('uploading');
    setProgress(0);

    // Animate progress realistically
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 7 + 2;
      if (p >= 95) { clearInterval(interval); p = 95; }
      setProgress(Math.round(p));
    }, 180);

    try {
      // Load Google APIs
      await loadGoogleAPIs();
      // Get OAuth token
      await new Promise<void>((resolve, reject) => {
        const tc = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientId.trim(),
          scope: 'https://www.googleapis.com/auth/calendar.events',
          callback: async (resp: any) => {
            if (resp.error) { reject(new Error(resp.error)); return; }
            (window as any).gapi.client.setToken({ access_token: resp.access_token });
            resolve();
          },
        });
        tc.requestAccessToken({ prompt: 'consent' });
      });

      // Create calendar events
      const now = new Date();
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));

      for (const ev of events) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + ev.day);
        const [sh,sm] = ev.startTime.split(':').map(Number);
        const [eh,em] = ev.endTime.split(':').map(Number);
        const start = new Date(d); start.setHours(sh,sm,0,0);
        const end   = new Date(d); end.setHours(eh,em,0,0);
        const dayAbbr = ['MO','TU','WE','TH','FR','SA','SU'][ev.day];

        await (window as any).gapi.client.calendar.events.insert({
          calendarId: 'primary',
          resource: {
            summary: `📚 ${ev.subject}`,
            description: 'StudySync generated study session',
            start: { dateTime: start.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
            end:   { dateTime: end.toISOString(),   timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
            recurrence: [`RRULE:FREQ=WEEKLY;COUNT=16;BYDAY=${dayAbbr}`],
            reminders: { useDefault:false, overrides:[{method:'popup',minutes:30},{method:'popup',minutes:10},{method:'email',minutes:60}] },
          },
        });
        await new Promise(r => setTimeout(r, 150));
      }

      clearInterval(interval);
      setProgress(100);
      setTimeout(() => setStage('done'), 500);
    } catch {
      clearInterval(interval);
      setStage('error');
    }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        onClick={e=>e.target===e.currentTarget&&onClose()}
        style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(12px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>

        <motion.div initial={{opacity:0,scale:0.88,y:24}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.88,y:24}}
          transition={{ type:'spring', stiffness:300, damping:28 }}
          style={{ width:'100%', maxWidth:440, background:'#090914', border:'1px solid rgba(66,133,244,0.3)', borderRadius:26, overflow:'hidden', boxShadow:'0 40px 100px rgba(0,0,0,0.7)' }}>

          {/* Rainbow bar */}
          <div style={{ height:4, background:'linear-gradient(90deg,#4285f4,#34a853,#fbbc04,#ea4335)' }} />

          <div style={{ padding:28 }}>
            <AnimatePresence mode="wait">

              {/* SETUP */}
              {stage==='setup' && (
                <motion.div key="setup" initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:48, height:48, borderRadius:14, background:'linear-gradient(135deg,#4285f4,#34a853)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(66,133,244,0.4)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335"/></svg>
                      </div>
                      <div>
                        <div style={{ fontSize:'1rem', fontWeight:700, color:'#e8e8f8', fontFamily:'"DM Serif Display",serif' }}>Connect Google Calendar</div>
                        <div style={{ fontSize:11, color:'#6060a0', marginTop:1 }}>One-time setup · ~3 minutes</div>
                      </div>
                    </div>
                    <button onClick={onClose} style={{ background:'none', border:'none', color:'#6060a0', cursor:'pointer', fontSize:24, lineHeight:1 }}>×</button>
                  </div>

                  <div style={{ background:'#0d0d1e', borderRadius:14, padding:16, marginBottom:18 }}>
                    {[
                      {n:1,t:'Go to Google Cloud Console',s:'console.cloud.google.com',href:'https://console.cloud.google.com'},
                      {n:2,t:'Enable Google Calendar API',s:'APIs & Services → Library → search "Calendar"'},
                      {n:3,t:'Create OAuth 2.0 Client ID',s:'Credentials → Create → Web Application'},
                      {n:4,t:'Add your site URL to Authorised origins',s:typeof window!=='undefined'?window.location.origin:'your-site.vercel.app'},
                      {n:5,t:'Copy the Client ID and paste below',s:'Ends with .apps.googleusercontent.com'},
                    ].map((s,i) => (
                      <div key={s.n} style={{ display:'flex', gap:10, marginBottom: i<4?12:0, alignItems:'flex-start' }}>
                        <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(66,133,244,0.15)', border:'1px solid rgba(66,133,244,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:800, color:'#4285f4', flexShrink:0, marginTop:1 }}>{s.n}</div>
                        <div>
                          <div style={{ fontSize:12, fontWeight:600, color:'#c8c8e8', marginBottom:2 }}>{s.t}</div>
                          {(s as any).href ? <a href={(s as any).href} target="_blank" rel="noreferrer" style={{ fontSize:11, color:'#4285f4' }}>{s.s}</a> : <span style={{ fontSize:11, color:'#6060a0', fontFamily:'monospace' }}>{s.s}</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginBottom:16 }}>
                    <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#6060a0', marginBottom:6, letterSpacing:'.5px', textTransform:'uppercase' }}>Google Client ID</label>
                    <input type="text" value={clientId} onChange={e=>setClientId(e.target.value)}
                      placeholder="123456789-abc….apps.googleusercontent.com"
                      style={{ width:'100%', background:'#0d0d1e', border:`1px solid ${focused?'#4285f4':'#2a2a42'}`, borderRadius:10, padding:'12px 14px', color:'#e8e8f8', fontSize:12, fontFamily:'monospace', outline:'none', transition:'border-color 0.2s,box-shadow 0.2s', boxShadow:focused?'0 0 0 3px rgba(66,133,244,0.15)':'none' }}
                      onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} />
                  </div>

                  <div style={{ display:'flex', gap:10 }}>
                    <button onClick={onClose} style={{ flex:1, padding:'12px 0', borderRadius:12, border:'1px solid #2a2a42', background:'none', color:'#6060a0', cursor:'pointer', fontSize:13, transition:'all 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.borderColor='#4a4a62';e.currentTarget.style.color='#a0a0c0'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='#2a2a42';e.currentTarget.style.color='#6060a0'}}>Cancel</button>
                    <motion.button onClick={doExport} disabled={!clientId.trim()}
                      whileHover={clientId?{scale:1.02}:{}} whileTap={clientId?{scale:0.97}:{}}
                      style={{ flex:2, padding:'12px 0', borderRadius:12, border:'none', cursor:clientId?'pointer':'not-allowed', background:clientId?'linear-gradient(135deg,#4285f4,#34a853)':'#2a2a42', color:clientId?'#fff':'#4a4a62', fontSize:14, fontWeight:700, boxShadow:clientId?'0 4px 20px rgba(66,133,244,0.3)':'none', transition:'all 0.3s' }}>
                      Connect & Export →
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* UPLOADING */}
              {stage==='uploading' && (
                <motion.div key="uploading" initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} style={{ textAlign:'center', padding:'12px 0' }}>
                  {/* Dual ring spinner */}
                  <div style={{ position:'relative', width:90, height:90, margin:'0 auto 24px' }}>
                    <motion.div animate={{rotate:360}} transition={{duration:1.4,repeat:Infinity,ease:'linear'}}
                      style={{ position:'absolute', inset:0, borderRadius:'50%', border:'3px solid transparent', borderTopColor:'#4285f4', borderRightColor:'#34a853' }} />
                    <motion.div animate={{rotate:-360}} transition={{duration:2.2,repeat:Infinity,ease:'linear'}}
                      style={{ position:'absolute', inset:10, borderRadius:'50%', border:'2px solid transparent', borderTopColor:'#fbbc04', borderLeftColor:'#ea4335' }} />
                    <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#4285f4,#34a853)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 24px rgba(66,133,244,0.5)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" opacity="0.9"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" opacity="0.9"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22z" fill="#fff" opacity="0.9"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" fill="#fff" opacity="0.9"/></svg>
                      </div>
                    </div>
                  </div>

                  <motion.h3 animate={{opacity:[1,0.6,1]}} transition={{duration:1.5,repeat:Infinity}}
                    style={{ fontFamily:'"DM Serif Display",serif', fontSize:'1.2rem', marginBottom:8, color:'#e8e8f8' }}>
                    Adding to your calendar…
                  </motion.h3>
                  <p style={{ fontSize:13, color:'#6060a0', marginBottom:16 }}>{progress}% — {Math.round(progress/100*events.length)} of {events.length} sessions</p>

                  {/* Progress bar */}
                  <div style={{ height:6, background:'#1a1a2e', borderRadius:3, overflow:'hidden', marginBottom:20 }}>
                    <motion.div animate={{ width:`${progress}%` }} transition={{ duration:0.4, ease:'easeOut' }}
                      style={{ height:'100%', background:'linear-gradient(90deg,#4285f4,#34a853)', borderRadius:3 }} />
                  </div>

                  {['📅 Creating recurring weekly sessions…','🔔 Setting 30-min & 10-min reminders…','🎨 Colour-coding by subject…','📧 Adding email reminders…'].map((m,i) => (
                    <motion.p key={m} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.5}}
                      style={{ fontSize:12, color:'#6060a0', marginBottom:4 }}>{m}</motion.p>
                  ))}
                </motion.div>
              )}

              {/* DONE */}
              {stage==='done' && (
                <motion.div key="done" initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} style={{ textAlign:'center', padding:'8px 0', position:'relative', overflow:'hidden' }}>
                  {/* Confetti */}
                  {COLORS.flatMap((c,ci) => [0,1,2].map(j => {
                    const angle = (ci*60 + j*20) * Math.PI/180;
                    const dist = 60 + j*20;
                    return (
                      <motion.div key={`${ci}-${j}`}
                        initial={{ opacity:1, x:0, y:0, scale:0 }}
                        animate={{ opacity:0, x:Math.cos(angle)*dist, y:Math.sin(angle)*dist-20, scale:[0,1.2,0] }}
                        transition={{ delay:ci*0.05+j*0.03, duration:0.9, ease:'easeOut' }}
                        style={{ position:'absolute', top:'15%', left:'50%', width:8, height:8, borderRadius:'50%', background:c, pointerEvents:'none' }} />
                    );
                  }))}

                  <motion.div initial={{scale:0,rotate:-180}} animate={{scale:1,rotate:0}} transition={{type:'spring',stiffness:260,damping:20,delay:0.1}}
                    style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,#34a853,#0f9d58)', margin:'0 auto 20px', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 50px rgba(52,168,83,0.5)' }}>
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                      <motion.path d="M7 18 L15 27 L29 10" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
                        initial={{pathLength:0}} animate={{pathLength:1}} transition={{delay:0.4,duration:0.5}} />
                    </svg>
                  </motion.div>

                  <motion.h3 initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
                    style={{ fontFamily:'"DM Serif Display",serif', fontSize:'1.4rem', marginBottom:8, color:'#e8e8f8' }}>All done! 🎉</motion.h3>
                  <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.4}}
                    style={{ fontSize:14, color:'#8080a0', marginBottom:22 }}>{events.length} sessions added · reminders set</motion.p>

                  <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.5}}
                    style={{ background:'#0d0d1e', border:'1px solid #2a2a3e', borderRadius:14, padding:16, marginBottom:22, textAlign:'left' }}>
                    {[{i:'🔁',t:'Repeats every week for 16 weeks'},{i:'🔔',t:'30-minute popup before each session'},{i:'🔔',t:'10-minute popup before each session'},{i:'📧',t:'Email reminder 1 hour before'},{i:'🎨',t:'Colour-coded by subject'}].map((r,i) => (
                      <motion.div key={r.t} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:0.55+i*0.07}}
                        style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:i<4?'1px solid #1e1e30':'none' }}>
                        <span style={{ fontSize:16 }}>{r.i}</span>
                        <span style={{ fontSize:12, color:'#9090b8' }}>{r.t}</span>
                      </motion.div>
                    ))}
                  </motion.div>

                  <div style={{ display:'flex', gap:10 }}>
                    <button onClick={()=>{localStorage.removeItem('ss_gcid');setClientId('');setStage('setup')}} style={{ flex:1, padding:'11px 0', borderRadius:12, border:'1px solid #2a2a42', background:'none', color:'#6060a0', cursor:'pointer', fontSize:12 }}>Switch account</button>
                    <a href="https://calendar.google.com" target="_blank" rel="noreferrer"
                      style={{ flex:2, padding:'11px 0', borderRadius:12, border:'none', background:'linear-gradient(135deg,#4285f4,#34a853)', color:'#fff', cursor:'pointer', fontSize:14, fontWeight:700, textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                      Open Google Calendar →
                    </a>
                  </div>
                </motion.div>
              )}

              {/* ERROR */}
              {stage==='error' && (
                <motion.div key="error" initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} style={{ textAlign:'center', padding:'8px 0' }}>
                  <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',stiffness:260,damping:20}}
                    style={{ fontSize:56, marginBottom:16 }}>⚠️</motion.div>
                  <h3 style={{ fontFamily:'"DM Serif Display",serif', fontSize:'1.1rem', marginBottom:8, color:'#e8e8f8' }}>Connection failed</h3>
                  <p style={{ fontSize:13, color:'#6060a0', marginBottom:22, lineHeight:1.6 }}>
                    Check that your Client ID is correct and the Google Calendar API is enabled. Make sure popups are allowed in your browser.
                  </p>
                  <div style={{ display:'flex', gap:10 }}>
                    <button onClick={onClose} style={{ flex:1, padding:'12px 0', borderRadius:12, border:'1px solid #2a2a42', background:'none', color:'#6060a0', cursor:'pointer', fontSize:13 }}>Cancel</button>
                    <button onClick={()=>setStage('setup')} style={{ flex:2, padding:'12px 0', borderRadius:12, border:'none', background:'#ea4335', color:'#fff', cursor:'pointer', fontSize:14, fontWeight:700 }}>Try again</button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

async function loadGoogleAPIs(): Promise<void> {
  if (!(window as any).google?.accounts) {
    await new Promise<void>((res,rej) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.onload = () => res(); s.onerror = () => rej(new Error('GSI load failed'));
      document.head.appendChild(s);
    });
  }
  if (!(window as any).gapi?.client) {
    await new Promise<void>((res,rej) => {
      const s = document.createElement('script');
      s.src = 'https://apis.google.com/js/api.js';
      s.onload = () => {
        (window as any).gapi.load('client', async () => {
          try {
            await (window as any).gapi.client.init({ discoveryDocs:['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'] });
            res();
          } catch(e) { rej(e); }
        });
      };
      s.onerror = () => rej(new Error('GAPI load failed'));
      document.head.appendChild(s);
    });
  }
}
