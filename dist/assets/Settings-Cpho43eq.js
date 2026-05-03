import{e as ne,f as z,c as re,u as le,r as v,j as e}from"./index-BYkaYh4b.js";import{A as oe}from"./AppLayout-CjVQz1VH.js";import{B as N}from"./Button-R-T1mTyx.js";import{C as $,S as A,I as D,T as q}from"./Card-BBsqSJVD.js";import{S as de}from"./Section-SHBkFroR.js";const B="#0b0b12",R="#131320",C="#1e2035",_="#e2e8f0",y="#64748b",k="#818cf8",M="#fb923c",H="#94a3b8",W="#4ade80",Z="#f87171",c="'Inter','Segoe UI',system-ui,sans-serif",X={monday:"MON",tuesday:"TUE",wednesday:"WED",thursday:"THU",friday:"FRI",saturday:"SAT",sunday:"SUN"};function U(t,r){const n=t.status==="done",s=t.title.replace(/</g,"&lt;").replace(/>/g,"&gt;"),a=n?W:"transparent",o=n?y:_,l=x=>x?`${Math.floor(x/60)}m`:"",p=t.estimatedTime?`<span style="flex-shrink:0;margin-left:6px;font-size:10px;font-family:${c};color:#a3a3a3;white-space:nowrap">Est: ${t.estimatedTime}</span>`:"",g=t.actualDuration?`<span style="flex-shrink:0;margin-left:6px;font-size:10px;font-family:${c};color:${r};white-space:nowrap;border:1px solid ${r}40;padding:2px 4px;border-radius:4px;background-color:${r}15">Spent: ${l(t.actualDuration)}</span>`:"";return`
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
      border:2px solid ${n?W:r};
      background:${a};
      display:flex;align-items:center;justify-content:center;
      font-size:8px;font-family:${c};color:#000;line-height:1;
    ">${n?"✓":""}</div>
    <span style="
      flex:1;min-width:0;
      font-size:13px;font-weight:600;font-family:${c};
      color:${o};
      text-decoration:${n?"line-through":"none"};
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      display:block;
    ">${s}</span>
    ${p}
    ${g}
  </div>`}function F(t,r,n){return`
  <div style="margin-bottom:8px">
    <div style="font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:${r};font-family:${c};margin-bottom:5px">${t}</div>
    <div style="display:flex;flex-direction:column;gap:4px">${n}</div>
  </div>`}function J(t,r,n){const s="flex:1;",a="";if(t.isRestDay)return`
    <div style="${s}${a}background:#12101e;border:1px solid #2a1f4a;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px">
      <div style="font-size:28px">🌙</div>
      <div style="font-size:9px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:#7c3aed;font-family:${c}">Rest Day</div>
      <div style="font-size:20px;font-weight:800;color:#a78bfa;font-family:${c}">${t.date}</div>
    </div>`;const o=[t.highTask,...t.mediumTasks,...t.smallTasks].filter(Boolean),l=o.length,p=o.filter(h=>(h==null?void 0:h.status)==="done").length,g=l>0?Math.round(p/l*100):0,x=g===100&&l>0,m=x?`<span style="background:#052e16;color:${W};font-size:8px;font-weight:800;padding:2px 7px;border-radius:20px;font-family:${c}">✓ DONE</span>`:l===0?`<span style="background:#1a1f35;color:#334155;font-size:8px;font-weight:800;padding:2px 7px;border-radius:20px;font-family:${c}">EMPTY</span>`:`<span style="background:#1a1f40;color:${k};font-size:8px;font-weight:800;padding:2px 7px;border-radius:20px;font-family:${c}">${g}%</span>`,j=x?W:k,w=l>0?`
    <div style="margin-top:5px;height:2px;background:#1e2035;border-radius:99px">
      <div style="height:100%;width:${g}%;background:${j};border-radius:99px"></div>
    </div>
    <div style="margin-top:2px;font-size:9px;color:${y};font-family:${c}">${p}/${l} tasks</div>
  `:"",P=t.highTask?U(t.highTask,k):`<div style="font-size:11px;color:#2a3040;font-style:italic;padding:5px 10px;font-family:${c}">— No high impact task</div>`,T=t.mediumTasks.map(h=>U(h,M)).join(""),f=t.smallTasks.map(h=>U(h,H)).join("");return`
  <div style="${s}${a}background:${R};border:1px solid ${C};border-radius:14px;padding:16px;display:flex;flex-direction:column;overflow:hidden">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px">
      <div>
        <div style="font-size:9px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:${y};font-family:${c};margin-bottom:1px">${X[t.day]??t.day.slice(0,3).toUpperCase()}</div>
        <div style="font-size:21px;font-weight:800;color:${_};font-family:${c};line-height:1">${t.date}</div>
      </div>
      ${m}
    </div>
    ${w}
    <div style="margin-top:10px;flex:1;overflow:hidden;display:flex;flex-direction:column">
      ${F("⚡ High",k,P)}
      ${T?F("◈ Medium",M,T):""}
      ${f?F("· Small",H,f):""}
    </div>
  </div>`}function ce(t,r=100){const n=t.days.filter(a=>!a.isRestDay).map(a=>{const o=(a.highTask?1:0)+a.mediumTasks.length+a.smallTasks.length,l=[a.highTask,...a.mediumTasks,...a.smallTasks].filter(Boolean).filter(p=>(p==null?void 0:p.status)==="done").length;return{label:X[a.day]??a.day.slice(0,3).toUpperCase(),done:l,total:o}}),s=Math.max(...n.map(a=>a.total),1);return n.map(a=>{const o=Math.round(a.done/s*r),l=Math.round(a.total/s*r),p=Math.max(l-o,0);return`
    <div style="display:flex;flex-direction:column;align-items:center;gap:5px;flex:1">
      <span style="font-size:11px;color:${y};font-weight:700;font-family:${c}">${a.done}/${a.total}</span>
      <div style="display:flex;flex-direction:column-reverse;height:${r}px;width:100%;gap:2px">
        <div style="background:${k};border-radius:3px 3px 0 0;height:${o}px;min-height:${a.done>0?3:0}px"></div>
        <div style="background:#1e2035;border-radius:3px 3px 0 0;height:${p}px;min-height:${a.total>0?3:0}px"></div>
      </div>
      <span style="font-size:11px;color:${y};font-weight:700;font-family:${c}">${a.label}</span>
    </div>`}).join("")}function O(t,r=""){return`
  <div class="report-page" style="
    width:297mm;height:210mm;
    background:${B};
    font-family:${c};
    overflow:hidden;
    display:flex;flex-direction:column;
    page-break-after:always;break-after:page;
    -webkit-print-color-adjust:exact;print-color-adjust:exact;
    ${r}
  ">${t}</div>`}function pe(t){const r=t.score>=80?W:t.score>=50?M:Z,n=t.days.flatMap(l=>l.highTask?[l.highTask]:[]),s=t.days.flatMap(l=>l.mediumTasks),a=t.days.flatMap(l=>l.smallTasks);function o(l,p,g,x){const m=g>0?Math.round(p/g*100):0;return`
    <div style="background:${R};border:1px solid ${C};border-radius:12px;padding:18px 20px;flex:1">
      <div style="font-size:8px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:${x};font-family:${c};margin-bottom:8px">${l}</div>
      <div style="font-size:28px;font-weight:900;color:${_};font-family:${c};line-height:1">${p}<span style="font-size:16px;color:${y}">/${g}</span></div>
      ${g>0?`<div style="margin-top:8px;height:2px;background:#1e2035;border-radius:99px"><div style="height:100%;width:${m}%;background:${x};border-radius:99px"></div></div>`:""}
    </div>`}return O(`
    <div style="padding:40px 50px;display:flex;flex-direction:column;height:100%;gap:0">
      <!-- Header -->
      <div style="display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:24px;border-bottom:1px solid ${C};margin-bottom:24px">
        <div>
          <div style="font-size:9px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#1e293b;font-family:${c};margin-bottom:6px">WeeklyOS · Weekly Report</div>
          <div style="font-size:40px;font-weight:900;letter-spacing:-.03em;color:#f1f5f9;font-family:${c};line-height:1">Week ${t.weekNumber} — ${t.year}</div>
          <div style="font-size:13px;color:${y};font-family:${c};margin-top:6px">${t.dateRange}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:9px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:${y};font-family:${c};margin-bottom:4px">Weekly Score</div>
          <div style="font-size:56px;font-weight:900;color:${r};font-family:${c};line-height:1;letter-spacing:-.03em">${t.score}<span style="font-size:26px">%</span></div>
          <div style="font-size:11px;color:${y};font-family:${c};margin-top:4px">${t.totalCompleted}/${t.totalPlanned} tasks</div>
        </div>
      </div>

      <!-- Stats -->
      <div style="display:flex;gap:14px;margin-bottom:20px">
        ${o("High Impact",n.filter(l=>l.status==="done").length,n.length,k)}
        ${o("Medium",s.filter(l=>l.status==="done").length,s.length,M)}
        ${o("Small Tasks",a.filter(l=>l.status==="done").length,a.length,H)}
        <div style="background:${R};border:1px solid ${C};border-radius:12px;padding:18px 20px;flex:1">
          <div style="font-size:8px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#a78bfa;font-family:${c};margin-bottom:8px">Rest Days</div>
          <div style="font-size:28px;font-weight:900;color:${_};font-family:${c};line-height:1">${t.days.filter(l=>l.isRestDay).length}</div>
        </div>
      </div>

      <!-- Chart -->
      <div style="background:${R};border:1px solid ${C};border-radius:12px;padding:20px 24px;flex:1">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div style="font-size:9px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:${y};font-family:${c}">Daily Progress</div>
          <div style="display:flex;gap:14px">
            <div style="display:flex;align-items:center;gap:5px"><div style="width:10px;height:10px;border-radius:2px;background:${k}"></div><span style="font-size:10px;color:${y};font-weight:700;font-family:${c}">DONE</span></div>
            <div style="display:flex;align-items:center;gap:5px"><div style="width:10px;height:10px;border-radius:2px;background:#1e2035"></div><span style="font-size:10px;color:${y};font-weight:700;font-family:${c}">PLANNED</span></div>
          </div>
        </div>
        <div style="display:flex;align-items:flex-end;gap:12px;height:100px">
          ${ce(t,90)}
        </div>
      </div>
    </div>`)}function me(t,r){return O(`
    <div style="padding:28px 30px;display:flex;flex-direction:column;gap:12px;height:100%">
      <div style="font-size:9px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#1e2a40;font-family:${c}">${r}</div>
      <div style="display:flex;gap:14px;align-items:flex-start">
        ${t.map(n=>J(n)).join("")}
        ${t.length<3?Array(3-t.length).fill('<div style="flex:1"></div>').join(""):""}
      </div>
    </div>`)}function xe(t){function r(n,s,a,o){return`
    <div style="background:${R};border:1px solid ${C};border-left:3px solid ${o};border-radius:12px;padding:20px 24px;flex:1">
      <div style="font-size:9px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:${o};font-family:${c};margin-bottom:10px">${n}  ${s}</div>
      <p style="font-size:13px;color:#cbd5e1;font-family:${c};line-height:1.7;margin:0">${a.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>
    </div>`}return O(`
    <div style="padding:40px 50px;display:flex;flex-direction:column;height:100%;gap:0">
      <div style="margin-bottom:32px">
        <div style="font-size:9px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#1e293b;font-family:${c};margin-bottom:6px">WeeklyOS · Evaluation</div>
        <div style="font-size:38px;font-weight:900;letter-spacing:-.02em;color:#f1f5f9;font-family:${c};line-height:1">Weekly Reflection</div>
        <div style="font-size:12px;color:${y};font-family:${c};margin-top:6px">${t.dateRange}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px;flex:1">
        ${t.evalWentWell?r("✓","What Went Well",t.evalWentWell,W):""}
        ${t.evalStruggle?r("⚡","Where I Struggled",t.evalStruggle,Z):""}
        ${t.evalLessons?r("💡","Lessons Learned",t.evalLessons,k):""}
      </div>
    </div>`)}function fe(t,r){const n=r.trim(),s=n.lastIndexOf(" — "),a=s>-1?n.slice(0,s).trim():n,o=s>-1?n.slice(s+3).trim():"",l=t.map(p=>J(p)).join("");return O(`
    <div style="padding:36px 40px;display:flex;flex-direction:column;height:100%;gap:28px">
      <!-- Days centered at top -->
      <div style="display:flex;gap:16px;align-items:flex-start;justify-content:center">
        ${l}
      </div>

      <!-- Closing quote -->
      <div style="
        flex:1;display:flex;align-items:center;justify-content:center;
        background:${R};border:1px solid ${C};
        border-left:4px solid ${k};
        border-radius:16px;padding:32px 48px;
      ">
        <div style="text-align:center;max-width:700px">
          <div style="font-size:32px;margin-bottom:20px;opacity:.4">&ldquo;</div>
          <p style="
            font-size:22px;font-weight:600;font-style:italic;
            color:${_};font-family:${c};line-height:1.6;
            margin:0 0 16px;
          ">${a.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>
          ${o?`<p style="font-size:13px;font-weight:700;color:${k};font-family:${c};letter-spacing:.08em;text-transform:uppercase;margin:0">— ${o.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>`:""}
        </div>
      </div>
    </div>`)}function ge(t,r={}){const n=r.includedDays??null,s=r.closingQuote??"The secret of getting ahead is getting started.",a=[];a.push(pe(t)),(t.evalWentWell||t.evalStruggle||t.evalLessons)&&a.push(xe(t));const o=t.days.filter(m=>!n||n.includes(m.day)),l=o.filter(m=>!m.isRestDay),p=o.filter(m=>m.isRestDay),g=[...l,...p],x=[];for(let m=0;m<g.length;m+=3)x.push(g.slice(m,m+3));return x.forEach((m,j)=>{const w=j===x.length-1,P=m.length<3,T=`Weekly Distribution · Part ${j+1}`;w&&P?a.push(fe(m,s)):a.push(me(m,T))}),`<!DOCTYPE html>
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
      background: ${B};
      font-family: ${c};
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
        font-family: ${c}; box-shadow: 0 8px 32px rgba(129,140,248,.4);
      }
    }
    /* Print: pages break correctly */
    @media print {
      body { background: ${B} !important; }
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
</html>`}let b=null;function I(t){const r=t==null?void 0:t.code;return r==="PGRST205"||r==="42P01"}function K(t){return{id:String(t.id),title:String(t.title),description:t.description?String(t.description):void 0,priority:t.priority||"medium",dayOfWeek:t.day_of_week,startTime:t.start_time?String(t.start_time):void 0,endTime:t.end_time?String(t.end_time):void 0,tags:t.tags||void 0,isActive:!!t.is_active,untilDate:t.until_date?String(t.until_date):void 0}}const ue=ne((t,r)=>({items:[],isLoading:!1,error:null,loadPinnedTasks:async()=>{if(b===!1){t({items:[],isLoading:!1,error:null});return}const{data:{session:n}}=await z.auth.getSession(),s=n==null?void 0:n.user;if(!s)return;t({isLoading:!0,error:null});const{data:a,error:o}=await z.from("pinned_tasks").select("*").eq("user_id",s.id).order("created_at",{ascending:!1});if(o){if(I(o)){b=!1,t({items:[],isLoading:!1,error:null});return}t({isLoading:!1,error:o.message});return}b=!0,t({items:(a||[]).map(l=>K(l)),isLoading:!1,error:null})},createPinnedTask:async n=>{if(b===!1)throw new Error("Pinned tasks تحتاج تطبيق Migration قاعدة البيانات أولاً.");const{data:{session:s}}=await z.auth.getSession(),a=s==null?void 0:s.user;if(!a)return;const{data:o,error:l}=await z.from("pinned_tasks").insert({user_id:a.id,title:n.title,description:n.description||null,priority:n.priority,day_of_week:n.dayOfWeek,start_time:n.startTime||null,end_time:n.endTime||null,tags:n.tags||null,is_active:n.isActive,until_date:n.untilDate||null}).select("*").single();if(l)throw I(l)?(b=!1,new Error("Pinned tasks غير مفعلة بعد. طبّق migration ثم أعد المحاولة.")):(t({error:l.message}),new Error(l.message));b=!0;const p=K(o);t(g=>({items:[p,...g.items]}))},updatePinnedTask:async(n,s)=>{if(b===!1)throw new Error("Pinned tasks غير مفعلة بعد. طبّق migration أولاً.");const{error:a}=await z.from("pinned_tasks").update({...s.title!==void 0&&{title:s.title},...s.description!==void 0&&{description:s.description||null},...s.priority!==void 0&&{priority:s.priority},...s.dayOfWeek!==void 0&&{day_of_week:s.dayOfWeek},...s.startTime!==void 0&&{start_time:s.startTime||null},...s.endTime!==void 0&&{end_time:s.endTime||null},...s.tags!==void 0&&{tags:s.tags||null},...s.isActive!==void 0&&{is_active:s.isActive},...s.untilDate!==void 0&&{until_date:s.untilDate||null},updated_at:new Date().toISOString()}).eq("id",n);if(a)throw I(a)?(b=!1,new Error("Pinned tasks غير مفعلة بعد. طبّق migration ثم أعد المحاولة.")):(t({error:a.message}),new Error(a.message));t(o=>({items:o.items.map(l=>l.id===n?{...l,...s}:l)}))},deletePinnedTask:async n=>{if(b===!1)return;const{error:s}=await z.from("pinned_tasks").delete().eq("id",n);if(s){if(I(s)){b=!1;return}throw t({error:s.message}),new Error(s.message)}t(a=>({items:a.items.filter(o=>o.id!==n)}))},togglePinnedTask:async(n,s)=>{await r().updatePinnedTask(n,{isActive:s})}})),he=["Africa/Cairo","UTC","Europe/London","Europe/Berlin","Asia/Riyadh","Asia/Dubai","Asia/Kolkata","America/New_York","America/Chicago","America/Los_Angeles"],ve=[{value:"saturday",label:"Saturday"},{value:"sunday",label:"Sunday"},{value:"monday",label:"Monday"}];function Te(){const t=re(),{currentWeek:r,getPreviousWeekForReport:n,goToWeek:s}=le(),a=ue(),[o,l]=v.useState(!1),[p,g]=v.useState(t.activeProvider),[x,m]=v.useState(t.activeModel),[j,w]=v.useState(!1),[P,T]=v.useState(!1),[f,h]=v.useState({title:"",description:"",priority:"medium",dayOfWeek:"monday",startTime:"07:00",endTime:"10:00",tags:"",untilDate:"",isActive:!0});v.useEffect(()=>{g(t.activeProvider),m(t.activeModel)},[t.activeProvider,t.activeModel]),v.useEffect(()=>{a.loadPinnedTasks()},[]),v.useEffect(()=>{if(!t.autoDownloadCompletedWeekReport||!r)return;const i=`weeklyos:auto-report:${r.year}:w${r.weekNumber}`;if(localStorage.getItem(i))return;(async()=>{const u=await n();u&&(L(u),localStorage.setItem(i,"1"))})()},[t.autoDownloadCompletedWeekReport,r==null?void 0:r.id]);const Q=p==="gemini"?!["gemini-flash-latest","gemini-3.1-pro-preview","gemini-3-flash-preview","gemini-2.5-pro","gemini-2.5-flash","gemini-2.5-flash-lite","gemini-live-2.5-flash-native-audio"].includes(x):!["grok-4","grok-4.1-fast","grok-4-vision","grok-code-fast-1"].includes(x),ee=async()=>{w(!0),await t.setActiveProvider(p),await t.setActiveModel(x),w(!1),T(!0),setTimeout(()=>T(!1),2e3)},L=i=>{const d=i||r;if(!(!d||o)){l(!0);try{const u=ge(d,{includedDays:t.reportIncludedDays,closingQuote:t.reportClosingQuote}),S=new Blob([u],{type:"text/html;charset=utf-8"}),G=URL.createObjectURL(S),V=window.open(G,"_blank");V?V.addEventListener("load",()=>URL.revokeObjectURL(G),{once:!0}):(setTimeout(()=>URL.revokeObjectURL(G),6e4),alert("Pop-up blocked — please allow pop-ups for this site."))}catch(u){console.error("Report failed:",u)}finally{l(!1)}}},te=async()=>{const i=await n();if(!i){alert("No completed week available yet.");return}L(i)},ie=async()=>{if(!f.title.trim()){alert("Please enter a title for the pinned task.");return}try{await a.createPinnedTask({title:f.title.trim(),description:f.description.trim()||void 0,priority:f.priority,dayOfWeek:f.dayOfWeek,startTime:f.startTime||void 0,endTime:f.endTime||void 0,tags:f.tags?f.tags.split(",").map(i=>i.trim()).filter(Boolean):void 0,untilDate:f.untilDate||void 0,isActive:f.isActive}),r&&await s(r.weekNumber,r.year),h({title:"",description:"",priority:"medium",dayOfWeek:"monday",startTime:"07:00",endTime:"10:00",tags:"",untilDate:"",isActive:!0})}catch(i){alert(i instanceof Error?i.message:"Failed to create pinned task")}},se=async(i,d)=>{try{await a.togglePinnedTask(i,d),r&&await s(r.weekNumber,r.year)}catch(u){alert(u instanceof Error?u.message:"Failed to update pinned task")}},ae=async i=>{try{await a.deletePinnedTask(i),r&&await s(r.weekNumber,r.year)}catch(d){alert(d instanceof Error?d.message:"Failed to delete pinned task")}},E=({label:i,desc:d,checked:u,onChange:S})=>e.jsxs($,{variant:"glass",className:"flex items-center justify-between gap-4 p-4",children:[e.jsxs("div",{children:[e.jsx("p",{className:"font-bold text-on-surface text-sm",children:i}),e.jsx("p",{className:"text-xs text-neutral-500 mt-0.5",children:d})]}),e.jsx("button",{onClick:()=>S(!u),className:`w-12 h-6 rounded-full p-1 transition-colors ${u?"bg-primary":"bg-surface-variant"}`,children:e.jsx("div",{className:`w-4 h-4 rounded-full bg-white transition-transform ${u?"translate-x-6":"translate-x-0"}`})})]});return e.jsx(oe,{children:e.jsxs("div",{className:"max-w-[1280px] mx-auto px-4 md:px-8 lg:px-10 py-8 md:py-10",children:[e.jsx(de,{variant:"glass",className:"mb-8 rounded-2xl border border-white/10 bg-gradient-to-br from-surface-container-low/70 to-surface-container-lowest/80 p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.3)]",children:e.jsxs("div",{className:"flex flex-col md:flex-row md:items-center md:justify-between gap-4",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-on-surface mb-2",children:"Settings"}),e.jsx("p",{className:"text-sm md:text-base text-neutral-300",children:"Configure your WeeklyOS experience, AI integrations, and privacy in one place."})]}),e.jsxs("div",{className:"flex items-center gap-2 text-xs uppercase tracking-widest font-bold",children:[e.jsx("span",{className:"px-2.5 py-1 rounded-full bg-primary/15 text-primary",children:"Workspace"}),e.jsx("span",{className:"px-2.5 py-1 rounded-full bg-tertiary/15 text-tertiary",children:"AI"}),e.jsx("span",{className:"px-2.5 py-1 rounded-full bg-error/15 text-error",children:"Privacy"})]})]})}),e.jsxs("div",{className:"grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8 items-start",children:[e.jsxs("div",{className:"space-y-6",children:[e.jsxs($,{variant:"glass",className:"rounded-2xl p-5 md:p-6",children:[e.jsxs("div",{className:"flex items-center gap-3 text-primary mb-5",children:[e.jsx("span",{className:"material-symbols-outlined",children:"smart_toy"}),e.jsx("h2",{className:"text-[13px] font-bold uppercase tracking-widest",children:"AI Integration"})]}),e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2",children:"Primary Model"}),e.jsxs("div",{className:"flex flex-col gap-3",children:[e.jsxs("div",{className:"grid grid-cols-2 gap-2",children:[e.jsxs(A,{value:p,onChange:i=>{const d=i.target.value;g(d),d==="grok"&&m("grok-2-mini"),d==="gemini"&&m("gemini-1.5-flash")},className:"text-sm text-on-surface",children:[e.jsx("option",{value:"gemini",children:"Google Gemini"}),e.jsx("option",{value:"grok",children:"Grok (xAI)"})]}),e.jsxs(A,{value:Q?"custom":x,onChange:i=>{i.target.value!=="custom"?m(i.target.value):m("")},className:"text-sm text-on-surface text-tertiary font-medium",children:[p==="grok"&&e.jsxs(e.Fragment,{children:[e.jsx("option",{value:"grok-4",children:"grok-4"}),e.jsx("option",{value:"grok-4.1-fast",children:"grok-4.1-fast"}),e.jsx("option",{value:"grok-4-vision",children:"grok-4-vision"}),e.jsx("option",{value:"grok-code-fast-1",children:"grok-code-fast-1"})]}),p==="gemini"&&e.jsxs(e.Fragment,{children:[e.jsx("option",{value:"gemini-flash-latest",children:"gemini-flash-latest"}),e.jsx("option",{value:"gemini-3.1-pro-preview",children:"gemini-3.1-pro-preview"}),e.jsx("option",{value:"gemini-3-flash-preview",children:"gemini-3-flash-preview"}),e.jsx("option",{value:"gemini-2.5-pro",children:"gemini-2.5-pro"}),e.jsx("option",{value:"gemini-2.5-flash",children:"gemini-2.5-flash"}),e.jsx("option",{value:"gemini-2.5-flash-lite",children:"gemini-2.5-flash-lite"}),e.jsx("option",{value:"gemini-live-2.5-flash-native-audio",children:"gemini-live-audio"})]}),e.jsx("option",{value:"custom",children:"Other (Custom...)"})]})]}),Q&&e.jsx(D,{type:"text",value:x,onChange:i=>m(i.target.value),placeholder:`Custom ${p} model...`,className:"w-full text-sm font-mono focus:border-tertiary/50 transition-colors"}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(N,{type:"button",onClick:ee,size:"sm",variant:"secondary",disabled:j||!x.trim()||p===t.activeProvider&&x===t.activeModel,className:"text-[11px] font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed",children:j?"Saving...":P?"Saved!":"Save Selection"}),P&&e.jsx("span",{className:"text-tertiary text-[11px] font-medium uppercase tracking-widest",children:"Updated"})]})]})]}),e.jsxs("div",{className:"space-y-4 py-4 border-y border-white/10",children:[e.jsx(Y,{provider:"gemini",label:"Google Gemini",settings:t}),e.jsx(Y,{provider:"grok",label:"xAI Grok",settings:t})]}),e.jsx(E,{label:"Fallback Provider",desc:"Switch to another provider if the primary fails.",checked:t.fallbackEnabled,onChange:t.setFallbackEnabled})]})]}),e.jsxs($,{variant:"glass",className:"rounded-2xl p-5 md:p-6",children:[e.jsxs("div",{className:"flex items-center gap-3 text-primary mb-5",children:[e.jsx("span",{className:"material-symbols-outlined",children:"push_pin"}),e.jsx("h2",{className:"text-[13px] font-bold uppercase tracking-widest",children:"Pinned Tasks"})]}),e.jsxs("div",{className:"space-y-3",children:[e.jsx("p",{className:"text-xs text-neutral-500",children:"Pinned tasks repeat every week on your selected day/time until disabled or deleted."}),e.jsx(D,{type:"text",placeholder:"Task title",value:f.title,onChange:i=>h(d=>({...d,title:i.target.value})),className:"text-sm"}),e.jsx(q,{rows:2,placeholder:"Description (optional)",value:f.description,onChange:i=>h(d=>({...d,description:i.target.value})),className:"text-sm resize-none"}),e.jsxs("div",{className:"grid grid-cols-2 gap-2",children:[e.jsxs(A,{value:f.priority,onChange:i=>h(d=>({...d,priority:i.target.value})),className:"text-sm",children:[e.jsx("option",{value:"high",children:"High"}),e.jsx("option",{value:"medium",children:"Medium"}),e.jsx("option",{value:"low",children:"Low"})]}),e.jsx(A,{value:f.dayOfWeek,onChange:i=>h(d=>({...d,dayOfWeek:i.target.value})),className:"text-sm",children:["saturday","sunday","monday","tuesday","wednesday","thursday","friday"].map(i=>e.jsx("option",{value:i,children:i},i))})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-2",children:[e.jsx(D,{type:"time",value:f.startTime,onChange:i=>h(d=>({...d,startTime:i.target.value})),className:"text-sm"}),e.jsx(D,{type:"time",value:f.endTime,onChange:i=>h(d=>({...d,endTime:i.target.value})),className:"text-sm"})]}),e.jsx(D,{type:"text",placeholder:"Tags (comma separated)",value:f.tags,onChange:i=>h(d=>({...d,tags:i.target.value})),className:"text-sm"}),e.jsx(D,{type:"date",value:f.untilDate,onChange:i=>h(d=>({...d,untilDate:i.target.value})),className:"text-sm"}),e.jsx("p",{className:"text-[11px] text-neutral-500",children:"Leave date empty to repeat indefinitely."}),e.jsx(N,{type:"button",onClick:ie,size:"sm",variant:"secondary",className:"text-[11px] font-bold uppercase tracking-widest",children:"Create Pinned Task"}),e.jsxs("div",{className:"space-y-2 pt-2 border-t border-white/10 max-h-64 overflow-y-auto pr-1",children:[a.items.length===0&&e.jsx("p",{className:"text-xs text-neutral-500",children:"No pinned tasks yet."}),a.items.map(i=>e.jsx("div",{className:"bg-surface-container-lowest border border-white/5 rounded-lg px-3 py-2.5",children:e.jsxs("div",{className:"flex items-center justify-between gap-3",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-semibold leading-tight",children:i.title}),e.jsxs("p",{className:"text-[12px] text-neutral-500 mt-0.5",children:[i.dayOfWeek," • ",i.startTime||"--:--"," – ",i.endTime||"--:--"]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("button",{onClick:()=>void se(i.id,!i.isActive),className:`px-2.5 py-1 rounded text-[11px] uppercase tracking-wider font-bold ${i.isActive?"bg-tertiary/15 text-tertiary":"bg-neutral-700/30 text-neutral-400"}`,children:i.isActive?"Active":"Paused"}),e.jsx("button",{onClick:()=>void ae(i.id),className:"px-2.5 py-1 rounded text-[11px] uppercase tracking-wider font-bold bg-error/15 text-error",children:"Delete"})]})]})},i.id))]})]})]})]}),e.jsxs("div",{className:"space-y-6",children:[e.jsxs($,{variant:"glass",className:"rounded-2xl p-5 md:p-6",children:[e.jsxs("div",{className:"flex items-center gap-3 text-primary mb-5",children:[e.jsx("span",{className:"material-symbols-outlined",children:"calendar_month"}),e.jsx("h2",{className:"text-[13px] font-bold uppercase tracking-widest",children:"Work Schedule"})]}),e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"grid grid-cols-2 gap-3",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2",children:"Timezone"}),e.jsxs(A,{value:t.timezone,onChange:i=>t.setTimezone(i.target.value),className:"text-sm",children:[e.jsx("option",{value:Intl.DateTimeFormat().resolvedOptions().timeZone,children:"System"}),he.map(i=>e.jsx("option",{value:i,children:i},i))]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2",children:"Week Starts"}),e.jsx(A,{value:t.weekStartDay,onChange:i=>t.setWeekStartDay(i.target.value),className:"text-sm",children:ve.map(i=>e.jsx("option",{value:i.value,children:i.label},i.value))})]})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2",children:"Rest Days"}),e.jsx("div",{className:"flex flex-wrap gap-2",children:["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].map(i=>{const d=(t.restDays||[]).includes(i);return e.jsx(N,{type:"button",size:"sm",variant:d?"secondary":"ghost",active:d,onClick:()=>{const u=t.restDays||[];t.setRestDays(d?u.filter(S=>S!==i):[...u,i])},className:`uppercase tracking-wider text-[11px] font-bold ${d?"text-white":"text-neutral-400"}`,children:i.slice(0,3)},i)})})]})]})]}),e.jsxs($,{variant:"glass",className:"rounded-2xl p-5 md:p-6",children:[e.jsxs("div",{className:"flex items-center gap-3 text-tertiary mb-5",children:[e.jsx("span",{className:"material-symbols-outlined",children:"palette"}),e.jsx("h2",{className:"text-[13px] font-bold uppercase tracking-widest",children:"Appearance"})]}),e.jsx("div",{className:"flex gap-3",children:["dark","light","system"].map(i=>e.jsx(N,{type:"button",size:"sm",variant:t.theme===i?"secondary":"ghost",active:t.theme===i,onClick:()=>t.setTheme(i),className:`flex-1 text-[12px] font-bold uppercase tracking-wider ${t.theme===i?"":"opacity-75 hover:opacity-100"}`,children:i},i))})]}),e.jsxs($,{variant:"glass",className:"rounded-2xl p-5 md:p-6",children:[e.jsxs("div",{className:"flex items-center gap-3 text-neutral-400 mb-5",children:[e.jsx("span",{className:"material-symbols-outlined",children:"notifications"}),e.jsx("h2",{className:"text-[13px] font-bold uppercase tracking-widest",children:"Notifications"})]}),e.jsxs("div",{className:"space-y-3",children:[e.jsx(E,{label:"Daily Reminders",desc:"Get notified about your main objective every morning.",checked:t.dailyReminders,onChange:t.setDailyReminders}),e.jsx(E,{label:"Weekly Summary",desc:"Receive a report of your week's performance.",checked:t.weeklySummaries,onChange:t.setWeeklySummaries}),e.jsx(E,{label:"Auto-download Report",desc:"Downloads last completed week's PDF once after rollover.",checked:t.autoDownloadCompletedWeekReport,onChange:t.setAutoDownloadCompletedWeekReport})]})]})]}),e.jsxs("div",{className:"space-y-6",children:[e.jsxs($,{variant:"glass",className:"rounded-2xl p-5 md:p-6",children:[e.jsxs("div",{className:"flex items-center gap-3 text-tertiary mb-5",children:[e.jsx("span",{className:"material-symbols-outlined",children:"picture_as_pdf"}),e.jsx("h2",{className:"text-[13px] font-bold uppercase tracking-widest",children:"Report Settings"})]}),e.jsxs("div",{className:"space-y-5",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2",children:"Days in Report"}),e.jsx("div",{className:"flex flex-wrap gap-2",children:["saturday","sunday","monday","tuesday","wednesday","thursday","friday"].map(i=>{const d=(t.reportIncludedDays??[]).includes(i);return e.jsx(N,{type:"button",size:"sm",variant:d?"secondary":"ghost",active:d,onClick:()=>{const u=t.reportIncludedDays??[];t.setReportIncludedDays(d?u.filter(S=>S!==i):[...u,i])},className:`uppercase tracking-wider text-[11px] font-bold ${d?"text-white":"text-neutral-500"}`,children:i.slice(0,3)},i)})}),e.jsx("p",{className:"text-[11px] text-neutral-500 mt-2",children:"Disabled days won't appear in the exported PDF."})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2",children:"Closing Page Quote"}),e.jsx(q,{rows:3,placeholder:"e.g. The secret of getting ahead is getting started. — Mark Twain",value:t.reportClosingQuote??"",onChange:i=>t.setReportClosingQuote(i.target.value),className:"text-sm text-on-surface resize-none focus:border-tertiary/50 transition-colors"}),e.jsx("p",{className:"text-[11px] text-neutral-500 mt-1",children:'Use " — Author" at the end to add an attribution.'})]}),e.jsxs("div",{className:"space-y-2 pt-2 border-t border-white/10",children:[e.jsxs(N,{type:"button",onClick:()=>void L(),disabled:o,size:"sm",variant:"secondary",className:"w-full text-sm font-bold disabled:opacity-50",children:[e.jsx("span",{className:"material-symbols-outlined text-[18px]",children:o?"sync":"download"}),o?"Generating...":"Export This Week"]}),e.jsxs(N,{type:"button",onClick:()=>void te(),disabled:o,size:"sm",variant:"ghost",className:"w-full text-sm font-bold disabled:opacity-50 border border-white/10 hover:border-white/20",children:[e.jsx("span",{className:"material-symbols-outlined text-[18px]",children:"history"}),"Export Previous Week"]})]})]})]}),e.jsxs($,{variant:"glass",className:"rounded-2xl p-5 md:p-6",children:[e.jsxs("div",{className:"flex items-center gap-3 text-error mb-5",children:[e.jsx("span",{className:"material-symbols-outlined",children:"security"}),e.jsx("h2",{className:"text-[13px] font-bold uppercase tracking-widest",children:"Privacy & Data"})]}),e.jsx(E,{label:"Analytics Tracking",desc:"Share anonymous usage data to help us improve.",checked:t.analyticsEnabled,onChange:t.setAnalyticsEnabled})]})]})]})]})})}function Y({provider:t,label:r,settings:n}){const[s,a]=v.useState(n.aiKeys[t]||""),[o,l]=v.useState(!1),[p,g]=v.useState(!1),[x,m]=v.useState(!1),j=async()=>{g(!0),await n.setAiKey(t,s),g(!1),m(!0),setTimeout(()=>m(!1),2e3)};return e.jsxs("div",{children:[e.jsxs("label",{className:"block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2",children:[r," API Key"]}),e.jsxs("div",{className:"flex bg-surface-container-low rounded-xl border border-white/10 overflow-hidden focus-within:border-primary/50 transition-colors",children:[e.jsx(D,{type:o?"text":"password",value:s,onChange:w=>a(w.target.value),placeholder:"sk-...",className:"flex-1 bg-transparent border-0 px-4 py-3 outline-none text-sm text-on-surface font-mono"}),e.jsx("button",{onClick:()=>l(!o),className:"px-4 text-neutral-500 hover:text-white border-l border-white/5",children:e.jsx("span",{className:"material-symbols-outlined text-[18px]",children:o?"visibility_off":"visibility"})}),e.jsx(N,{type:"button",onClick:j,disabled:p||s===(n.aiKeys[t]||""),size:"sm",variant:"secondary",className:"rounded-none rounded-r-xl font-bold text-[11px] disabled:opacity-50 disabled:cursor-not-allowed",children:p?"SAVING...":x?"SAVED":"SAVE"})]}),x&&e.jsx("p",{className:"text-tertiary text-[11px] mt-1 font-medium",children:"API key saved successfully"})]})}export{Te as Settings};
