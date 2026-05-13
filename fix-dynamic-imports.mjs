import fs from 'fs';
import path from 'path';

function addImport(filePath, importStr) {
  const fullPath = path.join(process.cwd(), filePath);
  let content = fs.readFileSync(fullPath, 'utf-8');
  
  if (!content.includes(importStr) && content.includes('<DynamicIcon')) {
    const importMatch = content.match(/import /);
    if (importMatch) {
      const firstImportIndex = content.indexOf('import ');
      content = importStr + '\n' + content;
    } else {
      content = importStr + '\n' + content;
    }
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`Added import to ${filePath}`);
  }
}

addImport('src/components/habittracker/HabitCard.tsx', "import { DynamicIcon } from '../ui/DynamicIcon';");
addImport('src/components/habittracker/HabitDetailModal.tsx', "import { DynamicIcon } from '../ui/DynamicIcon';");
addImport('src/components/habittracker/HabitFormModal.tsx', "import { DynamicIcon } from '../ui/DynamicIcon';");
addImport('src/components/habittracker/HabitGroupSection.tsx', "import { DynamicIcon } from '../ui/DynamicIcon';");
addImport('src/components/habittracker/HabitSummaryBar.tsx', "import { DynamicIcon } from '../ui/DynamicIcon';");
