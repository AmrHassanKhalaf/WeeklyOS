# 📊 Data Flows وتفاصيل التكامل

**التاريخ**: 23 أبريل 2026

---

## 🔄 مسارات البيانات الكاملة

### 1️⃣ مسار تسجيل الدخول (Sign In Flow)

```
┌─────────────────────────────────────────────────────────────┐
│                      Sign In Page                           │
│  (src/pages/SignIn.tsx)                                    │
└─────────────────────────────────────────────────────────────┘
  ↓
  المستخدم يدخل بريد إلكتروني وكلمة المرور
  ↓
┌─────────────────────────────────────────────────────────────┐
│              handleSignIn() / handleSignUp()                │
│              (في SignIn component)                         │
└─────────────────────────────────────────────────────────────┘
  ↓
  استدعاء supabase.auth.signInWithPassword() أو signUp()
  ↓
┌─────────────────────────────────────────────────────────────┐
│             Supabase Authentication                         │
│  (Backend: Supabase Auth Service)                          │
│  - التحقق من بيانات المستخدم                              │
│  - إنشاء JWT token وrefresh token                          │
└─────────────────────────────────────────────────────────────┘
  ↓
  إرجاع session مع user object
  ↓
┌─────────────────────────────────────────────────────────────┐
│              AuthContext يُحدّث                             │
│  (src/context/AuthContext.tsx)                             │
│  - set user و isLoading = false                            │
└─────────────────────────────────────────────────────────────┘
  ↓
  إعادة توجيه إلى Dashboard
  ↓
┌─────────────────────────────────────────────────────────────┐
│  useWeekStore.initialize() يبدأ                            │
│  - تحميل الأسابيع الحالية من جدول weeks                   │
│  - تحميل المهام من جدول tasks                             │
│  - الاشتراك في التحديثات الفورية                           │
└─────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────┐
│  useSettingsStore.loadFromDb() يبدأ                        │
│  - جلب الإعدادات من جدول user_settings                    │
│  - استعادة موضوع الواجهة                                  │
│  - تعيين المنطقة الزمنية                                   │
└─────────────────────────────────────────────────────────────┘
  ↓
  ✅ تسجيل الدخول كامل - عرض Dashboard
```

### 2️⃣ مسار إضافة مهمة يومية (Create Task)

```
┌─────────────────────────────────────────────────────────────┐
│            Dashboard.tsx - صفحة التطبيق الرئيسية            │
│  عرض أيام الأسبوع (DayCard components)                    │
└─────────────────────────────────────────────────────────────┘
  ↓
  المستخدم ينقر على "إضافة مهمة" في يوم معين
  ↓
┌─────────────────────────────────────────────────────────────┐
│             DayCard.tsx - بطاقة اليوم                      │
│  يعرض onClick handler لإضافة المهمة                       │
└─────────────────────────────────────────────────────────────┘
  ↓
  يفتح modal لإدخال تفاصيل المهمة
  (title, priority, tags, estimatedTime, description)
  ↓
┌─────────────────────────────────────────────────────────────┐
│        useWeekStore.createTask({...})                       │
│  (src/store/useWeekStore.ts)                               │
└─────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────┐
│         supabase.from('tasks').insert({                    │
│           user_id: session.user.id,                        │
│           week_id: currentWeek.id,                         │
│           title,                                            │
│           priority,                                         │
│           day_of_week: selectedDay,                        │
│           status: 'pending',                               │
│           tags,                                             │
│           ...                                               │
│         })                                                  │
└─────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────┐
│           Supabase Database - جدول tasks                  │
│  ✅ التحقق من RLS: user_id == authenticated user          │
│  ✅ التحقق من Constraints: priority والأيام              │
│  ✅ إنشاء UUID للمهمة الجديدة                              │
│  ✅ تعيين created_at و updated_at                          │
└─────────────────────────────────────────────────────────────┘
  ↓
  Real-time Subscription يستقبل التغيير
  ↓
┌─────────────────────────────────────────────────────────────┐
│        subscribeToTasks في useWeekStore                    │
│  (في قنوات postgres_changes)                               │
│  - filters: week_id = currentWeek.id                      │
│  - event: INSERT                                            │
│  - يُحدّث currentWeek.days[n].mediumTasks أو...           │
└─────────────────────────────────────────────────────────────┘
  ↓
  React re-renders DayCard مع المهمة الجديدة
  ↓
  ✅ تُعرض المهمة الجديدة في الواجهة فوراً!
```

### 3️⃣ مسار توليد التحدي الأسبوعي (Generate Challenge)

```
┌─────────────────────────────────────────────────────────────┐
│             Dashboard.tsx                                   │
│  المستخدم ينقر على "Generate Challenge"                   │
└─────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────┐
│          generateChallenge()                                │
│  (في Dashboard component)                                 │
│  - جمع جميع المهام المعلقة (pending)                      │
│  - تكوين context مع أسماء المهام                          │
└─────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────┐
│          useAiApi.sendMessage({                            │
│            type: 'challenge',                              │
│            input: '',                                       │
│            context: { tasks: '...' }                       │
│          })                                                 │
└─────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────┐
│           src/hooks/useApi.ts                              │
│  ✅ getSession() من supabase.auth                          │
│  ✅ جلب access_token                                        │
└─────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────┐
│    POST /functions/v1/ai-handler                           │
│    Headers:                                                 │
│    - Authorization: Bearer {access_token}                  │
│    - apikey: {SUPABASE_ANON_KEY}                           │
│    Body:                                                    │
│    {                                                        │
│      type: 'challenge',                                    │
│      input: '',                                            │
│      context: { tasks: '...' },                           │
│      overrideProvider: undefined,                          │
│      model: state.activeModel,                            │
│      history: []                                           │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────┐
│      supabase/functions/ai-handler/index.ts                │
│  1. فك تشفير JWT والتحقق من صحته                          │
│  2. استخراج user_id من JWT payload.sub                    │
│  3. جلب API key من جدول ai_keys                          │
│  4. جلب ai_settings (المزود والنموذج النشط)              │
└─────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────┐
│         Database Queries:                                  │
│  await supabaseClient.from('ai_settings')                 │
│    .select('default_provider, active_model')              │
│    .eq('user_id', userId)                                │
│                                                            │
│  await supabaseClient.from('ai_keys')                     │
│    .select('provider, api_key')                           │
│    .eq('user_id', userId)                                │
└─────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────┐
│      تحضير نظام الرسائل:                                  │
│                                                            │
│  systemPrompt = GLOBAL_RULES + context JSON              │
│  GLOBAL_RULES يحتوي على:                                  │
│  - اللغة: Arabic with English terms                       │
│  - التنسيق: Plain text NO markdown                        │
│  - البنية: 👋 greeting + 🎯 context + etc                │
└─────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────┐
│        Gemini API Call:                                    │
│  const genAI = new GoogleGenerativeAI(apiKey)             │
│  const model = genAI.getGenerativeModel({                │
│    model: aiModel,                                         │
│    systemInstruction: systemPrompt,                        │
│  })                                                         │
│  const chat = model.startChat({ history })               │
│  const result = await chat.sendMessage(input)            │
└─────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────┐
│        Gemini Response:                                    │
│  تُرجع استجابة نصية مثل:                                  │
│  "1. Clear the Backlog                                    │
│   2. Finish all your pending tasks..."                   │
└─────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────┐
│     Return to Frontend:                                    │
│  {                                                         │
│    response: "1. Clear the Backlog\n2. Finish...",       │
│    providerUsed: "gemini"                                │
│  }                                                         │
└─────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────┐
│     Dashboard.tsx يعالج الاستجابة:                        │
│  - تقسيم النص إلى سطور                                     │
│  - استخراج title من السطر الأول                            │
│  - استخراج desc من السطر الثاني                            │
│  - استدعاء updateChallenge(title, desc)                  │
└─────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────┐
│      useWeekStore.updateChallenge():                       │
│  await supabase.from('weeks')                            │
│    .update({                                              │
│      challenge_title: title,                             │
│      challenge_description: desc                         │
│    })                                                      │
│    .eq('id', currentWeek.id)                            │
└─────────────────────────────────────────────────────────────┘
  ↓
  ✅ التحدي الجديد يظهر في الواجهة!
```

### 4️⃣ مسار توزيع المهام (Schedule Distribution)

```
┌─────────────────────────────────────────────────────────────┐
│         WeeklyDistribution.tsx                             │
│  - تحميل brain_dump items                                 │
│  - عرض قائمة بجميع الأفكار                                │
└─────────────────────────────────────────────────────────────┘
  ↓
  المستخدم يختار أفكار ويضغط "Distribute"
  ↓
┌─────────────────────────────────────────────────────────────┐
│         openAssignModal()                                  │
│  - تجميع المختارة                                          │
│  - إنشاء assignDrafts array                              │
│  - تعيين يوم افتراضي لكل مهمة                             │
└─────────────────────────────────────────────────────────────┘
  ↓
  المستخدم يعدّل الأيام والأولويات
  ↓
┌─────────────────────────────────────────────────────────────┐
│         sendMessage({                                      │
│           type: 'schedule',                               │
│           input: userPrompt,                              │
│           context: { brainDumpContent }                  │
│         })                                                 │
└─────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────┐
│      ai-handler Edge Function                             │
│  type === 'schedule' → SCHEDULE_RULES                    │
│  generationConfig: { responseMimeType: 'application/json' }│
│  Gemini يُرجع JSON مباشرة!                               │
│  {                                                         │
│    "tasks": [                                            │
│      {                                                    │
│        "title": "...",                                  │
│        "priority": "high|medium|low",                   │
│        "day": "saturday|sunday|...",                    │
│        "estimatedTime": "2h",                           │
│        "tags": ["work", "deep"]                        │
│      },                                                  │
│      ...                                                 │
│    ]                                                     │
│  }                                                        │
└─────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────┐
│      parseScheduleResponse()                              │
│  - محاولة JSON.parse() مباشرة                            │
│  - إذا فشل، تحليل markdown code fences                  │
│  - إذا فشل، استخراج object من النص                      │
│  - إذا فشل، رفع خطأ                                      │
└─────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────┐
│      inferPriorityFromTags()                              │
│  - تحليل tags لاستخلاص الأولوية                          │
│  - "deep", "complex" → "high"                            │
│  - "quick", "easy" → "low"                               │
│  - الباقي → "medium"                                     │
└─────────────────────────────────────────────────────────────┘
  ↓
  عرض assignDrafts في modal للتأكيد
  ↓
┌─────────────────────────────────────────────────────────────┐
│       for each draft:                                      │
│         useWeekStore.createTask(draft)                    │
│  - حفظ إلى جدول tasks                                    │
│  - ربط بـ week_id الحالية                                │
└─────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────┐
│       for each selected item:                             │
│         useBrainDumpStore.removeItem(id)                 │
│  - حذف من جدول brain_dump                               │
│  - تنظيف الأفكار المُنفذة                                 │
└─────────────────────────────────────────────────────────────┘
  ↓
  ✅ المهام موزعة والأفكار نظيفة!
```

### 5️⃣ مسار التقييم الأسبوعي (Weekly Evaluation)

```
┌─────────────────────────────────────────────────────────────┐
│       WeeklyEvaluation.tsx                                │
│  عرض ثلاث حقول تقييم:                                     │
│  1. What went well                                        │
│  2. Where I struggled                                     │
│  3. Lessons learned                                       │
└─────────────────────────────────────────────────────────────┘
  ↓
  المستخدم ينقر على "Generate" أو يكتب يدويًا
  ↓
┌─────────────────────────────────────────────────────────────┐
│       handleGenerate(type)                                 │
│  - جلب currentWeek مع إحصائياتها                          │
│  - بناء context مع الأسبوع والمهام                        │
│  - صياغة prompt مختص حسب النوع                            │
└─────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────┐
│       sendMessage({                                        │
│         type: 'reflection',                               │
│         input: specificPrompt,                            │
│         context: weekStats                               │
│       })                                                   │
└─────────────────────────────────────────────────────────────┘
  ↓
  ai-handler يعالج بـ GLOBAL_RULES
  ↓
┌─────────────────────────────────────────────────────────────┐
│       Gemini Response (1-2 sentences):                     │
│  "You handled Monday's tasks well and pushed through      │
│   the deep work session. Next time, batch your smaller    │
│   tasks."                                                  │
└─────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────┐
│       setEvalState({ [type]: response })                  │
│  - تحديث الحالة المحلية                                    │
│  - يكتب المستخدم النص أثناء التحديث                       │
└─────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────┐
│       useWeekStore.updateEvaluation(type, text)           │
│  await supabase.from('weeks')                            │
│    .update({ eval_went_well: text })  // مثال           │
│    .eq('id', currentWeek.id)                            │
└─────────────────────────────────────────────────────────────┘
  ↓
  ✅ التقييم محفوظ في جدول weeks!
```

### 6️⃣ مسار حفظ الإعدادات (Settings Save)

```
┌─────────────────────────────────────────────────────────────┐
│         Settings.tsx                                       │
│  - تغيير الموضوع (theme)                                  │
│  - إدخال مفتاح API                                        │
│  - اختيار نموذج AI                                       │
│  - تعيين المنطقة الزمنية                                   │
└─────────────────────────────────────────────────────────────┘
  ↓
  المستخدم يغيّر أي إعداد
  ↓
┌─────────────────────────────────────────────────────────────┐
│       useSettingsStore.setTheme() / setAiKey() / etc      │
│  (حسب الإعداد المتغيّر)                                   │
└─────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────┐
│       Zustand Store Update:                                │
│  set((state) => ({                                        │
│    aiKeys: { ...state.aiKeys, [provider]: key }          │
│  }))                                                       │
└─────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────┐
│       syncSettingsToDb() (automatically)                  │
│  - هذه الدالة تُستدعى بعد كل تغيير                       │
└─────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────┐
│       تحديث جداول متعددة حسب الإعداد:                      │
│                                                            │
│  theme, dailyReminders, etc:                             │
│  supabase.from('user_settings').upsert({                │
│    user_id: user.id,                                    │
│    theme: 'dark',                                       │
│    ...                                                  │
│  })                                                       │
│                                                            │
│  AI Keys:                                                 │
│  supabase.from('ai_keys').upsert({                      │
│    user_id: user.id,                                    │
│    provider: 'gemini',                                  │
│    api_key: key,                                        │
│    is_active: true                                      │
│  })                                                       │
└─────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────┐
│       Persist to Local Storage:                           │
│  Zustand middleware يحفظ تلقائيًا                         │
│  window.localStorage['weeklyos-settings-persist']       │
└─────────────────────────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────────────────────────┐
│       React Re-render:                                    │
│  - تطبيق الموضوع الجديد على DOM                          │
│  - document.body.classList.toggle('light')              │
│  - ظهور الاعتراف بـ "Settings saved"                      │
└─────────────────────────────────────────────────────────────┘
  ↓
  ✅ الإعدادات محفوظة محليًا وفي Database!
```

---

## 📋 جداول الدوال والتكاملات

### جدول Hooks وربطها بالـ Stores و APIs

| Hook | الدالة الرئيسية | الـ Store المتصلة | الـ API |
|------|--------|----------|--------|
| useApi | sendMessage() | useSettingsStore | ai-handler Edge Function |
| useAuth | - | AuthContext | Supabase Auth |
| useWeekStore | initialize() | - | Supabase (weeks, tasks) |
| useSettingsStore | loadFromDb() | - | Supabase (user_settings, ai_keys) |
| useBrainDumpStore | loadItems() | - | Supabase (brain_dump) |
| usePinnedTaskStore | loadPinnedTasks() | - | Supabase (pinned_tasks) |
| useLayoutStore | - | - | Local State |

### جدول جميع Database Queries

| الجدول | العملية | الـ Hook/Store | الشرط |
|--------|--------|---------|------|
| weeks | SELECT | useWeekStore | user_id = current user |
| weeks | INSERT | useWeekStore | - |
| weeks | UPDATE | useWeekStore | user_id match + id match |
| tasks | SELECT | useWeekStore | week_id match |
| tasks | INSERT | useWeekStore | user_id = current user |
| tasks | UPDATE | useWeekStore | id match |
| tasks | DELETE | useWeekStore | id match |
| brain_dump | SELECT | useBrainDumpStore | user_id = current user |
| brain_dump | INSERT | useBrainDumpStore | - |
| brain_dump | UPDATE | useBrainDumpStore | id match |
| brain_dump | DELETE | useBrainDumpStore | id match |
| pinned_tasks | SELECT | usePinnedTaskStore | user_id = current user |
| pinned_tasks | INSERT | usePinnedTaskStore | - |
| pinned_tasks | UPDATE | usePinnedTaskStore | id match |
| pinned_tasks | DELETE | usePinnedTaskStore | id match |
| user_settings | SELECT | useSettingsStore | user_id = current user |
| user_settings | UPSERT | useSettingsStore | - |
| ai_settings | SELECT | ai-handler | user_id = JWT sub |
| ai_keys | SELECT | ai-handler | user_id = JWT sub |

### جدول Pages وكل الدوال فيها

| الصفحة | الـ Component | الدوال الرئيسية | الـ Stores المستخدمة |
|--------|------------|----------|----------|
| Dashboard | Dashboard | generateChallenge, fetchInsight | useWeekStore, useSettingsStore, useAiApi |
| WeeklyDistribution | WeeklyDistribution | openAssignModal, distributeItems, parseScheduleResponse | useWeekStore, useBrainDumpStore, useAiApi |
| FocusedDay | FocusedDay | startPomodoro, stopPomodoro, toggleTaskComplete, markDayComplete | useWeekStore, useLayoutStore |
| BrainDump | BrainDump | handleStructure, handleQuickAdd, deleteSelected | useBrainDumpStore |
| WeeklyEvaluation | WeeklyEvaluation | handleGenerate, handleSave | useWeekStore, useAiApi |
| Settings | Settings | saveLLMSettings, exportWeeklyReport, createPinnedTask | useSettingsStore, useWeekStore, usePinnedTaskStore |
| SignIn | SignIn | handleSignUp, handleSignIn | useAuth, AuthContext |

---

## 🔐 الأمان والـ RLS Policies

### Row Level Security (RLS) لكل جدول

```sql
-- weeks
CREATE POLICY "Users can see their own weeks"
  ON weeks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weeks"
  ON weeks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weeks"
  ON weeks FOR UPDATE
  USING (auth.uid() = user_id);

-- tasks
CREATE POLICY "Users can see their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- (وهكذا لـ brain_dump, pinned_tasks, ai_settings, ai_keys)
```

---

## 🏗️ Error Handling والـ Retry Logic

### في useApi.ts

```typescript
// JWT Token Refresh Logic
if (response.status === 401) {
  const { data: refreshData } = await supabase.auth.refreshSession()
  const refreshedToken = refreshData.session?.access_token
  if (refreshedToken) {
    response = await callAiHandler(refreshedToken)
  }
}

// Error Response Handling
if (!response.ok) {
  const payload = await response.json().catch(() => null)
  throw new Error(payload?.error || `Edge Function returned ${response.status}`)
}
```

### في useWeekStore.ts

```typescript
// Error Logging
const { data, error } = await supabase.from('weeks').select()
if (error) {
  console.error('[useWeekStore] load failed:', error)
  set({ isLoading: false })
  return
}
```

### في ai-handler

```typescript
// CORS Headers لـ Errors
return new Response(JSON.stringify({ error: error.message }), {
  status: 500,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
})
```

---

## 📊 Performance Optimizations

### 1. Lazy Loading للـ Pages
```typescript
const Dashboard = lazy(() => 
  import('./pages/Dashboard').then(m => ({ default: m.Dashboard }))
)
```

### 2. Selective Updates من Real-time
```typescript
subscribeToTasks(weekId: string, callback)
  // يستمع فقط للـ changes في week معينة
  .filter(`week_id=eq.${weekId}`)
```

### 3. Database Indexes للبحث السريع
```sql
CREATE INDEX idx_weeks_user_year_week 
  ON weeks(user_id, year, week_number);

CREATE INDEX idx_pinned_tasks_user_active 
  ON pinned_tasks(user_id, is_active);
```

---

## 🔄 State Persistence

### Local Storage (via Zustand persist)
```typescript
useSettingsStore.create(
  persist(
    (set, get) => ({ /* store state */ }),
    {
      name: 'weeklyos-settings-persist'
    }
  )
)
```

### Database Sync
```typescript
// عند تغيير أي إعداد
syncSettingsToDb(updates)
  → supabase.from('user_settings').upsert()
```

---

**آخر تحديث**: 23 أبريل 2026
