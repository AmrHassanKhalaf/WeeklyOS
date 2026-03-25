import{u as k,b as N,r as m,j as e}from"./index-CaPg-QTL.js";import{A as p,u as v}from"./AppLayout-BtHqH1nV.js";import{D as w}from"./DayCardDistribution-DGZN3acP.js";import{u as S}from"./useBrainDumpStore-BPUR76le.js";function R(){var u;const{currentWeek:a,isLoadingWeek:y,createTask:g}=k(),{brainDumpItems:n,loadItems:l,deleteSelected:h,toggleSelection:x}=S(),{restDays:d}=N();m.useEffect(()=>{l()},[l]);const[r,c]=m.useState(!1),{sendMessage:f}=v(),b=async()=>{if(!a||r||n.length===0)return;c(!0);const i=`Your job is to convert a brain dump into a structured weekly plan using the 1-3-5 productivity system.
    
Rules:
- 1 main task per day (High priority)
- 3 medium tasks (Medium priority)
- 5 small tasks (Low priority)

Input:
Brain dump items: ${n.map(s=>s.content).join(", ")}

Output requirements:
Return exactly one JSON object with a "tasks" array.
Each object in the array MUST have:
- title: string
- priority: "high" | "medium" | "low"
- day: "saturday" | "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday"
- estimatedTime: optional string (e.g. "1h", "30m")

Make sure:
- Avoid overloading any day
- Balance workload logically
- DO NOT assign tasks to rest days: ${d.join(", ")}`;try{const s=await f("schedule",i,{dateRange:a.dateRange});let o;try{o=JSON.parse(s.response)}catch{const t=s.response.match(/```json\n([\s\S]*)\n```/);o=JSON.parse(t?t[1]:s.response.replace(/```json|```/g,""))}const j=o.tasks||(Array.isArray(o)?o:[]);for(const t of j)!t.title||!t.priority||!t.day||await g({title:t.title,priority:t.priority,day:t.day,estimatedTime:t.estimatedTime});n.forEach(t=>{t.selected||x(t.id)}),await h()}catch(s){alert("Failed to auto-distribute: "+s.message)}finally{c(!1)}};return y||!a?e.jsx(p,{children:e.jsx("div",{className:"p-8 grid grid-cols-2 gap-6",children:Array.from({length:6}).map((i,s)=>e.jsx("div",{className:"h-[500px] bg-surface-container-low rounded-2xl animate-pulse border border-white/5"},s))})}):e.jsx(p,{children:e.jsxs("div",{className:"h-full flex flex-col",children:[e.jsxs("div",{className:"px-8 py-8 flex items-end justify-between shrink-0",children:[e.jsxs("div",{className:"space-y-1",children:[e.jsxs("h1",{className:"text-[2.75rem] font-bold tracking-tight text-on-surface leading-none",children:["Week ",a.weekNumber," — ",((u=a.dateRange.split("—")[1])==null?void 0:u.trim())??String(a.year)]}),e.jsxs("p",{className:"text-sm text-on-surface-variant flex items-center gap-2",children:[e.jsx("span",{className:"material-symbols-outlined text-sm",children:"calendar_today"}),"Distribution Phase: Aligning energy with impact."]})]}),e.jsxs("div",{className:"flex gap-3",children:[e.jsxs("button",{className:"px-4 py-2 bg-surface-container-high hover:bg-surface-variant transition-colors rounded-lg flex items-center gap-2 text-xs font-semibold",children:[e.jsx("span",{className:"material-symbols-outlined text-lg",children:"psychology"}),"Assign Braindump"]}),e.jsxs("button",{onClick:b,disabled:r||n.length===0,className:`px-4 py-2 bg-gradient-to-br from-tertiary-container to-tertiary text-on-tertiary rounded-lg flex items-center gap-2 text-xs font-bold shadow-lg shadow-tertiary/10 transition-all ${r||n.length===0?"opacity-50 cursor-not-allowed grayscale":"hover:brightness-110"}`,children:[e.jsx("span",{className:`material-symbols-outlined text-lg ${r?"animate-spin":""}`,children:r?"sync":"auto_mode"}),r?"Distributing...":"Auto-distribute"]})]})]}),e.jsx("div",{className:"flex-1 px-8 pb-8 overflow-y-auto custom-scrollbar",children:e.jsx("div",{className:"grid grid-cols-2 gap-6 pb-12",children:a.days.map(i=>e.jsx(w,{day:{...i,isRestDay:(d||[]).includes(i.day)},isHighOutputZone:i.isToday},i.day))})})]})})}export{R as WeeklyDistribution};
