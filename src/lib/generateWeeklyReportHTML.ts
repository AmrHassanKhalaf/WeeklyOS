import type { WeekData, DayPlan, Task } from '../store/useWeekStore'

// ─── Colors (must be hex/rgb — no CSS vars — for print rendering) ─────────────
const BG     = '#0b0b12'
const CARD   = '#131320'
const BORDER = '#1e2035'
const TEXT   = '#e2e8f0'
const MUTED  = '#64748b'
const INDIGO = '#818cf8'
const ORANGE = '#fb923c'
const SLATE  = '#94a3b8'
const GREEN  = '#4ade80'
const RED    = '#f87171'
const FONT   = `'Inter','Segoe UI',system-ui,sans-serif`

const DAY_LABEL: Record<string, string> = {
  monday:'MON', tuesday:'TUE', wednesday:'WED', thursday:'THU',
  friday:'FRI', saturday:'SAT', sunday:'SUN',
}

// ─── Task row ────────────────────────────────────────────────────────────────
function taskRow(task: Task, accent: string): string {
  const done  = task.status === 'done'
  const title = task.title.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const dotBg = done ? GREEN : 'transparent'
  const textColor = done ? MUTED : TEXT
  const time  = task.estimatedTime
    ? `<span style="flex-shrink:0;margin-left:6px;font-size:10px;font-family:${FONT};color:${accent};white-space:nowrap">⌛ ${task.estimatedTime}</span>`
    : ''
  return `
  <div style="
    display:flex;align-items:center;gap:8px;
    padding:8px 10px;
    background:${done ? '#0f1020' : '#161828'};
    border-left:3px solid ${done ? '#1a1f35' : accent};
    border-radius:8px;
  ">
    <div style="
      flex-shrink:0;width:13px;height:13px;
      border-radius:50%;
      border:2px solid ${done ? GREEN : accent};
      background:${dotBg};
      display:flex;align-items:center;justify-content:center;
      font-size:8px;font-family:${FONT};color:#000;line-height:1;
    ">${done ? '✓' : ''}</div>
    <span style="
      flex:1;min-width:0;
      font-size:13px;font-weight:600;font-family:${FONT};
      color:${textColor};
      text-decoration:${done ? 'line-through' : 'none'};
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      display:block;
    ">${title}</span>
    ${time}
  </div>`
}

// ─── Section label + rows ─────────────────────────────────────────────────────
function section(label: string, color: string, rows: string): string {
  return `
  <div style="margin-bottom:8px">
    <div style="font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:${color};font-family:${FONT};margin-bottom:5px">${label}</div>
    <div style="display:flex;flex-direction:column;gap:4px">${rows}</div>
  </div>`
}

// ─── Day card ────────────────────────────────────────────────────────────────
function dayCard(day: DayPlan, w: string, h: string): string {
  const wStyle = w ? `width:${w};` : 'flex:1;'
  const hStyle = h ? `height:${h};` : ''

  if (day.isRestDay) {
    return `
    <div style="${wStyle}${hStyle}background:#12101e;border:1px solid #2a1f4a;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px">
      <div style="font-size:28px">🌙</div>
      <div style="font-size:9px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:#7c3aed;font-family:${FONT}">Rest Day</div>
      <div style="font-size:20px;font-weight:800;color:#a78bfa;font-family:${FONT}">${day.date}</div>
    </div>`
  }

  const all   = [day.highTask, ...day.mediumTasks, ...day.smallTasks].filter(Boolean)
  const total = all.length
  const done  = all.filter(t => t?.status === 'done').length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0
  const full  = pct === 100 && total > 0

  const badge = full
    ? `<span style="background:#052e16;color:${GREEN};font-size:8px;font-weight:800;padding:2px 7px;border-radius:20px;font-family:${FONT}">✓ DONE</span>`
    : total === 0
    ? `<span style="background:#1a1f35;color:#334155;font-size:8px;font-weight:800;padding:2px 7px;border-radius:20px;font-family:${FONT}">EMPTY</span>`
    : `<span style="background:#1a1f40;color:${INDIGO};font-size:8px;font-weight:800;padding:2px 7px;border-radius:20px;font-family:${FONT}">${pct}%</span>`

  const barColor    = full ? GREEN : INDIGO
  const progressBar = total > 0 ? `
    <div style="margin-top:5px;height:2px;background:#1e2035;border-radius:99px">
      <div style="height:100%;width:${pct}%;background:${barColor};border-radius:99px"></div>
    </div>
    <div style="margin-top:2px;font-size:9px;color:${MUTED};font-family:${FONT}">${done}/${total} tasks</div>
  ` : ''

  const highRows  = day.highTask    ? taskRow(day.highTask, INDIGO)        : `<div style="font-size:11px;color:#2a3040;font-style:italic;padding:5px 10px;font-family:${FONT}">— No high impact task</div>`
  const medRows   = day.mediumTasks.map(t => taskRow(t, ORANGE)).join('')
  const smallRows = day.smallTasks .map(t => taskRow(t, SLATE )).join('')

  return `
  <div style="${wStyle}${hStyle}background:${CARD};border:1px solid ${BORDER};border-radius:14px;padding:16px;display:flex;flex-direction:column;overflow:hidden">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px">
      <div>
        <div style="font-size:9px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:${MUTED};font-family:${FONT};margin-bottom:1px">${DAY_LABEL[day.day] ?? day.day.slice(0,3).toUpperCase()}</div>
        <div style="font-size:21px;font-weight:800;color:${TEXT};font-family:${FONT};line-height:1">${day.date}</div>
      </div>
      ${badge}
    </div>
    ${progressBar}
    <div style="margin-top:10px;flex:1;overflow:hidden;display:flex;flex-direction:column">
      ${section('⚡ High', INDIGO, highRows)}
      ${medRows   ? section('◈ Medium', ORANGE, medRows)   : ''}
      ${smallRows ? section('· Small',  SLATE,  smallRows) : ''}
    </div>
  </div>`
}

// ─── Bar chart ────────────────────────────────────────────────────────────────
function barChart(weekData: WeekData, h = 100): string {
  const stats = weekData.days.filter(d => !d.isRestDay).map(d => {
    const total = (d.highTask ? 1 : 0) + d.mediumTasks.length + d.smallTasks.length
    const done  = [d.highTask, ...d.mediumTasks, ...d.smallTasks].filter(Boolean).filter(t => t?.status === 'done').length
    return { label: DAY_LABEL[d.day] ?? d.day.slice(0,3).toUpperCase(), done, total }
  })
  const maxV = Math.max(...stats.map(s => s.total), 1)
  return stats.map(s => {
    const dH = Math.round((s.done / maxV) * h)
    const pH = Math.round((s.total / maxV) * h)
    const gH = Math.max(pH - dH, 0)
    return `
    <div style="display:flex;flex-direction:column;align-items:center;gap:5px;flex:1">
      <span style="font-size:11px;color:${MUTED};font-weight:700;font-family:${FONT}">${s.done}/${s.total}</span>
      <div style="display:flex;flex-direction:column-reverse;height:${h}px;width:100%;gap:2px">
        <div style="background:${INDIGO};border-radius:3px 3px 0 0;height:${dH}px;min-height:${s.done > 0 ? 3 : 0}px"></div>
        <div style="background:#1e2035;border-radius:3px 3px 0 0;height:${gH}px;min-height:${s.total > 0 ? 3 : 0}px"></div>
      </div>
      <span style="font-size:11px;color:${MUTED};font-weight:700;font-family:${FONT}">${s.label}</span>
    </div>`
  }).join('')
}

// ─── Page wrapper — forces background printing ────────────────────────────────
function page(content: string, extraStyle = ''): string {
  return `
  <div class="report-page" style="
    width:297mm;height:210mm;
    background:${BG};
    font-family:${FONT};
    overflow:hidden;
    display:flex;flex-direction:column;
    page-break-after:always;break-after:page;
    -webkit-print-color-adjust:exact;print-color-adjust:exact;
    ${extraStyle}
  ">${content}</div>`
}

// ─── Page 1: Cover ────────────────────────────────────────────────────────────
function coverPage(w: WeekData): string {
  const scoreColor = w.score >= 80 ? GREEN : w.score >= 50 ? ORANGE : RED
  const hi   = w.days.flatMap(d => d.highTask ? [d.highTask] : [])
  const med  = w.days.flatMap(d => d.mediumTasks)
  const sm   = w.days.flatMap(d => d.smallTasks)

  function statBox(label: string, done: number, total: number, color: string) {
    const pct = total > 0 ? Math.round((done / total) * 100) : 0
    return `
    <div style="background:${CARD};border:1px solid ${BORDER};border-radius:12px;padding:18px 20px;flex:1">
      <div style="font-size:8px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:${color};font-family:${FONT};margin-bottom:8px">${label}</div>
      <div style="font-size:28px;font-weight:900;color:${TEXT};font-family:${FONT};line-height:1">${done}<span style="font-size:16px;color:${MUTED}">/${total}</span></div>
      ${total > 0 ? `<div style="margin-top:8px;height:2px;background:#1e2035;border-radius:99px"><div style="height:100%;width:${pct}%;background:${color};border-radius:99px"></div></div>` : ''}
    </div>`
  }

  return page(`
    <div style="padding:40px 50px;display:flex;flex-direction:column;height:100%;gap:0">
      <!-- Header -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:24px;border-bottom:1px solid ${BORDER};margin-bottom:24px">
        <div>
          <div style="font-size:9px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#1e293b;font-family:${FONT};margin-bottom:6px">WeeklyOS · Weekly Report</div>
          <div style="font-size:40px;font-weight:900;letter-spacing:-.03em;color:#f1f5f9;font-family:${FONT};line-height:1">Week ${w.weekNumber} — ${w.year}</div>
          <div style="font-size:13px;color:${MUTED};font-family:${FONT};margin-top:6px">${w.dateRange}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:9px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:${MUTED};font-family:${FONT};margin-bottom:4px">Weekly Score</div>
          <div style="font-size:56px;font-weight:900;color:${scoreColor};font-family:${FONT};line-height:1;letter-spacing:-.03em">${w.score}<span style="font-size:26px">%</span></div>
          <div style="font-size:11px;color:${MUTED};font-family:${FONT};margin-top:4px">${w.totalCompleted}/${w.totalPlanned} tasks</div>
        </div>
      </div>

      <!-- Stats -->
      <div style="display:flex;gap:14px;margin-bottom:20px">
        ${statBox('High Impact', hi.filter(t=>t.status==='done').length, hi.length, INDIGO)}
        ${statBox('Medium',      med.filter(t=>t.status==='done').length, med.length, ORANGE)}
        ${statBox('Small Tasks', sm.filter(t=>t.status==='done').length,  sm.length,  SLATE)}
        <div style="background:${CARD};border:1px solid ${BORDER};border-radius:12px;padding:18px 20px;flex:1">
          <div style="font-size:8px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#a78bfa;font-family:${FONT};margin-bottom:8px">Rest Days</div>
          <div style="font-size:28px;font-weight:900;color:${TEXT};font-family:${FONT};line-height:1">${w.days.filter(d=>d.isRestDay).length}</div>
        </div>
      </div>

      <!-- Chart -->
      <div style="background:${CARD};border:1px solid ${BORDER};border-radius:12px;padding:20px 24px;flex:1">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div style="font-size:9px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:${MUTED};font-family:${FONT}">Daily Progress</div>
          <div style="display:flex;gap:14px">
            <div style="display:flex;align-items:center;gap:5px"><div style="width:10px;height:10px;border-radius:2px;background:${INDIGO}"></div><span style="font-size:10px;color:${MUTED};font-weight:700;font-family:${FONT}">DONE</span></div>
            <div style="display:flex;align-items:center;gap:5px"><div style="width:10px;height:10px;border-radius:2px;background:#1e2035"></div><span style="font-size:10px;color:${MUTED};font-weight:700;font-family:${FONT}">PLANNED</span></div>
          </div>
        </div>
        <div style="display:flex;align-items:flex-end;gap:12px;height:100px">
          ${barChart(w, 90)}
        </div>
      </div>
    </div>`)
}

// ─── Day pages: 3 days per page ───────────────────────────────────────────────
function daysPage(days: DayPlan[], title: string): string {
  return page(`
    <div style="padding:28px 30px;display:flex;flex-direction:column;gap:12px;height:100%">
      <div style="font-size:9px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#1e2a40;font-family:${FONT}">${title}</div>
      <div style="display:flex;gap:14px;align-items:flex-start">
        ${days.map(d => dayCard(d, '', '')).join('')}
        ${days.length < 3 ? Array(3 - days.length).fill(`<div style="flex:1"></div>`).join('') : ''}
      </div>
    </div>`)
}

// ─── Evaluation page ──────────────────────────────────────────────────────────
function evalPage(w: WeekData): string {
  function box(icon: string, label: string, text: string, color: string) {
    return `
    <div style="background:${CARD};border:1px solid ${BORDER};border-left:3px solid ${color};border-radius:12px;padding:20px 24px;flex:1">
      <div style="font-size:9px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:${color};font-family:${FONT};margin-bottom:10px">${icon}  ${label}</div>
      <p style="font-size:13px;color:#cbd5e1;font-family:${FONT};line-height:1.7;margin:0">${text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>
    </div>`
  }
  return page(`
    <div style="padding:40px 50px;display:flex;flex-direction:column;height:100%;gap:0">
      <div style="margin-bottom:32px">
        <div style="font-size:9px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#1e293b;font-family:${FONT};margin-bottom:6px">WeeklyOS · Evaluation</div>
        <div style="font-size:38px;font-weight:900;letter-spacing:-.02em;color:#f1f5f9;font-family:${FONT};line-height:1">Weekly Reflection</div>
        <div style="font-size:12px;color:${MUTED};font-family:${FONT};margin-top:6px">${w.dateRange}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px;flex:1">
        ${w.evalWentWell ? box('✓','What Went Well',   w.evalWentWell,  GREEN)  : ''}
        ${w.evalStruggle ? box('⚡','Where I Struggled',w.evalStruggle,  RED)    : ''}
        ${w.evalLessons  ? box('💡','Lessons Learned',  w.evalLessons,   INDIGO) : ''}
      </div>
    </div>`)
}

// ─── Public: full HTML document ───────────────────────────────────────────────
export function generateWeeklyReportHTML(weekData: WeekData): string {
  const pages: string[] = []

  // Page 1: Cover
  pages.push(coverPage(weekData))

  // Day pages: 3 days per page
  const allDays = [
    ...weekData.days.filter(d => !d.isRestDay),
    ...weekData.days.filter(d =>  d.isRestDay),
  ]
  for (let i = 0; i < allDays.length; i += 3) {
    const chunk = allDays.slice(i, i + 3)
    const num   = Math.floor(i / 3) + 1
    pages.push(daysPage(chunk, `Weekly Distribution · Part ${num}`))
  }

  // Evaluation page
  if (weekData.evalWentWell || weekData.evalStruggle || weekData.evalLessons) {
    pages.push(evalPage(weekData))
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>WeeklyOS Report — Week ${weekData.weekNumber} ${weekData.year}</title>
  <style>
    /* Force background printing in all browsers */
    *, *::before, *::after {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
      box-sizing: border-box;
    }
    html, body {
      margin: 0; padding: 0;
      background: ${BG};
      font-family: ${FONT};
    }
    @page {
      size: A4 landscape;
      margin: 0;
    }
    /* Screen: scrollable preview */
    @media screen {
      body { display: flex; flex-direction: column; gap: 0; align-items: center; }
      .report-page { box-shadow: 0 8px 40px rgba(0,0,0,.6); margin: 20px 0; }
      .print-btn {
        position: fixed; bottom: 24px; right: 24px; z-index: 9999;
        background: #818cf8; color: #fff;
        border: none; padding: 14px 28px; border-radius: 12px;
        font-size: 14px; font-weight: 700; cursor: pointer;
        font-family: ${FONT}; box-shadow: 0 8px 32px rgba(129,140,248,.4);
      }
    }
    /* Print: pages break correctly */
    @media print {
      body { background: ${BG} !important; }
      .report-page:last-child { page-break-after: auto !important; break-after: auto !important; }
      .print-btn { display: none !important; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">⬇ Save as PDF</button>
  ${pages.join('\n')}
  <script>
    // Auto-trigger print after fonts settle
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 800);
    });
  </script>
</body>
</html>`
}

/** @deprecated — kept for backward compat, now same as generateWeeklyReportHTML */
export function generateReportSlidesHTML(weekData: WeekData): string {
  return generateWeeklyReportHTML(weekData)
}
