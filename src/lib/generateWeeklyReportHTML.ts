import type { WeekData, DayPlan, Task } from '../store/useWeekStore'

// ─── Shared helpers ───────────────────────────────────────────────────────────

const DAY_LABEL: Record<string, string> = {
  monday:'MON', tuesday:'TUE', wednesday:'WED', thursday:'THU',
  friday:'FRI', saturday:'SAT', sunday:'SUN',
}

const BG   = '#0b0b12'
const CARD = 'rgba(255,255,255,0.04)'
const BORDER = 'rgba(255,255,255,0.07)'
const TEXT   = '#e2e8f0'
const MUTED  = '#475569'
const INDIGO = '#818cf8'
const ORANGE = '#fb923c'
const SLATE  = '#94a3b8'
const GREEN  = '#4ade80'
const RED    = '#f87171'
const FONT   = `'Inter','Segoe UI',system-ui,sans-serif`

function taskRow(task: Task, accent: string): string {
  const done = task.status === 'done'
  const title = task.title.replace(/</g,'&lt;').replace(/>/g,'&gt;')
  return `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(255,255,255,${done?'0.02':'0.05'});border-left:3px solid ${done?'#1e293b':accent};border-radius:8px;opacity:${done?.55:1}">
    <div style="flex-shrink:0;width:13px;height:13px;border-radius:50%;border:2px solid ${done?GREEN:accent};background:${done?GREEN:'transparent'};display:flex;align-items:center;justify-content:center;font-size:8px;color:#000">${done?'✓':''}</div>
    <span style="font-size:12px;font-weight:600;color:${done?MUTED:TEXT};text-decoration:${done?'line-through':'none'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%">${title}</span>
    ${task.estimatedTime?`<span style="flex-shrink:0;margin-left:auto;font-size:10px;color:${accent};opacity:.7">⌛${task.estimatedTime}</span>`:''}
  </div>`
}

function section(label: string, color: string, rows: string): string {
  return `<div style="margin-bottom:10px">
    <div style="font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:${color};margin-bottom:6px">${label}</div>
    <div style="display:flex;flex-direction:column;gap:5px">${rows}</div>
  </div>`
}

function dayCard(day: DayPlan, w: number, h: number): string {
  if (day.isRestDay) {
    return `<div style="width:${w}px;height:${h}px;background:rgba(124,58,237,.05);border:1px solid rgba(124,58,237,.2);border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px">
      <div style="font-size:32px">🌙</div>
      <div style="font-size:10px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:#7c3aed">Rest Day</div>
      <div style="font-size:22px;font-weight:800;color:#a78bfa">${day.date}</div>
    </div>`
  }

  const total = (day.highTask?1:0) + day.mediumTasks.length + day.smallTasks.length
  const done  = [day.highTask,...day.mediumTasks,...day.smallTasks].filter(Boolean).filter(t=>t?.status==='done').length
  const pct   = total>0 ? Math.round((done/total)*100) : 0
  const full  = pct===100 && total>0
  const badge = full
    ? `<span style="background:rgba(74,222,128,.15);color:${GREEN};font-size:8px;font-weight:800;padding:3px 8px;border-radius:20px">✓ COMPLETE</span>`
    : total===0
    ? `<span style="background:rgba(148,163,184,.1);color:#334155;font-size:8px;font-weight:800;padding:3px 8px;border-radius:20px">EMPTY</span>`
    : `<span style="background:rgba(129,140,248,.1);color:${INDIGO};font-size:8px;font-weight:800;padding:3px 8px;border-radius:20px">${pct}%</span>`

  const highRows  = day.highTask    ? taskRow(day.highTask,   INDIGO) : `<div style="font-size:11px;color:#1e293b;font-style:italic;padding:6px 12px">— No high impact task</div>`
  const medRows   = day.mediumTasks.map(t=>taskRow(t,ORANGE)).join('')
  const smallRows = day.smallTasks .map(t=>taskRow(t,SLATE )).join('')

  const progressBar = total>0 ? `<div style="height:3px;background:rgba(255,255,255,.08);border-radius:99px;overflow:hidden;margin-top:6px">
    <div style="height:100%;width:${pct}%;background:${full?GREEN:INDIGO};border-radius:99px"></div>
  </div>
  <div style="font-size:9px;color:${MUTED};margin-top:3px">${done}/${total} tasks</div>` : ''

  return `<div style="width:${w}px;height:${h}px;background:${CARD};border:1px solid ${BORDER};border-radius:16px;padding:18px;display:flex;flex-direction:column;overflow:hidden">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px">
      <div>
        <div style="font-size:9px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:${MUTED};margin-bottom:2px">${DAY_LABEL[day.day]??day.day.slice(0,3).toUpperCase()}</div>
        <div style="font-size:22px;font-weight:800;color:${TEXT};line-height:1">${day.date}</div>
      </div>
      ${badge}
    </div>
    ${progressBar}
    <div style="margin-top:12px;flex:1;overflow:hidden;display:flex;flex-direction:column;gap:0">
      ${section('⚡ High Impact', INDIGO, highRows)}
      ${medRows   ? section('◈ Medium', ORANGE, medRows)   : ''}
      ${smallRows ? section('· Small',  SLATE,  smallRows) : ''}
    </div>
  </div>`
}

// ─── Slide builders ───────────────────────────────────────────────────────────

function slideWrapper(content: string): string {
  return `<div class="report-slide" style="width:1920px;height:1080px;background:${BG};font-family:${FONT};display:flex;flex-direction:column;overflow:hidden;flex-shrink:0">${content}</div>`
}

function barChartHTML(weekData: WeekData): string {
  const stats = weekData.days.filter(d=>!d.isRestDay).map(d=>{
    const total = (d.highTask?1:0)+d.mediumTasks.length+d.smallTasks.length
    const done  = [d.highTask,...d.mediumTasks,...d.smallTasks].filter(Boolean).filter(t=>t?.status==='done').length
    return { label: DAY_LABEL[d.day]??d.day.slice(0,3).toUpperCase(), done, total }
  })
  const maxV = Math.max(...stats.map(s=>s.total), 1)
  const H = 90
  return stats.map(s=>{
    const doneH    = Math.round((s.done/maxV)*H)
    const plannedH = Math.round((s.total/maxV)*H)
    const gapH     = Math.max(plannedH-doneH,0)
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex:1">
      <span style="font-size:11px;color:${MUTED};font-weight:700">${s.done}/${s.total}</span>
      <div style="display:flex;flex-direction:column-reverse;height:${H}px;width:100%;gap:2px">
        <div style="background:${INDIGO};border-radius:4px 4px 0 0;height:${doneH}px;min-height:${s.done>0?3:0}px"></div>
        <div style="background:rgba(255,255,255,.08);border-radius:4px 4px 0 0;height:${gapH}px;min-height:${s.total>0?3:0}px"></div>
      </div>
      <span style="font-size:11px;color:${MUTED};font-weight:700">${s.label}</span>
    </div>`
  }).join('')
}

// Slide 1: Cover + Stats + Chart
function coverSlide(w: WeekData): string {
  const scoreColor = w.score>=80 ? GREEN : w.score>=50 ? ORANGE : RED
  const hi  = w.days.flatMap(d=>d.highTask?[d.highTask]:[])
  const hiD = hi.filter(t=>t.status==='done').length
  const med  = w.days.flatMap(d=>d.mediumTasks)
  const sm   = w.days.flatMap(d=>d.smallTasks)

  function statBox(label:string, done:number, total:number, color:string):string {
    const pct = total>0 ? Math.round((done/total)*100) : 0
    return `<div style="background:${CARD};border:1px solid ${BORDER};border-radius:16px;padding:28px 32px;flex:1">
      <div style="font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:${color};margin-bottom:12px">${label}</div>
      <div style="font-size:36px;font-weight:900;color:${TEXT};line-height:1">${done}<span style="font-size:20px;color:${MUTED}">/${total}</span></div>
      ${total>0?`<div style="margin-top:12px;height:3px;background:rgba(255,255,255,.08);border-radius:99px"><div style="height:100%;width:${pct}%;background:${color};border-radius:99px"></div></div>`:''}
    </div>`
  }

  return slideWrapper(`
    <div style="padding:64px 80px;display:flex;flex-direction:column;height:100%;gap:0">
      <!-- Header -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:36px;border-bottom:1px solid rgba(255,255,255,.07);margin-bottom:36px">
        <div>
          <div style="font-size:11px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#1e293b;margin-bottom:10px">WeeklyOS · Report</div>
          <div style="font-size:60px;font-weight:900;letter-spacing:-.03em;color:#f1f5f9;line-height:1">Week ${w.weekNumber} — ${w.year}</div>
          <div style="font-size:16px;color:${MUTED};margin-top:10px">${w.dateRange}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:${MUTED};margin-bottom:8px">Weekly Score</div>
          <div style="font-size:80px;font-weight:900;color:${scoreColor};line-height:1;letter-spacing:-.03em">${w.score}<span style="font-size:36px">%</span></div>
          <div style="font-size:13px;color:${MUTED};margin-top:6px">${w.totalCompleted} / ${w.totalPlanned} tasks completed</div>
        </div>
      </div>

      <!-- Stats Row -->
      <div style="display:flex;gap:20px;margin-bottom:32px">
        ${statBox('High Impact', hiD,  hi.length,  INDIGO)}
        ${statBox('Medium',      med.filter(t=>t.status==='done').length, med.length, ORANGE)}
        ${statBox('Small Tasks', sm.filter(t=>t.status==='done').length,  sm.length,  SLATE)}
        <div style="background:${CARD};border:1px solid ${BORDER};border-radius:16px;padding:28px 32px;flex:1">
          <div style="font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#a78bfa;margin-bottom:12px">Rest Days</div>
          <div style="font-size:36px;font-weight:900;color:${TEXT};line-height:1">${w.days.filter(d=>d.isRestDay).length}</div>
        </div>
      </div>

      <!-- Bar Chart -->
      <div style="background:${CARD};border:1px solid ${BORDER};border-radius:16px;padding:28px 32px;flex:1">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
          <div style="font-size:11px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:${MUTED}">Daily Progress</div>
          <div style="display:flex;gap:20px">
            <div style="display:flex;align-items:center;gap:7px"><div style="width:12px;height:12px;border-radius:3px;background:${INDIGO}"></div><span style="font-size:11px;color:${MUTED};font-weight:700">DONE</span></div>
            <div style="display:flex;align-items:center;gap:7px"><div style="width:12px;height:12px;border-radius:3px;background:rgba(255,255,255,.08)"></div><span style="font-size:11px;color:${MUTED};font-weight:700">PLANNED</span></div>
          </div>
        </div>
        <div style="display:flex;align-items:flex-end;gap:16px;height:160px">
          ${barChartHTML(w)}
        </div>
      </div>
    </div>`)
}

// Slide 2+: Day cards - 4 per slide in 2×2 grid
function daySlide(days: DayPlan[], slideTitle: string): string {
  // Available: 1920 - 2*60 = 1800w, 1080 - 60top - 60bottom - titleRow(52+16) = 892h
  const cardW = Math.floor((1800 - 20) / 2)   // 890
  const cardH = Math.floor((892  - 20) / 2)   // 436
  const cells = [...days]
  while (cells.length < 4) cells.push(null as any)

  const rows: string[] = []
  for (let r=0; r<2; r++) {
    const pair = cells.slice(r*2, r*2+2)
    rows.push(`<div style="display:flex;gap:20px">${pair.map(d=>d ? dayCard(d,cardW,cardH) : `<div style="width:${cardW}px;height:${cardH}px"></div>`).join('')}</div>`)
  }

  return slideWrapper(`
    <div style="padding:60px 60px;display:flex;flex-direction:column;gap:16px;height:100%">
      <div style="font-size:14px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:${MUTED}">${slideTitle}</div>
      <div style="display:flex;flex-direction:column;gap:20px;flex:1">${rows.join('')}</div>
    </div>`)
}

// Evaluation slide
function evalSlide(w: WeekData): string {
  function box(icon:string, label:string, text:string, color:string):string {
    return `<div style="background:rgba(255,255,255,.03);border:1px solid ${color}28;border-radius:16px;padding:32px;flex:1">
      <div style="font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:${color};margin-bottom:14px">${icon}  ${label}</div>
      <p style="font-size:15px;color:#cbd5e1;line-height:1.8;margin:0">${(text||'').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>
    </div>`
  }
  return slideWrapper(`
    <div style="padding:80px;display:flex;flex-direction:column;height:100%;gap:0">
      <div style="margin-bottom:48px">
        <div style="font-size:11px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#1e293b;margin-bottom:10px">WeeklyOS · Evaluation</div>
        <div style="font-size:52px;font-weight:900;letter-spacing:-.02em;color:#f1f5f9;line-height:1">Weekly Reflection</div>
        <div style="font-size:15px;color:${MUTED};margin-top:10px">${w.dateRange}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:24px;flex:1">
        ${w.evalWentWell  ? box('✓','What Went Well',   w.evalWentWell,  GREEN)  : ''}
        ${w.evalStruggle  ? box('⚡','Where I Struggled',w.evalStruggle,  RED)    : ''}
        ${w.evalLessons   ? box('💡','Lessons Learned',  w.evalLessons,   INDIGO) : ''}
      </div>
    </div>`)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Returns the inner HTML of all slides (for html2canvas capture) */
export function generateReportSlidesHTML(weekData: WeekData): string {
  const slides: string[] = []

  // Slide 1 – Cover
  slides.push(coverSlide(weekData))

  // Day slides – 4 per slide
  const workDays  = weekData.days.filter(d => !d.isRestDay)
  const restDays  = weekData.days.filter(d =>  d.isRestDay)
  const allDays   = [...workDays, ...restDays]
  for (let i = 0; i < allDays.length; i += 4) {
    const chunk = allDays.slice(i, i + 4)
    const label = `Weekly Distribution · Slide ${Math.floor(i/4)+1}`
    slides.push(daySlide(chunk, label))
  }

  // Evaluation slide (only if any text exists)
  if (weekData.evalWentWell || weekData.evalStruggle || weekData.evalLessons) {
    slides.push(evalSlide(weekData))
  }

  return slides.join('\n')
}

/** Full HTML document for popup-window preview */
export function generateWeeklyReportHTML(weekData: WeekData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>WeeklyOS Report — Week ${weekData.weekNumber} ${weekData.year}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{background:#0b0b12;font-family:'Inter','Segoe UI',system-ui,sans-serif}
    .slides{display:flex;flex-direction:column;gap:0}
  </style>
</head>
<body>
<div class="slides">${generateReportSlidesHTML(weekData)}</div>
</body>
</html>`
}
