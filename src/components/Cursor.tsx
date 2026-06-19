'use client';
import { useEffect, useRef } from 'react';

export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const raf = useRef<number>(0);

  useEffect(() => {
    const move = (e: MouseEvent) => { pos.current = { x: e.clientX, y: e.clientY }; };
    const down = () => { dot.current?.style.setProperty('transform','scale(0.4)'); ring.current?.style.setProperty('transform','scale(0.7)'); };
    const up   = () => { dot.current?.style.setProperty('transform','scale(1)');   ring.current?.style.setProperty('transform','scale(1)'); };
    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.matches('button,a,input,select,label,[role=button],.hoverable')) {
        ring.current?.style.setProperty('width','48px');
        ring.current?.style.setProperty('height','48px');
        ring.current?.style.setProperty('margin','-24px 0 0 -24px');
        ring.current?.style.setProperty('border-color','rgba(99,102,241,0.9)');
      } else {
        ring.current?.style.setProperty('width','32px');
        ring.current?.style.setProperty('height','32px');
        ring.current?.style.setProperty('margin','-16px 0 0 -16px');
        ring.current?.style.setProperty('border-color','rgba(255,255,255,0.5)');
      }
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mousedown', down);
    document.addEventListener('mouseup', up);
    document.addEventListener('mouseover', over);

    const animate = () => {
      ringPos.current.x += (pos.current.x - ringPos.current.x) * 0.12;
      ringPos.current.y += (pos.current.y - ringPos.current.y) * 0.12;
      if (dot.current) {
        dot.current.style.left = pos.current.x + 'px';
        dot.current.style.top  = pos.current.y + 'px';
      }
      if (ring.current) {
        ring.current.style.left = ringPos.current.x + 'px';
        ring.current.style.top  = ringPos.current.y + 'px';
      }
      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mousedown', down);
      document.removeEventListener('mouseup', up);
      document.removeEventListener('mouseover', over);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <>
      <div ref={dot} style={{
        position:'fixed',pointerEvents:'none',zIndex:99999,
        width:8,height:8,borderRadius:'50%',background:'#fff',
        marginLeft:-4,marginTop:-4,
        transition:'transform 0.15s ease',mixBlendMode:'difference',
      }} />
      <div ref={ring} style={{
        position:'fixed',pointerEvents:'none',zIndex:99998,
        width:32,height:32,borderRadius:'50%',
        border:'1.5px solid rgba(255,255,255,0.5)',
        margin:'-16px 0 0 -16px',
        transition:'width 0.3s,height 0.3s,margin 0.3s,border-color 0.3s,transform 0.2s',
      }} />
    </>
  );
}
