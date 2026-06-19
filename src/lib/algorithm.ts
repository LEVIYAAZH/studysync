'use client';
import { Subject, TimetableEvent } from '@/types';

const TIME_BLOCKS: Record<string, string[]> = {
  Morning:   ['08:00','09:00','10:00','11:00'],
  Afternoon: ['12:00','13:00','14:00','15:00'],
  Evening:   ['17:00','18:00','19:00'],
  Flexible:  ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00'],
};

function addMin(t: string, m: number): string {
  const [h, min] = t.split(':').map(Number);
  const total = h * 60 + min + m;
  return `${String(Math.floor(total / 60)).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`;
}

function overlaps(s1: string, e1: string, s2: string, e2: string) {
  return s1 < e2 && e1 > s2;
}

export function generateTimetable(subjects: Subject[]): TimetableEvent[] {
  const events: TimetableEvent[] = [];
  const sched: Record<number, {s:string;e:string}[]> = {};
  for (let d = 0; d < 7; d++) sched[d] = [];

  const sorted = [...subjects].sort((a, b) =>
    ({'Hard':0,'Medium':1,'Easy':2}[a.difficulty]) - ({'Hard':0,'Medium':1,'Easy':2}[b.difficulty])
  );

  for (const subj of sorted) {
    const sessions = Math.max(2, Math.min(5, Math.round(subj.creditHours * 1.2)));
    const dur = subj.difficulty === 'Hard' ? 90 : subj.difficulty === 'Medium' ? 75 : 60;
    const pref = TIME_BLOCKS[subj.timePreference] || TIME_BLOCKS.Flexible;
    let placed = 0;

    for (const day of [0,2,4,1,3,5,6]) {
      if (placed >= sessions) break;
      for (const st of pref) {
        const et = addMin(st, dur);
        const conflict = sched[day].some(x => overlaps(st, et, x.s, x.e));
        const dup = events.some(e => e.subjectId === subj.id && e.day === day);
        if (!conflict && !dup) {
          sched[day].push({ s: st, e: addMin(et, 10) });
          events.push({ id:`${subj.id}-${day}-${st}`, subjectId:subj.id, subject:subj.name, day, startTime:st, endTime:et, color:subj.color });
          placed++; break;
        }
      }
    }

    const fallback = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
    for (let d = 0; d < 7 && placed < sessions; d++) {
      for (const st of fallback) {
        const et = addMin(st, dur);
        const conflict = sched[d].some(x => overlaps(st, et, x.s, x.e));
        const dup = events.some(e => e.subjectId === subj.id && e.day === d);
        if (!conflict && !dup) {
          sched[d].push({ s: st, e: addMin(et, 10) });
          events.push({ id:`${subj.id}-${d}-${st}`, subjectId:subj.id, subject:subj.name, day:d, startTime:st, endTime:et, color:subj.color });
          placed++; break;
        }
      }
    }
  }
  return events;
}

export function getStats(subjects: Subject[], events: TimetableEvent[]) {
  const totalHours = events.reduce((acc, e) => {
    const [sh,sm] = e.startTime.split(':').map(Number);
    const [eh,em] = e.endTime.split(':').map(Number);
    return acc + ((eh*60+em) - (sh*60+sm)) / 60;
  }, 0);
  return {
    totalHours: Math.round(totalHours * 10) / 10,
    studyDays: new Set(events.map(e => e.day)).size,
    freeDays: 7 - new Set(events.map(e => e.day)).size,
    sessions: events.length,
  };
}

export function buildICS(events: TimetableEvent[]): string {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//StudySync//EN'];
  events.forEach(ev => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + ev.day);
    const [sh,sm] = ev.startTime.split(':').map(Number);
    const [eh,em] = ev.endTime.split(':').map(Number);
    const fmt = (dt: Date, h: number, m: number) =>
      `${dt.getFullYear()}${String(dt.getMonth()+1).padStart(2,'0')}${String(dt.getDate()).padStart(2,'0')}T${String(h).padStart(2,'0')}${String(m).padStart(2,'0')}00`;
    lines.push('BEGIN:VEVENT',`UID:${ev.id}@ss`,`DTSTART:${fmt(d,sh,sm)}`,`DTEND:${fmt(d,eh,em)}`,`SUMMARY:📚 ${ev.subject}`,'RRULE:FREQ=WEEKLY;COUNT=16','END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
