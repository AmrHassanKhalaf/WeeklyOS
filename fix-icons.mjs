import fs from 'fs';
import path from 'path';

const iconMap = {
  'add_task': 'CheckSquare',
  'do_not_disturb_on': 'MinusCircle',
  'add': 'Plus',
  'check_circle': 'CheckCircle2',
  'block': 'Ban',
  'local_fire_department': 'Flame',
  'chevron_left': 'ChevronLeft',
  'chevron_right': 'ChevronRight',
  'error': 'AlertCircle',
  'schedule': 'Clock',
  'hourglass_bottom': 'Hourglass',
  'eco': 'Leaf',
  'bedtime': 'Moon',
  'drag_indicator': 'GripVertical',
  'auto_awesome': 'Sparkles',
  'format_list_bulleted': 'ListTodo',
  'delete': 'Trash2',
  'check': 'Check',
  'push_pin': 'Pin',
  'bolt': 'Zap',
  'rainy': 'CloudRain',
  'close': 'X',
  'play_arrow': 'Play',
  'pause': 'Pause',
  'restart_alt': 'RotateCcw',
  'visibility': 'Eye',
  'visibility_off': 'EyeOff',
  'tune': 'SlidersHorizontal',
  'expand_more': 'ChevronDown',
  'expand_less': 'ChevronUp',
  'star': 'Star',
  'target': 'Target',
  'inbox': 'Inbox',
  'verified': 'BadgeCheck',
  'trending_up': 'TrendingUp',
  'history': 'History',
  'smart_toy': 'Bot',
  'calendar_month': 'Calendar',
  'palette': 'Palette',
  'notifications': 'Bell',
  'picture_as_pdf': 'FileText',
  'sync': 'RefreshCw',
  'download': 'Download',
  'security': 'Shield',
  'install_desktop': 'MonitorDown',
  'thumb_up': 'ThumbsUp',
  'thumb_down': 'ThumbsDown',
  'lightbulb': 'Lightbulb',
  'progress_activity': 'Loader2',
  'insights': 'LineChart',
  'edit': 'Edit3',
  'psychology': 'Brain',
  'bar_chart': 'BarChart2',
  'grid_view': 'LayoutGrid',
  'timer': 'Timer',
  'info': 'Info',
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;
  let addedIcons = new Set();
  let modified = false;

  // Pattern: <span className="material-symbols-outlined.*?">(.*?)</span>
  // We need to keep style and className but strip material-symbols-outlined
  content = content.replace(/<span([^>]*)className="([^"]*)material-symbols-outlined([^"]*)"([^>]*)>([^<]+)<\/span>/g, (match, before1, cls1, cls2, after, iconName) => {
    let cleanIconName = iconName.trim();
    if (iconName.includes('{') && iconName.includes('}')) {
       // It's an expression like {isVis ? 'visibility_off' : 'visibility'}
       // This is trickier, we should skip or handle manually.
       return match;
    }
    
    let mapped = iconMap[cleanIconName];
    if (!mapped) return match;

    addedIcons.add(mapped);
    let newCls = (cls1 + cls2).replace(/ {2,}/g, ' ').trim();
    
    // Convert to Lucide component
    // Assuming standard lucide-react usage
    modified = true;
    let props = `${before1} ${after}`.trim();
    if (newCls) {
      props = `className="${newCls}" ${props}`;
    }
    return `<${mapped} ${props.trim()} strokeWidth={1.5} />`;
  });

  // Handle dynamic ones e.g. <span className="material-symbols-outlined">{cat.icon}</span>
  // Skip these for now, or manually fix them.

  if (modified) {
    // Add imports
    const importRegex = /import\s+{[^}]+}\s+from\s+['"]lucide-react['"]/g;
    let importMatch = originalContent.match(importRegex);
    if (importMatch) {
      // Append to existing
      const existingImport = importMatch[0];
      const existingIconsMatch = existingImport.match(/{([^}]+)}/);
      let existingIcons = [];
      if (existingIconsMatch) {
        existingIcons = existingIconsMatch[1].split(',').map(i => i.trim());
      }
      for (const icon of addedIcons) {
        if (!existingIcons.includes(icon)) {
          existingIcons.push(icon);
        }
      }
      content = content.replace(existingImport, `import { ${existingIcons.join(', ')} } from 'lucide-react'`);
    } else {
      // Add new import
      const iconsArray = Array.from(addedIcons);
      const newImport = `import { ${iconsArray.join(', ')} } from 'lucide-react'\n`;
      // Insert after first import
      const firstImportIndex = content.indexOf('import ');
      if (firstImportIndex !== -1) {
        const nextLineIndex = content.indexOf('\n', firstImportIndex) + 1;
        content = content.slice(0, nextLineIndex) + newImport + content.slice(nextLineIndex);
      } else {
        content = newImport + content;
      }
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walk(path.join(process.cwd(), 'src'));
