# Weekly Distribution — جميع الميزات

## 1. هيكل الصفحة الرئيسي

- **Layout:** `AppLayout` (sidebar + top nav + mobile bottom nav)
- **مسار الرابط:** `/weekly-distribution`
- **حالة التحميل:** 6 Skeleton cards (animate-pulse) في grid 2 عمود
- **حالة الخطأ:** ErrorBoundary يغلف الـ layout

---

## 2. الـ Header

- عنوان الأسبوع: `Week {number} — {date}`
- أيقونة `Calendar` + نص "Distribution Phase: Aligning energy with impact."
- 3 أزرار في header:
  1. **Assign Braindump** — أيقونة `Brain` — معطل لو مفيش items
  2. **Show/Hide Tags** — أيقونة `Tag` — toggle عرض الـ tags
  3. **Auto-distribute** — أيقونة `Sparkles` / `Loader2` (animate-spin) — معطل لو مفيش items

---

## 3. Day Grid

- **Grid:** 2 أعمدة (grid-cols-2) لكل أيام الأسبوع
- **كل Day card** مغلف بـ `BorderGlow` (تأثير إضاءة متحرك):
  - `edgeSensitivity: 30`
  - `glowColor: "40 80 80"`
  - `borderRadius: 18`
  - `glowRadius: 40`
  - `colors: ['#c084fc', '#f472b6', '#38bdf8']`
  - `animated: false`
- **مكون داخلي:** `DayCardDistribution` يستقبل `day` + `showTags`

---

## 4. DayCardDistribution — الأنواع الثلاثة للـ Day Card

### A. Rest Day (يوم راحة)
- خلفية مع `bg-gradient-to-b from-tertiary/5`
- Header: عنوان "Rest Day" باللون `tertiary` + أيقونة `Leaf`
- تاريخ اليوم
- أيقونة `Moon` كبيرة + نص "Recharge Phase"
- رسالة: "System-mandated downtime for cognitive recovery"
- زر **"Override Rest"** — يسمح بإضافة مهمة `low` priority
- عند override: يظهر `TaskInlineForm` لإضافة مهمة

### B. High Output Zone (منطقة إنتاج عالية)
- Header عادي باسم اليوم + التاريخ
- زر **"Day Complete"**
- أيقونة `GripVertical` (للسحب والترتيب)
- أيقونة `Sparkles` + "High Output Zone" + "Peak cognitive window identified"

### C. Normal Day (اليوم العادي)
#### Header:
- اسم اليوم + التاريخ
- زر **"Day Complete"**
- أيقونة `GripVertical`

#### Progress Bar:
- يظهر فقط لو في tasks
- نص "Day Progress" + النسبة المئوية
- شريط تقدم `h-1.5`:
  - لون `bg-tertiary` لو 100%
  - لون `bg-primary` لو أقل

#### الحالة الفارغة (Empty State):
- أيقونة `ListTodo` كبيرة
- نص "Click to plan this day"
- opacity 20% → 40% على hover

#### محتوى اليوم (3 أقسام):

##### 1. High Impact (1 slot)
- عنوان "High Impact" باللون `[#b8c3ff]`
- عداد `filled/slots` (مثلاً `1/1`)
- زر `Plus` لإضافة مهمة (بيتوقف عند الـ limit)
- `TaskItem` واحد (highTask)
- `TaskInlineForm` عند الإضافة

##### 2. Medium Priority (3 slots)
- عنوان "Medium Priority"
- عداد `filled/3`
- زر `Plus`
- 3 `TaskItem` (بعضهم ممكن يكون empty)
- `TaskInlineForm`

##### 3. Small Tasks (5 slots)
- عنوان "Small Tasks"
- عداد `filled/5`
- زر `Plus`
- 5 `TaskItem`
- `TaskInlineForm`

---

## 5. TaskItem (مهمة داخل اليوم)

### عرض المهمة:
- **Checkbox دائري:**
  - `w-4 h-4 rounded border`
  - `bg-primary border-primary` لو done
  - `border-outline-variant` لو pending
  - أيقونة `Check` جوا checkbox
- **عنوان المهمة:**
  - `line-through text-on-surface-variant` لو done
  - opacity 60% للـ card كاملة لو done
  - `opacity-60 bg-surface-container-low`
- **Pin icon:** أيقونة `Pin` بجانب العنوان لو `task.type === 'pinned'`
- **Tags:** تظهر تحت العنوان (loop على `task.tags`) — كل tag: `px-1.5 py-0.5 bg-surface-container-low text-[9px]`
- **Description:** `line-clamp-2` لو موجود
- **Time info:**
  - `startTime` مع أيقونة `Clock`
  - `estimatedTime` مع أيقونة `Hourglass`
  - باكدج `bg-primary/5 w-max px-2 py-0.5 rounded`
- **Click على المحتوى:** يفتح Edit mode

### وضع التعديل (Edit mode):
- input للعنوان (autoFocus)
- textarea للملاحظات
- input type="time" للـ Start Time
- input للـ Duration
- select للـ Priority (High/Medium/Low)
- select للـ Day (لتغيير اليوم)
- **Delete button:** أيقونة `Trash2` + نص "Delete" — `text-error`
- **Cancel button:** يلغي التعديل
- **Save button:** `bg-primary/20 text-primary`
- **Enter** على العنوان → يحفظ
- **Border:** `border-primary/30`

### المهمة الفارغة (Empty slot):
- `border-dashed border-white/10`
- نص "No tasks yet"
- `cursor-pointer` — ينفذ `onEmptyClick`

---

## 6. TaskInlineForm (إضافة مهمة جديدة)

- نفس تصميم edit mode لكن بدون delete
- AutoFocus على input العنوان
- **Enter** → إنشاء المهمة
- **Escape** → إلغاء
- **Create Task button:** `bg-primary/20 text-primary font-bold`
- placeholder: `"{Priority} task title..."` (مثلاً "High task title...")

---

## 7. Assign Braindump Modal

### Trigger:
- زر "Assign Braindump" في الـ header
- بيستخدم الـ brain dump items المحددة (selected) — أو كل items لو مفيش مختار

### محتوى المودال:
- **Header:** "Assign Braindump Tasks" + وصف + زر إغلاق (أيقونة `X`)
- **قائمة الـ drafts:**
  - كل draft عبارة عن row في grid 12 عمود
  - **Col 1:** Checkbox (select/deselect)
  - **Col 2:** عنوان المهمة + tags (أو "No tags")
  - **Col 3:** Select للـ Day (قائمة أيام الأسبوع + "(Rest)" لو day راحة)
  - **Col 4:** Select للـ Priority (high/medium/low)
- **Footer:**
  - نص `"{count} selected"`
  - زر **"Cancel"** (ghost)
  - زر **"Assign Selected"** (primary) — معطل لو مفيش selected

### Action:
- `createTask` لكل draft
- `removeItem` من brain dump بعد النجاح

---

## 8. Auto-distribute (AI)

### Trigger:
- زر "Auto-distribute" في الـ header
- بيستخدم `sendMessage('schedule', ...)` من `useAiApi`

### AI Prompt:
- بيستخدم **1-3-5 productivity system**:
  - 1 High priority task لكل يوم
  - 3 Medium priority tasks
  - 5 Small priority tasks
- بياخد الـ brain dump items كـ input
- بيمرن الـ rest days عشان الـ AI يتجنبها
- بينادي `inferPriorityFromTags` عشان يحسّن الـ priority

### Parse Response:
- بيحاول `JSON.parse` أولاً
- لو فشل → يجرب ````json ``` ```` fenced block
- لو فشل → يجرب `{...}` object extraction
- **Validation:** `isScheduleTask` function تتحقق من `title`, `priority`, `day`, `tags`
- **Normalization:** `normalizeScheduleTasks` تتعامل مع array أو object مع key `tasks`

### After Success:
- `createTask` لكل مهمة
- `removeItem` لكل brain dump item (auto-clear)

---

## 9. الـ Data Flow

- `useWeekStore` → `currentWeek`, `createTask`, `toggleTaskComplete`, `deleteTask`, `updateTask`, `markDayComplete`
- `useBrainDumpStore` → `brainDumpItems`, `loadItems`, `removeItem`
- `useSettingsStore` → `restDays`
- `useAiApi` → `sendMessage` (لـ auto-distribute)

---

## 10. كل الأيقونات المستخدمة

من `lucide-react`:
`Calendar`, `Brain`, `Tag`, `Sparkles`, `Loader2`, `X`, `Trash2`, `Check`, `Pin`, `Clock`, `Hourglass`, `Leaf`, `Moon`, `GripVertical`, `ListTodo`, `Plus`, `BorderGlow` (مخصص)

---

## 11. الـ Types المستخدمة

```typescript
// من useWeekStore
type Priority = 'high' | 'medium' | 'low'
type TaskStatus = 'pending' | 'done'
type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

interface Task {
  id: string
  title: string
  description?: string
  priority: Priority
  type?: 'main' | 'medium' | 'small' | 'pinned'
  status: TaskStatus
  day?: DayOfWeek
  weekId?: string
  startTime?: string
  estimatedTime?: string
  actualDuration?: number
  tags?: string[]
  pinnedTaskId?: string
}

interface DayPlan {
  day: DayOfWeek
  date: string
  shortName: string
  isToday?: boolean
  isRestDay?: boolean
  progress: number
  highTask?: Task
  mediumTasks: Task[]
  smallTasks: Task[]
  dailyNote?: string
}

interface BrainDumpItem {
  id: string
  title: string
  selected?: boolean
  tags?: string[]
}

// داخل الصفحة
type ScheduleTask = {
  title: string
  priority: Priority
  day: DayOfWeek
  estimatedTime?: string
  tags?: string[]
}

type AssignDraft = {
  id: string
  title: string
  tags: string[]
  selected: boolean
  day: DayOfWeek
  priority: Priority
}
```

---

## 12. تفاصيل CSS والتنسيقات

- **Grid:** `grid-cols-2 gap-6`
- **Card height:** `h-[500px]`
- **BorderGlow:** أنيميشن إضاءة متحركة مع `colors={['#c084fc', '#f472b6', '#38bdf8']}`
- **Rest Day:** `bg-gradient-to-b from-tertiary/5 to-transparent`
- **Modal:** `fixed inset-0 z-50 bg-black/60 backdrop-blur-sm`
- **Progress bar:** `h-1.5 w-full bg-surface-container-high rounded-full`
- **Scroll:** `overflow-y-auto custom-scrollbar`
- **Empty state:** `opacity-20 hover:opacity-40 transition-opacity`
- **Tags:** `px-1.5 py-0.5 bg-surface-container-low text-[9px] text-on-surface-variant rounded uppercase tracking-wider`
- **Time badge:** `bg-primary/5 w-max px-2 py-0.5 rounded text-[10px] text-primary/70`
- **Colors:** كلها من Tailwind classes (Material 3 tokens: `bg-surface-container-low`, `text-on-surface`, `text-primary`, `text-tertiary`, `text-error`, `border-outline-variant`, ..)
