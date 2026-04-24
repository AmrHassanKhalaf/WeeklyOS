import{d as te,e as C,b as ie,u as se,r as y,j as e}from"./index-nCvWaeaw.js";import{A as ae}from"./AppLayout-BdiuzzIj.js";import{G as $}from"./GlowButton-DO6FguMI.js";const G="#0b0b12",P="#131320",S="#1e2035",W="#e2e8f0",v="#64748b",w="#818cf8",z="#fb923c",U="#94a3b8",A="#4ade80",V="#f87171",d="'Inter','Segoe UI',system-ui,sans-serif",q={monday:"MON",tuesday:"TUE",wednesday:"WED",thursday:"THU",friday:"FRI",saturday:"SAT",sunday:"SUN"};function I(t,r){const n=t.status==="done",s=t.title.replace(/</g,"&lt;").replace(/>/g,"&gt;"),a=n?A:"transparent",l=n?v:W,o=m=>m?`${Math.floor(m/60)}m`:"",p=t.estimatedTime?`<span style="flex-shrink:0;margin-left:6px;font-size:10px;font-family:${d};color:#a3a3a3;white-space:nowrap">Est: ${t.estimatedTime}</span>`:"",f=t.actualDuration?`<span style="flex-shrink:0;margin-left:6px;font-size:10px;font-family:${d};color:${r};white-space:nowrap;border:1px solid ${r}40;padding:2px 4px;border-radius:4px;background-color:${r}15">Spent: ${o(t.actualDuration)}</span>`:"";return`
  <div style="
    display:flex;align-items:center;gap:8px;
    padding:8px 10px;
    background:${n?"#0f1020":"#161828"};
    border-left:3px solid ${n?"#1a1f35":r};
    border-radius:8px;
  ">
    <div style="
      flex-shrink:0;width:13px;height:13px;
      border-radius:50%;
      border:2px solid ${n?A:r};
      background:${a};
      display:flex;align-items:center;justify-content:center;
      font-size:8px;font-family:${d};color:#000;line-height:1;
    ">${n?"✓":""}</div>
    <span style="
      flex:1;min-width:0;
      font-size:13px;font-weight:600;font-family:${d};
      color:${l};
      text-decoration:${n?"line-through":"none"};
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      display:block;
    ">${s}</span>
    ${p}
    ${f}
  </div>`}function L(t,r,n){return`
  <div style="margin-bottom:8px">
    <div style="font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:${r};font-family:${d};margin-bottom:5px">${t}</div>
    <div style="display:flex;flex-direction:column;gap:4px">${n}</div>
  </div>`}function K(t,r,n){const s="flex:1;",a="";if(t.isRestDay)return`
    <div style="${s}${a}background:#12101e;border:1px solid #2a1f4a;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px">
      <div style="font-size:28px">🌙</div>
      <div style="font-size:9px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:#7c3aed;font-family:${d}">Rest Day</div>
      <div style="font-size:20px;font-weight:800;color:#a78bfa;font-family:${d}">${t.date}</div>
    </div>`;const l=[t.highTask,...t.mediumTasks,...t.smallTasks].filter(Boolean),o=l.length,p=l.filter(h=>(h==null?void 0:h.status)==="done").length,f=o>0?Math.round(p/o*100):0,m=f===100&&o>0,x=m?`<span style="background:#052e16;color:${A};font-size:8px;font-weight:800;padding:2px 7px;border-radius:20px;font-family:${d}">✓ DONE</span>`:o===0?`<span style="background:#1a1f35;color:#334155;font-size:8px;font-weight:800;padding:2px 7px;border-radius:20px;font-family:${d}">EMPTY</span>`:`<span style="background:#1a1f40;color:${w};font-size:8px;font-weight:800;padding:2px 7px;border-radius:20px;font-family:${d}">${f}%</span>`,k=m?A:w,j=o>0?`
    <div style="margin-top:5px;height:2px;background:#1e2035;border-radius:99px">
      <div style="height:100%;width:${f}%;background:${k};border-radius:99px"></div>
    </div>
    <div style="margin-top:2px;font-size:9px;color:${v};font-family:${d}">${p}/${o} tasks</div>
  `:"",D=t.highTask?I(t.highTask,w):`<div style="font-size:11px;color:#2a3040;font-style:italic;padding:5px 10px;font-family:${d}">— No high impact task</div>`,N=t.mediumTasks.map(h=>I(h,z)).join(""),u=t.smallTasks.map(h=>I(h,U)).join("");return`
  <div style="${s}${a}background:${P};border:1px solid ${S};border-radius:14px;padding:16px;display:flex;flex-direction:column;overflow:hidden">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px">
      <div>
        <div style="font-size:9px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:${v};font-family:${d};margin-bottom:1px">${q[t.day]??t.day.slice(0,3).toUpperCase()}</div>
        <div style="font-size:21px;font-weight:800;color:${W};font-family:${d};line-height:1">${t.date}</div>
      </div>
      ${x}
    </div>
    ${j}
    <div style="margin-top:10px;flex:1;overflow:hidden;display:flex;flex-direction:column">
      ${L("⚡ High",w,D)}
      ${N?L("◈ Medium",z,N):""}
      ${u?L("· Small",U,u):""}
    </div>
  </div>`}function ne(t,r=100){const n=t.days.filter(a=>!a.isRestDay).map(a=>{const l=(a.highTask?1:0)+a.mediumTasks.length+a.smallTasks.length,o=[a.highTask,...a.mediumTasks,...a.smallTasks].filter(Boolean).filter(p=>(p==null?void 0:p.status)==="done").length;return{label:q[a.day]??a.day.slice(0,3).toUpperCase(),done:o,total:l}}),s=Math.max(...n.map(a=>a.total),1);return n.map(a=>{const l=Math.round(a.done/s*r),o=Math.round(a.total/s*r),p=Math.max(o-l,0);return`
    <div style="display:flex;flex-direction:column;align-items:center;gap:5px;flex:1">
      <span style="font-size:11px;color:${v};font-weight:700;font-family:${d}">${a.done}/${a.total}</span>
      <div style="display:flex;flex-direction:column-reverse;height:${r}px;width:100%;gap:2px">
        <div style="background:${w};border-radius:3px 3px 0 0;height:${l}px;min-height:${a.done>0?3:0}px"></div>
        <div style="background:#1e2035;border-radius:3px 3px 0 0;height:${p}px;min-height:${a.total>0?3:0}px"></div>
      </div>
      <span style="font-size:11px;color:${v};font-weight:700;font-family:${d}">${a.label}</span>
    </div>`}).join("")}function _(t,r=""){return`
  <div class="report-page" style="
    width:297mm;height:210mm;
    background:${G};
    font-family:${d};
    overflow:hidden;
    display:flex;flex-direction:column;
    page-break-after:always;break-after:page;
    -webkit-print-color-adjust:exact;print-color-adjust:exact;
    ${r}
  ">${t}</div>`}function re(t){const r=t.score>=80?A:t.score>=50?z:V,n=t.days.flatMap(o=>o.highTask?[o.highTask]:[]),s=t.days.flatMap(o=>o.mediumTasks),a=t.days.flatMap(o=>o.smallTasks);function l(o,p,f,m){const x=f>0?Math.round(p/f*100):0;return`
    <div style="background:${P};border:1px solid ${S};border-radius:12px;padding:18px 20px;flex:1">
      <div style="font-size:8px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:${m};font-family:${d};margin-bottom:8px">${o}</div>
      <div style="font-size:28px;font-weight:900;color:${W};font-family:${d};line-height:1">${p}<span style="font-size:16px;color:${v}">/${f}</span></div>
      ${f>0?`<div style="margin-top:8px;height:2px;background:#1e2035;border-radius:99px"><div style="height:100%;width:${x}%;background:${m};border-radius:99px"></div></div>`:""}
    </div>`}return _(`
    <div style="padding:40px 50px;display:flex;flex-direction:column;height:100%;gap:0">
      <!-- Header -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:24px;border-bottom:1px solid ${S};margin-bottom:24px">
        <div>
          <div style="font-size:9px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#1e293b;font-family:${d};margin-bottom:6px">WeeklyOS · Weekly Report</div>
          <div style="font-size:40px;font-weight:900;letter-spacing:-.03em;color:#f1f5f9;font-family:${d};line-height:1">Week ${t.weekNumber} — ${t.year}</div>
          <div style="font-size:13px;color:${v};font-family:${d};margin-top:6px">${t.dateRange}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:9px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:${v};font-family:${d};margin-bottom:4px">Weekly Score</div>
          <div style="font-size:56px;font-weight:900;color:${r};font-family:${d};line-height:1;letter-spacing:-.03em">${t.score}<span style="font-size:26px">%</span></div>
          <div style="font-size:11px;color:${v};font-family:${d};margin-top:4px">${t.totalCompleted}/${t.totalPlanned} tasks</div>
        </div>
      </div>

      <!-- Stats -->
      <div style="display:flex;gap:14px;margin-bottom:20px">
        ${l("High Impact",n.filter(o=>o.status==="done").length,n.length,w)}
        ${l("Medium",s.filter(o=>o.status==="done").length,s.length,z)}
        ${l("Small Tasks",a.filter(o=>o.status==="done").length,a.length,U)}
        <div style="background:${P};border:1px solid ${S};border-radius:12px;padding:18px 20px;flex:1">
          <div style="font-size:8px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#a78bfa;font-family:${d};margin-bottom:8px">Rest Days</div>
          <div style="font-size:28px;font-weight:900;color:${W};font-family:${d};line-height:1">${t.days.filter(o=>o.isRestDay).length}</div>
        </div>
      </div>

      <!-- Chart -->
      <div style="background:${P};border:1px solid ${S};border-radius:12px;padding:20px 24px;flex:1">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div style="font-size:9px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:${v};font-family:${d}">Daily Progress</div>
          <div style="display:flex;gap:14px">
            <div style="display:flex;align-items:center;gap:5px"><div style="width:10px;height:10px;border-radius:2px;background:${w}"></div><span style="font-size:10px;color:${v};font-weight:700;font-family:${d}">DONE</span></div>
            <div style="display:flex;align-items:center;gap:5px"><div style="width:10px;height:10px;border-radius:2px;background:#1e2035"></div><span style="font-size:10px;color:${v};font-weight:700;font-family:${d}">PLANNED</span></div>
          </div>
        </div>
        <div style="display:flex;align-items:flex-end;gap:12px;height:100px">
          ${ne(t,90)}
        </div>
      </div>
    </div>`)}function oe(t,r){return _(`
    <div style="padding:28px 30px;display:flex;flex-direction:column;gap:12px;height:100%">
      <div style="font-size:9px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#1e2a40;font-family:${d}">${r}</div>
      <div style="display:flex;gap:14px;align-items:flex-start">
        ${t.map(n=>K(n)).join("")}
        ${t.length<3?Array(3-t.length).fill('<div style="flex:1"></div>').join(""):""}
      </div>
    </div>`)}function le(t){function r(n,s,a,l){return`
    <div style="background:${P};border:1px solid ${S};border-left:3px solid ${l};border-radius:12px;padding:20px 24px;flex:1">
      <div style="font-size:9px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:${l};font-family:${d};margin-bottom:10px">${n}  ${s}</div>
      <p style="font-size:13px;color:#cbd5e1;font-family:${d};line-height:1.7;margin:0">${a.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>
    </div>`}return _(`
    <div style="padding:40px 50px;display:flex;flex-direction:column;height:100%;gap:0">
      <div style="margin-bottom:32px">
        <div style="font-size:9px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#1e293b;font-family:${d};margin-bottom:6px">WeeklyOS · Evaluation</div>
        <div style="font-size:38px;font-weight:900;letter-spacing:-.02em;color:#f1f5f9;font-family:${d};line-height:1">Weekly Reflection</div>
        <div style="font-size:12px;color:${v};font-family:${d};margin-top:6px">${t.dateRange}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px;flex:1">
        ${t.evalWentWell?r("✓","What Went Well",t.evalWentWell,A):""}
        ${t.evalStruggle?r("⚡","Where I Struggled",t.evalStruggle,V):""}
        ${t.evalLessons?r("💡","Lessons Learned",t.evalLessons,w):""}
      </div>
    </div>`)}function de(t,r){const n=r.trim(),s=n.lastIndexOf(" — "),a=s>-1?n.slice(0,s).trim():n,l=s>-1?n.slice(s+3).trim():"",o=t.map(p=>K(p)).join("");return _(`
    <div style="padding:36px 40px;display:flex;flex-direction:column;height:100%;gap:28px">
      <!-- Days centered at top -->
      <div style="display:flex;gap:16px;align-items:flex-start;justify-content:center">
        ${o}
      </div>

      <!-- Closing quote -->
      <div style="
        flex:1;display:flex;align-items:center;justify-content:center;
        background:${P};border:1px solid ${S};
        border-left:4px solid ${w};
        border-radius:16px;padding:32px 48px;
      ">
        <div style="text-align:center;max-width:700px">
          <div style="font-size:32px;margin-bottom:20px;opacity:.4">&ldquo;</div>
          <p style="
            font-size:22px;font-weight:600;font-style:italic;
            color:${W};font-family:${d};line-height:1.6;
            margin:0 0 16px;
          ">${a.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>
          ${l?`<p style="font-size:13px;font-weight:700;color:${w};font-family:${d};letter-spacing:.08em;text-transform:uppercase;margin:0">— ${l.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>`:""}
        </div>
      </div>
    </div>`)}function ce(t,r={}){const n=r.includedDays??null,s=r.closingQuote??"The secret of getting ahead is getting started.",a=[];a.push(re(t)),(t.evalWentWell||t.evalStruggle||t.evalLessons)&&a.push(le(t));const l=t.days.filter(x=>!n||n.includes(x.day)),o=l.filter(x=>!x.isRestDay),p=l.filter(x=>x.isRestDay),f=[...o,...p],m=[];for(let x=0;x<f.length;x+=3)m.push(f.slice(x,x+3));return m.forEach((x,k)=>{const j=k===m.length-1,D=x.length<3,N=`Weekly Distribution · Part ${k+1}`;j&&D?a.push(de(x,s)):a.push(oe(x,N))}),`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>WeeklyOS Report — Week ${t.weekNumber} ${t.year}</title>
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
      background: ${G};
      font-family: ${d};
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
        font-family: ${d}; box-shadow: 0 8px 32px rgba(129,140,248,.4);
      }
    }
    /* Print: pages break correctly */
    @media print {
      body { background: ${G} !important; }
      .report-page:last-child { page-break-after: auto !important; break-after: auto !important; }
      .print-btn { display: none !important; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">⬇ Save as PDF</button>
  ${a.join(`
`)}
  <script>
    // Auto-trigger print after fonts settle
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 800);
    });
  <\/script>
</body>
</html>`}let b=null;function E(t){const r=t==null?void 0:t.code;return r==="PGRST205"||r==="42P01"}function H(t){return{id:String(t.id),title:String(t.title),description:t.description?String(t.description):void 0,priority:t.priority||"medium",dayOfWeek:t.day_of_week,startTime:t.start_time?String(t.start_time):void 0,endTime:t.end_time?String(t.end_time):void 0,tags:t.tags||void 0,isActive:!!t.is_active,untilDate:t.until_date?String(t.until_date):void 0}}const pe=te((t,r)=>({items:[],isLoading:!1,error:null,loadPinnedTasks:async()=>{if(b===!1){t({items:[],isLoading:!1,error:null});return}const{data:{session:n}}=await C.auth.getSession(),s=n==null?void 0:n.user;if(!s)return;t({isLoading:!0,error:null});const{data:a,error:l}=await C.from("pinned_tasks").select("*").eq("user_id",s.id).order("created_at",{ascending:!1});if(l){if(E(l)){b=!1,t({items:[],isLoading:!1,error:null});return}t({isLoading:!1,error:l.message});return}b=!0,t({items:(a||[]).map(o=>H(o)),isLoading:!1,error:null})},createPinnedTask:async n=>{if(b===!1)throw new Error("Pinned tasks تحتاج تطبيق Migration قاعدة البيانات أولاً.");const{data:{session:s}}=await C.auth.getSession(),a=s==null?void 0:s.user;if(!a)return;const{data:l,error:o}=await C.from("pinned_tasks").insert({user_id:a.id,title:n.title,description:n.description||null,priority:n.priority,day_of_week:n.dayOfWeek,start_time:n.startTime||null,end_time:n.endTime||null,tags:n.tags||null,is_active:n.isActive,until_date:n.untilDate||null}).select("*").single();if(o)throw E(o)?(b=!1,new Error("Pinned tasks غير مفعلة بعد. طبّق migration ثم أعد المحاولة.")):(t({error:o.message}),new Error(o.message));b=!0;const p=H(l);t(f=>({items:[p,...f.items]}))},updatePinnedTask:async(n,s)=>{if(b===!1)throw new Error("Pinned tasks غير مفعلة بعد. طبّق migration أولاً.");const{error:a}=await C.from("pinned_tasks").update({...s.title!==void 0&&{title:s.title},...s.description!==void 0&&{description:s.description||null},...s.priority!==void 0&&{priority:s.priority},...s.dayOfWeek!==void 0&&{day_of_week:s.dayOfWeek},...s.startTime!==void 0&&{start_time:s.startTime||null},...s.endTime!==void 0&&{end_time:s.endTime||null},...s.tags!==void 0&&{tags:s.tags||null},...s.isActive!==void 0&&{is_active:s.isActive},...s.untilDate!==void 0&&{until_date:s.untilDate||null},updated_at:new Date().toISOString()}).eq("id",n);if(a)throw E(a)?(b=!1,new Error("Pinned tasks غير مفعلة بعد. طبّق migration ثم أعد المحاولة.")):(t({error:a.message}),new Error(a.message));t(l=>({items:l.items.map(o=>o.id===n?{...o,...s}:o)}))},deletePinnedTask:async n=>{if(b===!1)return;const{error:s}=await C.from("pinned_tasks").delete().eq("id",n);if(s){if(E(s)){b=!1;return}throw t({error:s.message}),new Error(s.message)}t(a=>({items:a.items.filter(l=>l.id!==n)}))},togglePinnedTask:async(n,s)=>{await r().updatePinnedTask(n,{isActive:s})}})),xe=["Africa/Cairo","UTC","Europe/London","Europe/Berlin","Asia/Riyadh","Asia/Dubai","Asia/Kolkata","America/New_York","America/Chicago","America/Los_Angeles"],me=[{value:"saturday",label:"Saturday"},{value:"sunday",label:"Sunday"},{value:"monday",label:"Monday"}];function ve(){const t=ie(),{currentWeek:r,getPreviousWeekForReport:n,goToWeek:s}=se(),a=pe(),[l,o]=y.useState(!1),[p,f]=y.useState(t.activeProvider),[m,x]=y.useState(t.activeModel),[k,j]=y.useState(!1),[D,N]=y.useState(!1),[u,h]=y.useState({title:"",description:"",priority:"medium",dayOfWeek:"monday",startTime:"07:00",endTime:"10:00",tags:"",untilDate:"",isActive:!0});y.useEffect(()=>{f(t.activeProvider),x(t.activeModel)},[t.activeProvider,t.activeModel]),y.useEffect(()=>{a.loadPinnedTasks()},[]),y.useEffect(()=>{if(!t.autoDownloadCompletedWeekReport||!r)return;const i=`weeklyos:auto-report:${r.year}:w${r.weekNumber}`;if(localStorage.getItem(i))return;(async()=>{const g=await n();g&&(M(g),localStorage.setItem(i,"1"))})()},[t.autoDownloadCompletedWeekReport,r==null?void 0:r.id]);const F=p==="gemini"?!["gemini-flash-latest","gemini-3.1-pro-preview","gemini-3-flash-preview","gemini-2.5-pro","gemini-2.5-flash","gemini-2.5-flash-lite","gemini-live-2.5-flash-native-audio"].includes(m):!["grok-4","grok-4.1-fast","grok-4-vision","grok-code-fast-1"].includes(m),Y=async()=>{j(!0),await t.setActiveProvider(p),await t.setActiveModel(m),j(!1),N(!0),setTimeout(()=>N(!1),2e3)},M=i=>{const c=i||r;if(!(!c||l)){o(!0);try{const g=ce(c,{includedDays:t.reportIncludedDays,closingQuote:t.reportClosingQuote}),T=new Blob([g],{type:"text/html;charset=utf-8"}),O=URL.createObjectURL(T),B=window.open(O,"_blank");B?B.addEventListener("load",()=>URL.revokeObjectURL(O),{once:!0}):(setTimeout(()=>URL.revokeObjectURL(O),6e4),alert("Pop-up blocked — please allow pop-ups for this site."))}catch(g){console.error("Report failed:",g)}finally{o(!1)}}},Z=async()=>{const i=await n();if(!i){alert("No completed week available yet.");return}M(i)},X=async()=>{if(!u.title.trim()){alert("Please enter a title for the pinned task.");return}try{await a.createPinnedTask({title:u.title.trim(),description:u.description.trim()||void 0,priority:u.priority,dayOfWeek:u.dayOfWeek,startTime:u.startTime||void 0,endTime:u.endTime||void 0,tags:u.tags?u.tags.split(",").map(i=>i.trim()).filter(Boolean):void 0,untilDate:u.untilDate||void 0,isActive:u.isActive}),r&&await s(r.weekNumber,r.year),h({title:"",description:"",priority:"medium",dayOfWeek:"monday",startTime:"07:00",endTime:"10:00",tags:"",untilDate:"",isActive:!0})}catch(i){alert(i instanceof Error?i.message:"Failed to create pinned task")}},J=async(i,c)=>{try{await a.togglePinnedTask(i,c),r&&await s(r.weekNumber,r.year)}catch(g){alert(g instanceof Error?g.message:"Failed to update pinned task")}},ee=async i=>{try{await a.deletePinnedTask(i),r&&await s(r.weekNumber,r.year)}catch(c){alert(c instanceof Error?c.message:"Failed to delete pinned task")}},R=({label:i,desc:c,checked:g,onChange:T})=>e.jsxs("div",{className:"flex items-center justify-between gap-4 p-4 bg-surface-container-low/70 rounded-xl border border-white/10",children:[e.jsxs("div",{children:[e.jsx("p",{className:"font-bold text-on-surface text-sm",children:i}),e.jsx("p",{className:"text-xs text-neutral-500 mt-0.5",children:c})]}),e.jsx("button",{onClick:()=>T(!g),className:`w-12 h-6 rounded-full p-1 transition-colors ${g?"bg-primary":"bg-surface-variant"}`,children:e.jsx("div",{className:`w-4 h-4 rounded-full bg-white transition-transform ${g?"translate-x-6":"translate-x-0"}`})})]});return e.jsx(ae,{children:e.jsxs("div",{className:"max-w-[1280px] mx-auto px-4 md:px-8 lg:px-10 py-8 md:py-10",children:[e.jsx("div",{className:"mb-8 rounded-2xl border border-white/10 bg-gradient-to-br from-surface-container-low/70 to-surface-container-lowest/80 p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.3)]",children:e.jsxs("div",{className:"flex flex-col md:flex-row md:items-center md:justify-between gap-4",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-on-surface mb-2",children:"Settings"}),e.jsx("p",{className:"text-sm md:text-base text-neutral-300",children:"Configure your WeeklyOS experience, AI integrations, and privacy in one place."})]}),e.jsxs("div",{className:"flex items-center gap-2 text-xs uppercase tracking-widest font-bold",children:[e.jsx("span",{className:"px-2.5 py-1 rounded-full bg-primary/15 text-primary",children:"Workspace"}),e.jsx("span",{className:"px-2.5 py-1 rounded-full bg-tertiary/15 text-tertiary",children:"AI"}),e.jsx("span",{className:"px-2.5 py-1 rounded-full bg-error/15 text-error",children:"Privacy"})]})]})}),e.jsxs("div",{className:"grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8 items-start",children:[e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{className:"rounded-2xl border border-white/10 bg-surface-container-low/40 p-5 md:p-6",children:[e.jsxs("div",{className:"flex items-center gap-3 text-primary mb-5",children:[e.jsx("span",{className:"material-symbols-outlined",children:"smart_toy"}),e.jsx("h2",{className:"text-[13px] font-bold uppercase tracking-widest",children:"AI Integration"})]}),e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2",children:"Primary Model"}),e.jsxs("div",{className:"flex flex-col gap-3",children:[e.jsxs("div",{className:"grid grid-cols-2 gap-2",children:[e.jsxs("select",{value:p,onChange:i=>{const c=i.target.value;f(c),c==="grok"&&x("grok-2-mini"),c==="gemini"&&x("gemini-1.5-flash")},className:"bg-surface-container-low px-3 py-2.5 rounded-xl border border-white/10 outline-none text-sm text-on-surface",children:[e.jsx("option",{value:"gemini",children:"Google Gemini"}),e.jsx("option",{value:"grok",children:"Grok (xAI)"})]}),e.jsxs("select",{value:F?"custom":m,onChange:i=>{i.target.value!=="custom"?x(i.target.value):x("")},className:"bg-surface-container-low px-3 py-2.5 rounded-xl border border-white/10 outline-none text-sm text-on-surface text-tertiary font-medium",children:[p==="grok"&&e.jsxs(e.Fragment,{children:[e.jsx("option",{value:"grok-4",children:"grok-4"}),e.jsx("option",{value:"grok-4.1-fast",children:"grok-4.1-fast"}),e.jsx("option",{value:"grok-4-vision",children:"grok-4-vision"}),e.jsx("option",{value:"grok-code-fast-1",children:"grok-code-fast-1"})]}),p==="gemini"&&e.jsxs(e.Fragment,{children:[e.jsx("option",{value:"gemini-flash-latest",children:"gemini-flash-latest"}),e.jsx("option",{value:"gemini-3.1-pro-preview",children:"gemini-3.1-pro-preview"}),e.jsx("option",{value:"gemini-3-flash-preview",children:"gemini-3-flash-preview"}),e.jsx("option",{value:"gemini-2.5-pro",children:"gemini-2.5-pro"}),e.jsx("option",{value:"gemini-2.5-flash",children:"gemini-2.5-flash"}),e.jsx("option",{value:"gemini-2.5-flash-lite",children:"gemini-2.5-flash-lite"}),e.jsx("option",{value:"gemini-live-2.5-flash-native-audio",children:"gemini-live-audio"})]}),e.jsx("option",{value:"custom",children:"Other (Custom...)"})]})]}),F&&e.jsx("input",{type:"text",value:m,onChange:i=>x(i.target.value),placeholder:`Custom ${p} model...`,className:"w-full bg-surface-container-lowest px-4 py-3 rounded-xl border border-white/10 outline-none text-sm font-mono focus:border-tertiary/50 transition-colors"}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx($,{type:"button",onClick:Y,compact:!0,variant:"secondary",disabled:k||!m.trim()||p===t.activeProvider&&m===t.activeModel,className:"text-[11px] font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed",children:k?"Saving...":D?"Saved!":"Save Selection"}),D&&e.jsx("span",{className:"text-tertiary text-[11px] font-medium uppercase tracking-widest",children:"Updated"})]})]})]}),e.jsxs("div",{className:"space-y-4 py-4 border-y border-white/10",children:[e.jsx(Q,{provider:"gemini",label:"Google Gemini",settings:t}),e.jsx(Q,{provider:"grok",label:"xAI Grok",settings:t})]}),e.jsx(R,{label:"Fallback Provider",desc:"Switch to another provider if the primary fails.",checked:t.fallbackEnabled,onChange:t.setFallbackEnabled})]})]}),e.jsxs("div",{className:"rounded-2xl border border-white/10 bg-surface-container-low/40 p-5 md:p-6",children:[e.jsxs("div",{className:"flex items-center gap-3 text-primary mb-5",children:[e.jsx("span",{className:"material-symbols-outlined",children:"push_pin"}),e.jsx("h2",{className:"text-[13px] font-bold uppercase tracking-widest",children:"Pinned Tasks"})]}),e.jsxs("div",{className:"space-y-3",children:[e.jsx("p",{className:"text-xs text-neutral-500",children:"Pinned tasks repeat every week on your selected day/time until disabled or deleted."}),e.jsx("input",{type:"text",placeholder:"Task title",value:u.title,onChange:i=>h(c=>({...c,title:i.target.value})),className:"w-full bg-surface-container-lowest px-4 py-2.5 rounded-lg border border-white/10 outline-none text-sm"}),e.jsx("textarea",{rows:2,placeholder:"Description (optional)",value:u.description,onChange:i=>h(c=>({...c,description:i.target.value})),className:"w-full bg-surface-container-lowest px-4 py-2.5 rounded-lg border border-white/10 outline-none text-sm resize-none"}),e.jsxs("div",{className:"grid grid-cols-2 gap-2",children:[e.jsxs("select",{value:u.priority,onChange:i=>h(c=>({...c,priority:i.target.value})),className:"bg-surface-container-lowest px-3 py-2 rounded-lg border border-white/10 text-sm",children:[e.jsx("option",{value:"high",children:"High"}),e.jsx("option",{value:"medium",children:"Medium"}),e.jsx("option",{value:"low",children:"Low"})]}),e.jsx("select",{value:u.dayOfWeek,onChange:i=>h(c=>({...c,dayOfWeek:i.target.value})),className:"bg-surface-container-lowest px-3 py-2 rounded-lg border border-white/10 text-sm",children:["saturday","sunday","monday","tuesday","wednesday","thursday","friday"].map(i=>e.jsx("option",{value:i,children:i},i))})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-2",children:[e.jsx("input",{type:"time",value:u.startTime,onChange:i=>h(c=>({...c,startTime:i.target.value})),className:"bg-surface-container-lowest px-3 py-2 rounded-lg border border-white/10 text-sm [color-scheme:dark]"}),e.jsx("input",{type:"time",value:u.endTime,onChange:i=>h(c=>({...c,endTime:i.target.value})),className:"bg-surface-container-lowest px-3 py-2 rounded-lg border border-white/10 text-sm [color-scheme:dark]"})]}),e.jsx("input",{type:"text",placeholder:"Tags (comma separated)",value:u.tags,onChange:i=>h(c=>({...c,tags:i.target.value})),className:"w-full bg-surface-container-lowest px-4 py-2.5 rounded-lg border border-white/10 outline-none text-sm"}),e.jsx("input",{type:"date",value:u.untilDate,onChange:i=>h(c=>({...c,untilDate:i.target.value})),className:"w-full bg-surface-container-lowest px-4 py-2.5 rounded-lg border border-white/10 outline-none text-sm [color-scheme:dark]"}),e.jsx("p",{className:"text-[11px] text-neutral-500",children:"Leave date empty to repeat indefinitely."}),e.jsx($,{type:"button",onClick:X,compact:!0,variant:"secondary",className:"text-[11px] font-bold uppercase tracking-widest",children:"Create Pinned Task"}),e.jsxs("div",{className:"space-y-2 pt-2 border-t border-white/10 max-h-64 overflow-y-auto pr-1",children:[a.items.length===0&&e.jsx("p",{className:"text-xs text-neutral-500",children:"No pinned tasks yet."}),a.items.map(i=>e.jsx("div",{className:"bg-surface-container-lowest border border-white/5 rounded-lg px-3 py-2.5",children:e.jsxs("div",{className:"flex items-center justify-between gap-3",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold leading-tight",children:i.title}),e.jsxs("p",{className:"text-[12px] text-neutral-500 mt-0.5",children:[i.dayOfWeek," • ",i.startTime||"--:--"," – ",i.endTime||"--:--"]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("button",{onClick:()=>void J(i.id,!i.isActive),className:`px-2.5 py-1 rounded text-[11px] uppercase tracking-wider font-bold ${i.isActive?"bg-tertiary/15 text-tertiary":"bg-neutral-700/30 text-neutral-400"}`,children:i.isActive?"Active":"Paused"}),e.jsx("button",{onClick:()=>void ee(i.id),className:"px-2.5 py-1 rounded text-[11px] uppercase tracking-wider font-bold bg-error/15 text-error",children:"Delete"})]})]})},i.id))]})]})]})]}),e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{className:"rounded-2xl border border-white/10 bg-surface-container-low/40 p-5 md:p-6",children:[e.jsxs("div",{className:"flex items-center gap-3 text-primary mb-5",children:[e.jsx("span",{className:"material-symbols-outlined",children:"calendar_month"}),e.jsx("h2",{className:"text-[13px] font-bold uppercase tracking-widest",children:"Work Schedule"})]}),e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"grid grid-cols-2 gap-3",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2",children:"Timezone"}),e.jsxs("select",{value:t.timezone,onChange:i=>t.setTimezone(i.target.value),className:"w-full bg-surface-container-lowest px-3 py-2.5 rounded-xl border border-white/10 outline-none text-sm",children:[e.jsx("option",{value:Intl.DateTimeFormat().resolvedOptions().timeZone,children:"System"}),xe.map(i=>e.jsx("option",{value:i,children:i},i))]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2",children:"Week Starts"}),e.jsx("select",{value:t.weekStartDay,onChange:i=>t.setWeekStartDay(i.target.value),className:"w-full bg-surface-container-lowest px-3 py-2.5 rounded-xl border border-white/10 outline-none text-sm",children:me.map(i=>e.jsx("option",{value:i.value,children:i.label},i.value))})]})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2",children:"Rest Days"}),e.jsx("div",{className:"flex flex-wrap gap-2",children:["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].map(i=>{const c=(t.restDays||[]).includes(i);return e.jsx($,{type:"button",compact:!0,onClick:()=>{const g=t.restDays||[];t.setRestDays(c?g.filter(T=>T!==i):[...g,i])},variant:c?"secondary":"tertiary",className:`uppercase tracking-wider text-[11px] font-bold ${c?"text-white":"text-neutral-400"}`,children:i.slice(0,3)},i)})})]})]})]}),e.jsxs("div",{className:"rounded-2xl border border-white/10 bg-surface-container-low/40 p-5 md:p-6",children:[e.jsxs("div",{className:"flex items-center gap-3 text-tertiary mb-5",children:[e.jsx("span",{className:"material-symbols-outlined",children:"palette"}),e.jsx("h2",{className:"text-[13px] font-bold uppercase tracking-widest",children:"Appearance"})]}),e.jsx("div",{className:"flex gap-3",children:["dark","light","system"].map(i=>e.jsx($,{type:"button",compact:!0,onClick:()=>t.setTheme(i),variant:t.theme===i?"secondary":"tertiary",className:`flex-1 text-[12px] font-bold uppercase tracking-wider ${t.theme===i?"":"opacity-75 hover:opacity-100"}`,children:i},i))})]}),e.jsxs("div",{className:"rounded-2xl border border-white/10 bg-surface-container-low/40 p-5 md:p-6",children:[e.jsxs("div",{className:"flex items-center gap-3 text-neutral-400 mb-5",children:[e.jsx("span",{className:"material-symbols-outlined",children:"notifications"}),e.jsx("h2",{className:"text-[13px] font-bold uppercase tracking-widest",children:"Notifications"})]}),e.jsxs("div",{className:"space-y-3",children:[e.jsx(R,{label:"Daily Reminders",desc:"Get notified about your main objective every morning.",checked:t.dailyReminders,onChange:t.setDailyReminders}),e.jsx(R,{label:"Weekly Summary",desc:"Receive a report of your week's performance.",checked:t.weeklySummaries,onChange:t.setWeeklySummaries}),e.jsx(R,{label:"Auto-download Report",desc:"Downloads last completed week's PDF once after rollover.",checked:t.autoDownloadCompletedWeekReport,onChange:t.setAutoDownloadCompletedWeekReport})]})]})]}),e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{className:"rounded-2xl border border-white/10 bg-surface-container-low/40 p-5 md:p-6",children:[e.jsxs("div",{className:"flex items-center gap-3 text-tertiary mb-5",children:[e.jsx("span",{className:"material-symbols-outlined",children:"picture_as_pdf"}),e.jsx("h2",{className:"text-[13px] font-bold uppercase tracking-widest",children:"Report Settings"})]}),e.jsxs("div",{className:"space-y-5",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2",children:"Days in Report"}),e.jsx("div",{className:"flex flex-wrap gap-2",children:["saturday","sunday","monday","tuesday","wednesday","thursday","friday"].map(i=>{const c=(t.reportIncludedDays??[]).includes(i);return e.jsx($,{type:"button",compact:!0,onClick:()=>{const g=t.reportIncludedDays??[];t.setReportIncludedDays(c?g.filter(T=>T!==i):[...g,i])},variant:c?"secondary":"tertiary",className:`uppercase tracking-wider text-[11px] font-bold ${c?"text-white":"text-neutral-500"}`,children:i.slice(0,3)},i)})}),e.jsx("p",{className:"text-[11px] text-neutral-500 mt-2",children:"Disabled days won't appear in the exported PDF."})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2",children:"Closing Page Quote"}),e.jsx("textarea",{rows:3,placeholder:"e.g. The secret of getting ahead is getting started. — Mark Twain",value:t.reportClosingQuote??"",onChange:i=>t.setReportClosingQuote(i.target.value),className:"w-full bg-surface-container-lowest px-4 py-3 rounded-xl border border-white/10 outline-none text-sm text-on-surface resize-none focus:border-tertiary/50 transition-colors"}),e.jsx("p",{className:"text-[11px] text-neutral-500 mt-1",children:'Use " — Author" at the end to add an attribution.'})]}),e.jsxs("div",{className:"space-y-2 pt-2 border-t border-white/10",children:[e.jsxs($,{type:"button",onClick:()=>void M(),disabled:l,compact:!0,variant:"secondary",className:"w-full text-sm font-bold disabled:opacity-50",children:[e.jsx("span",{className:"material-symbols-outlined text-[18px]",children:l?"sync":"download"}),l?"Generating...":"Export This Week"]}),e.jsxs($,{type:"button",onClick:()=>void Z(),disabled:l,compact:!0,variant:"tertiary",className:"w-full text-sm font-bold disabled:opacity-50",children:[e.jsx("span",{className:"material-symbols-outlined text-[18px]",children:"history"}),"Export Previous Week"]})]})]})]}),e.jsxs("div",{className:"rounded-2xl border border-white/10 bg-surface-container-low/40 p-5 md:p-6",children:[e.jsxs("div",{className:"flex items-center gap-3 text-error mb-5",children:[e.jsx("span",{className:"material-symbols-outlined",children:"security"}),e.jsx("h2",{className:"text-[13px] font-bold uppercase tracking-widest",children:"Privacy & Data"})]}),e.jsx(R,{label:"Analytics Tracking",desc:"Share anonymous usage data to help us improve.",checked:t.analyticsEnabled,onChange:t.setAnalyticsEnabled})]})]})]})]})})}function Q({provider:t,label:r,settings:n}){const[s,a]=y.useState(n.aiKeys[t]||""),[l,o]=y.useState(!1),[p,f]=y.useState(!1),[m,x]=y.useState(!1),k=async()=>{f(!0),await n.setAiKey(t,s),f(!1),x(!0),setTimeout(()=>x(!1),2e3)};return e.jsxs("div",{children:[e.jsxs("label",{className:"block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2",children:[r," API Key"]}),e.jsxs("div",{className:"flex bg-surface-container-low rounded-xl border border-white/10 overflow-hidden focus-within:border-primary/50 transition-colors",children:[e.jsx("input",{type:l?"text":"password",value:s,onChange:j=>a(j.target.value),placeholder:"sk-...",className:"flex-1 bg-transparent px-4 py-3 outline-none text-sm text-on-surface font-mono"}),e.jsx("button",{onClick:()=>o(!l),className:"px-4 text-neutral-500 hover:text-white border-l border-white/5",children:e.jsx("span",{className:"material-symbols-outlined text-[18px]",children:l?"visibility_off":"visibility"})}),e.jsx($,{type:"button",onClick:k,disabled:p||s===(n.aiKeys[t]||""),compact:!0,variant:"secondary",className:"font-bold text-[11px] disabled:opacity-50 disabled:cursor-not-allowed",children:p?"SAVING...":m?"SAVED":"SAVE"})]}),m&&e.jsx("p",{className:"text-tertiary text-[11px] mt-1 font-medium",children:"API key saved successfully"})]})}export{ve as Settings};
