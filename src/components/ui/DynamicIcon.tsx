import {
  Ban,
  Book,
  Brain,
  Check,
  Clock,
  Coffee,
  Droplet,
  Dumbbell,
  Edit3,
  Flower2,
  GraduationCap,
  Heart,
  HelpCircle,
  Moon,
  PersonStanding,
  Pill,
  Sun,
  Trash2,
  UserCircle,
  Utensils,
  X,
  Zap,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react'

type DynamicIconProps = LucideProps & { name: string }

/**
 * Compact icon registry used by habit-tracker metadata.
 *
 * We resolve a small, explicit set of icons (both raw Lucide names and a few
 * legacy Material Symbols aliases that the schema still uses). Importing only
 * what we use keeps tree-shaking effective — `import *` would force the entire
 * Lucide library into every chunk that loads this component, which was the
 * primary cause of the previous ~900 kB habit-tracker bundle.
 */
const ICON_REGISTRY: Record<string, LucideIcon> = {
  // Legacy Material Symbols aliases (kept for backwards compatibility with DB rows).
  self_improvement: UserCircle,
  fitness_center: Dumbbell,
  water_drop: Droplet,
  restaurant: Utensils,
  bedtime: Moon,
  spa: Flower2,
  directions_run: PersonStanding,
  medication: Pill,
  psychology: Brain,
  sunny: Sun,
  wb_sunny: Sun,
  nights_stay: Moon,
  schedule: Clock,
  favorite: Heart,
  local_cafe: Coffee,
  edit: Edit3,
  delete: Trash2,
  close: X,
  check: Check,
  school: GraduationCap,
  bolt: Zap,
  block: Ban,

  // Direct Lucide names (PascalCase).
  Heart,
  GraduationCap,
  Zap,
  UserCircle,
  Ban,
  Sun,
  Moon,
  Clock,
  Book,
  Droplet,
  Utensils,
  Flower2,
  PersonStanding,
  Pill,
  Brain,
  Coffee,
  Edit3,
  Trash2,
  X,
  Check,
  Dumbbell,
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  const Icon = ICON_REGISTRY[name] ?? HelpCircle
  return <Icon {...props} />
}
