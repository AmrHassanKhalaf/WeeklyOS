import fs from 'fs';
import path from 'path';

function fix(filePath, replacements) {
  const fullPath = path.join(process.cwd(), filePath);
  let content = fs.readFileSync(fullPath, 'utf-8');
  for (const [search, replace] of replacements) {
    content = content.replace(search, replace);
  }
  fs.writeFileSync(fullPath, content, 'utf-8');
  console.log(`Updated ${filePath}`);
}

// 1. Settings.tsx
fix('src/pages/Settings.tsx', [
  [/{isExporting\?'sync':'download'}/g, "{isExporting ? 'RefreshCw' : 'Download'}"], // this will just put string, wait, need to replace the whole span
  [
    /<span className="material-symbols-outlined text-\[18px\]">{isExporting\?'sync':'download'}<\/span>/g,
    "{isExporting ? <RefreshCw className=\"w-[18px] h-[18px]\" strokeWidth={1.5} /> : <Download className=\"w-[18px] h-[18px]\" strokeWidth={1.5} />}"
  ],
  [
    /<span className="material-symbols-outlined text-\[18px\]">{isVis \? 'visibility_off' : 'visibility'}<\/span>/g,
    "{isVis ? <EyeOff className=\"w-[18px] h-[18px]\" strokeWidth={1.5} /> : <Eye className=\"w-[18px] h-[18px]\" strokeWidth={1.5} />}"
  ]
]);

// 2. FocusedDay.tsx
fix('src/pages/FocusedDay.tsx', [
  [
    /<span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>\s*{isPomodoroRunning \? 'pause' : 'play_arrow'}\s*<\/span>/g,
    "{isPomodoroRunning ? <Pause className=\"w-9 h-9\" strokeWidth={1.5} /> : <Play className=\"w-9 h-9\" strokeWidth={1.5} />}"
  ],
  [
    /<span className="material-symbols-outlined text-\[18px\]">\s*{isPomodoroRunning \? 'pause' : 'play_arrow'}\s*<\/span>/g,
    "{isPomodoroRunning ? <Pause className=\"w-[18px] h-[18px]\" strokeWidth={1.5} /> : <Play className=\"w-[18px] h-[18px]\" strokeWidth={1.5} />}"
  ],
  [
    /<span className="material-symbols-outlined text-\[18px\]">\s*{isFocusMode \? 'visibility' : 'visibility_off'}\s*<\/span>/g,
    "{isFocusMode ? <Eye className=\"w-[18px] h-[18px]\" strokeWidth={1.5} /> : <EyeOff className=\"w-[18px] h-[18px]\" strokeWidth={1.5} />}"
  ],
  [
    /<span className="material-symbols-outlined text-\[14px\]">\s*{showPresets \? 'expand_less' : 'expand_more'}\s*<\/span>/g,
    "{showPresets ? <ChevronUp className=\"w-[14px] h-[14px]\" strokeWidth={1.5} /> : <ChevronDown className=\"w-[14px] h-[14px]\" strokeWidth={1.5} />}"
  ]
]);

// 3. BrainDump.tsx
fix('src/pages/BrainDump.tsx', [
  [
    /<span className={`material-symbols-outlined text-lg \${isStructuring \? 'animate-spin' : ''}`}>\s*auto_awesome\s*<\/span>/g,
    "<Sparkles className={`w-5 h-5 ${isStructuring ? 'animate-spin' : ''}`} strokeWidth={1.5} />"
  ],
  [
    /<span className="material-symbols-outlined text-sm">send<\/span>/g,
    "<Send className=\"w-4 h-4\" strokeWidth={1.5} />"
  ],
  [
    /<span className="material-symbols-outlined group-hover:scale-110 transition-transform">add_circle<\/span>/g,
    "<PlusCircle className=\"w-6 h-6 group-hover:scale-110 transition-transform\" strokeWidth={1.5} />"
  ],
  [
    /<span className="material-symbols-outlined text-lg">tag<\/span>/g,
    "<Tag className=\"w-5 h-5\" strokeWidth={1.5} />"
  ],
  [
    /<span className="material-symbols-outlined text-lg">delete_sweep<\/span>/g,
    "<Trash2 className=\"w-5 h-5\" strokeWidth={1.5} />"
  ]
]);

// 4. App.tsx
fix('src/App.tsx', [
  [
    /<span className="material-symbols-outlined text-primary text-\[20px\] shrink-0">system_update<\/span>/g,
    "<MonitorDown className=\"w-[20px] h-[20px] text-primary shrink-0\" strokeWidth={1.5} />"
  ]
]);

// 5. WeeklyReportPrintView.tsx
fix('src/components/WeeklyReportPrintView.tsx', [
  [
    /<span className="material-symbols-outlined text-sm">dashboard<\/span>/g,
    "<LayoutDashboard className=\"w-4 h-4\" strokeWidth={1.5} />"
  ]
]);

// 6. TaskCard.tsx
fix('src/components/TaskCard.tsx', [
  [
    /className="material-symbols-outlined text-outline hover:text-white transition-colors text-xl"\s*>\s*edit\s*<\/span>/g,
    "className=\"text-outline hover:text-white transition-colors\">\n            <Edit3 className=\"w-5 h-5\" strokeWidth={1.5} />\n          </span>" // wrapper span
  ],
  [
    /className="material-symbols-outlined text-outline hover:text-error transition-colors text-xl"\s*>\s*delete\s*<\/span>/g,
    "className=\"text-outline hover:text-error transition-colors\">\n            <Trash2 className=\"w-5 h-5\" strokeWidth={1.5} />\n          </span>"
  ]
]);

// 7. AIAssistant.tsx
fix('src/components/layout/AIAssistant.tsx', [
  [
    /<span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>warning<\/span>/g,
    "<AlertTriangle className=\"w-5 h-5\" strokeWidth={1.5} />"
  ],
  [
    /<span className="material-symbols-outlined text-sm">warning<\/span>/g,
    "<AlertTriangle className=\"w-4 h-4\" strokeWidth={1.5} />"
  ],
  [
    /<span className="material-symbols-outlined text-\[18px\]">send<\/span>/g,
    "<Send className=\"w-[18px] h-[18px]\" strokeWidth={1.5} />"
  ],
  [
    /<span className="material-symbols-outlined text-\[14px\]">\s*history\s*<\/span>/g,
    "<History className=\"w-[14px] h-[14px]\" strokeWidth={1.5} />"
  ]
]);

// 8. FeedbackModal.tsx
fix('src/components/FeedbackModal.tsx', [
  [
    /leftIcon={!isSubmitting \? <span className="material-symbols-outlined text-sm">send<\/span> : undefined}/g,
    "leftIcon={!isSubmitting ? <Send className=\"w-4 h-4\" strokeWidth={1.5} /> : undefined}"
  ]
]);

// 9. HabitCard.tsx
fix('src/components/habittracker/HabitCard.tsx', [
  [
    /<span className="material-symbols-outlined text-\[18px\]" style={{ color }}>{cat\.icon}<\/span>/g,
    "<DynamicIcon name={cat.icon} className=\"w-[18px] h-[18px]\" color={color} strokeWidth={1.5} />"
  ],
  [
    /<span className="material-symbols-outlined text-\[12px\]">{showReason \? 'expand_less' : 'psychology'}<\/span>/g,
    "{showReason ? <ChevronUp className=\"w-[12px] h-[12px]\" strokeWidth={1.5} /> : <Brain className=\"w-[12px] h-[12px]\" strokeWidth={1.5} />}"
  ]
]);

// 10. HabitDetailModal.tsx
fix('src/components/habittracker/HabitDetailModal.tsx', [
  [
    /<span className="material-symbols-outlined text-\[22px\]" style={{ color: accentColor }}>\s*{habit\.icon}\s*<\/span>/g,
    "<DynamicIcon name={habit.icon} className=\"w-[22px] h-[22px]\" color={accentColor} strokeWidth={1.5} />"
  ]
]);

// 11. HabitFormModal.tsx
fix('src/components/habittracker/HabitFormModal.tsx', [
  [
    /className="material-symbols-outlined text-xl transition-colors duration-300"\s*style={{ color: categoryData\.color }}\s*>\s*{categoryData\.icon}\s*<\/span>/g,
    "style={{ color: categoryData.color }}>\n                        <DynamicIcon name={categoryData.icon} className=\"w-5 h-5 transition-colors duration-300\" strokeWidth={1.5} />\n                      </span>" // need a wrapper or just dynamic
  ],
  [
    /<span className="material-symbols-outlined text-\[16px\]">{g\.icon}<\/span>/g,
    "<DynamicIcon name={g.icon} className=\"w-4 h-4\" strokeWidth={1.5} />"
  ]
]);

// 12. HabitGroupSection.tsx
fix('src/components/habittracker/HabitGroupSection.tsx', [
  [
    /<span className="material-symbols-outlined text-\[18px\]" style={{ color: meta\.color }}>\s*{meta\.icon}\s*<\/span>/g,
    "<DynamicIcon name={meta.icon} className=\"w-[18px] h-[18px]\" color={meta.color} strokeWidth={1.5} />"
  ]
]);

// 13. HabitSummaryBar.tsx
fix('src/components/habittracker/HabitSummaryBar.tsx', [
  [
    /<span className="material-symbols-outlined text-\[15px\]" style={{ color }}>{icon}<\/span>/g,
    "<DynamicIcon name={icon} className=\"w-[15px] h-[15px]\" color={color} strokeWidth={1.5} />"
  ]
]);

// Also need a DynamicIcon component. We will create it in src/components/ui/DynamicIcon.tsx
const dynamicIconCode = `import * as LucideIcons from 'lucide-react';

export function DynamicIcon({ name, ...props }: { name: string; [key: string]: any }) {
  // Map some old material names to lucide names
  const iconMap: Record<string, string> = {
    'self_improvement': 'UserCircle',
    'fitness_center': 'Dumbbell',
    'book': 'Book',
    'water_drop': 'Droplet',
    'restaurant': 'Utensils',
    'bedtime': 'Moon',
    'spa': 'Flower2',
    'directions_run': 'PersonStanding', // rough mapping
    'medication': 'Pill',
    'psychology': 'Brain',
    'sunny': 'Sun',
    'favorite': 'Heart',
    'local_cafe': 'Coffee',
    'edit': 'Edit3',
    'delete': 'Trash2',
    'close': 'X',
    'check': 'Check',
  };
  
  const mappedName = iconMap[name] || name;
  const IconComponent = (LucideIcons as any)[mappedName];
  
  if (!IconComponent) {
    return <LucideIcons.HelpCircle {...props} />;
  }
  
  return <IconComponent {...props} />;
}
`;
fs.writeFileSync(path.join(process.cwd(), 'src/components/ui/DynamicIcon.tsx'), dynamicIconCode, 'utf-8');
