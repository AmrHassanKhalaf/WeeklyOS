import fs from 'fs';
import path from 'path';

function fix(filePath, replacements) {
  const fullPath = path.join(process.cwd(), filePath);
  let content = fs.readFileSync(fullPath, 'utf-8');
  for (const [search, replace] of replacements) {
    if (typeof search === 'string') {
      content = content.replace(search, replace);
    } else {
      content = content.replace(search, replace);
    }
  }
  fs.writeFileSync(fullPath, content, 'utf-8');
  console.log(`Updated ${filePath}`);
}

// 1. Settings.tsx
fix('src/pages/Settings.tsx', [
  [
    /<span className="material-symbols-outlined text-\[18px\]">{isExporting \? 'RefreshCw' : 'Download'}<\/span>/g,
    "{isExporting ? <RefreshCw className=\"w-[18px] h-[18px] animate-spin\" strokeWidth={1.5} /> : <Download className=\"w-[18px] h-[18px]\" strokeWidth={1.5} />}"
  ],
  [
    /import \{ Bot, Pin, Calendar, Palette, Bell, FileText, History, Shield, MonitorDown, Download \} from 'lucide-react'/g,
    "import { Bot, Pin, Calendar, Palette, Bell, FileText, History, Shield, MonitorDown, Download, RefreshCw, Eye, EyeOff } from 'lucide-react'"
  ]
]);

// 2. BrainDump.tsx
fix('src/pages/BrainDump.tsx', [
  [
    /<span className={`material-symbols-outlined text-lg \${isStructuring \? 'animate-spin' : ''}`}>\s*{isStructuring \? 'progress_activity' : 'auto_awesome'}\s*<\/span>/g,
    "<Sparkles className={`w-5 h-5 ${isStructuring ? 'animate-spin' : ''}`} strokeWidth={1.5} />"
  ],
  [
    /import \{ Inbox \} from 'lucide-react'/g,
    "import { Inbox, Sparkles, Send, PlusCircle, Tag, Trash2 } from 'lucide-react'"
  ]
]);

// 3. TaskCard.tsx
fix('src/components/TaskCard.tsx', [
  [
    `className="material-symbols-outlined text-outline hover:text-white transition-colors text-xl"
          title="Edit"
        >
          edit`,
    `className="text-outline hover:text-white transition-colors p-1 rounded hover:bg-white/10"
          title="Edit"
        >
          <Edit3 className="w-4 h-4" strokeWidth={1.5} />`
  ],
  [
    `className="material-symbols-outlined text-outline hover:text-error transition-colors text-xl"
          title="Delete"
        >
          delete`,
    `className="text-outline hover:text-error transition-colors p-1 rounded hover:bg-error/10"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" strokeWidth={1.5} />`
  ],
  [
    /import \{ Check, X, Plus \} from 'lucide-react'/g,
    "import { Check, X, Plus, Edit3, Trash2 } from 'lucide-react'"
  ]
]);

// 4. AIAssistant.tsx
fix('src/components/layout/AIAssistant.tsx', [
  [
    /<span className="material-symbols-outlined text-\[14px\]">\s*{isRightSidebarOpen \? 'chevron_right' : 'chevron_left'}\s*<\/span>/g,
    "{isRightSidebarOpen ? <ChevronRight className=\"w-[14px] h-[14px]\" strokeWidth={1.5} /> : <ChevronLeft className=\"w-[14px] h-[14px]\" strokeWidth={1.5} />}"
  ],
  [
    /import \{ Bot, Zap, CheckCircle2, Sparkles \} from 'lucide-react'/g,
    "import { Bot, Zap, CheckCircle2, Sparkles, AlertTriangle, Send, ChevronLeft, ChevronRight } from 'lucide-react'"
  ]
]);

// 5. App.tsx (fix missing MonitorDown from earlier)
fix('src/App.tsx', [
  [
    /import \{ ChevronLeft, ChevronRight, Menu, X \} from 'lucide-react'/g,
    "import { ChevronLeft, ChevronRight, Menu, X, MonitorDown } from 'lucide-react'"
  ]
]);

// 6. WeeklyReportPrintView.tsx
fix('src/components/WeeklyReportPrintView.tsx', [
  [
    /import \{ Calendar, Target, Plus \} from 'lucide-react'/g,
    "import { Calendar, Target, Plus, LayoutDashboard } from 'lucide-react'"
  ]
]);

// 7. FeedbackModal.tsx
fix('src/components/FeedbackModal.tsx', [
  [
    /import \{ X, MessageSquare, Bug, Lightbulb \} from 'lucide-react'/g,
    "import { X, MessageSquare, Bug, Lightbulb, Send } from 'lucide-react'"
  ]
]);

// 8. index.css (remove material-symbols-outlined class)
const indexCssPath = path.join(process.cwd(), 'src/index.css');
let indexCss = fs.readFileSync(indexCssPath, 'utf-8');
indexCss = indexCss.replace(/\.material-symbols-outlined \{[\s\S]*?\}\n/g, '');
fs.writeFileSync(indexCssPath, indexCss, 'utf-8');
console.log('Updated src/index.css');
