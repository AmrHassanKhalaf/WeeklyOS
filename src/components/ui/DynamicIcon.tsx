import * as LucideIcons from 'lucide-react';

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
