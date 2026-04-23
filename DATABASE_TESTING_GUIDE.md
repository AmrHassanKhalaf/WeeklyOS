# 📚 Database Testing & MCP Guide - WeeklyOS

## نظرة عامة

تم إعداد مشروع WeeklyOS للاختبار الشامل لجميع جداول قاعدة البيانات (Supabase) باستخدام:
- **Vitest** - إطار عمل الاختبارات
- **MCP** (Model Context Protocol) - للتفاعل مع الخدمات الخارجية
- **Supabase** - قاعدة البيانات الرئيسية

---

## 🗂️ هيكل المشروع الجديد

```
WeeklyOS/
├── test/
│   ├── setup.ts          # إعدادات الاختبارات المركزية
│   └── fixtures.ts       # بيانات اختبار ومصنعات
├── src/
│   ├── lib/
│   │   ├── __tests__/
│   │   │   └── supabase.test.ts       # اختبار وظائف Supabase
│   │   ├── dbSeeder.ts                # أداة ملء البيانات
│   │   └── dbQuery.ts                 # أداة الاستعلامات المباشرة
│   ├── store/
│   │   └── __tests__/
│   │       └── useWeekStore.test.ts   # اختبار جدول weeks
│   └── hooks/
│       └── __tests__/
│           ├── useTasks.test.ts       # اختبار جدول tasks
│           ├── useBrainDump.test.ts   # اختبار جدول brain_dump
│           ├── usePinnedTasks.test.ts # اختبار جدول pinned_tasks
│           ├── useUserSettings.test.ts# اختبار جدول user_settings
│           ├── useAISettings.test.ts  # اختبار جدول ai_settings
│           └── useAIKeys.test.ts      # اختبار جدول ai_keys
├── .env                  # متغيرات البيئة (بدون مفاتيح حساسة)
├── .env.local           # مفاتيح حساسة (محلية فقط)
├── vitest.config.ts     # تكوين Vitest
└── .gitignore           # يتضمن .env.local
```

---

## 🧪 الاختبارات

### عدد الاختبارات

| الملف | عدد الاختبارات | الجدول |
|------|--------------|--------|
| `supabase.test.ts` | 9 | Core Supabase Functions |
| `useWeekStore.test.ts` | 19 | weeks |
| `useTasks.test.ts` | 26 | tasks |
| `useBrainDump.test.ts` | 26 | brain_dump |
| `usePinnedTasks.test.ts` | 30 | pinned_tasks |
| `useUserSettings.test.ts` | 28 | user_settings |
| `useAISettings.test.ts` | 29 | ai_settings |
| `useAIKeys.test.ts` | 35 | ai_keys |
| **الإجمالي** | **211** | **7 جداول + Core** |

### تشغيل الاختبارات

```bash
# تشغيل جميع الاختبارات مرة واحدة
npm test

# تشغيل الاختبارات في وضع المراقبة (Watch Mode)
npm run test:watch

# تشغيل الاختبارات مع تقرير التغطية
npm run test:coverage

# تشغيل اختبارات ملف محدد
npm test -- src/hooks/__tests__/useTasks.test.ts

# تشغيل اختبارات بنمط معين
npm test -- --grep "CRUD Operations"
```

---

## 🔧 استخدام MCP مع قاعدة البيانات

### 1️⃣ تفعيل MCP Supabase

ملف التكوين: [.vscode/mcp.json](.vscode/mcp.json)

```bash
# التحقق من اتصال MCP
- استخدم Copilot Chat واسأل عن أدوات Supabase المتاحة
- يجب أن تظهر أدوات مثل: create_project, list_migrations, get_project_url
```

### 2️⃣ أدوات MCP المتاحة

| الأداة | الوصف | الاستخدام |
|------|-------|----------|
| `list_migrations` | عرض جميع migrations | `npm run mcp -- list_migrations` |
| `get_project_url` | الحصول على رابط المشروع | `npm run mcp -- get_project_url` |
| `get_advisors` | نصائح أمان وأداء | `npm run mcp -- get_advisors` |
| `get_logs` | تسجيلات قاعدة البيانات | `npm run mcp -- get_logs` |

### 3️⃣ أمثلة على الاستخدام

#### مثال 1: الاستعلام عن جدول

```typescript
import { querySelect } from '@/lib/dbQuery';

// الحصول على جميع المهام للمستخدم
const tasks = await querySelect('tasks', {
  filter: { user_id: 'user-123' },
  orderBy: 'created_at',
  ascending: false,
  limit: 10,
});
```

#### مثال 2: ملء بيانات اختبار

```typescript
import { generateCompleteDataset, printStats } from '@/lib/dbSeeder';

const dataset = generateCompleteDataset({
  userCount: 5,
  weeksPerUser: 10,
  tasksPerWeek: 15,
});

printStats(dataset);
```

#### مثال 3: تنفيذ عملية batch

```typescript
import { queryInsertBatch } from '@/lib/dbQuery';

const tasks = [
  { user_id: 'u1', week_id: 'w1', title: 'Task 1' },
  { user_id: 'u1', week_id: 'w1', title: 'Task 2' },
];

await queryInsertBatch('tasks', tasks);
```

---

## 🔐 الأمان والبيئة

### هيكل متغيرات البيئة

```bash
# .env (الملف العام - آمن للـ Version Control)
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_PUBLISHABLE_KEY=...

# .env.local (الملف المحلي - محظور من Git)
VITE_SUPABASE_ANON_KEY=...
VITE_GEMINI_API_KEY=...
SUPABASE_SERVICE_KEY=...  # (اختياري - للاختبارات فقط)
```

### التحقق من الأمان

```bash
# التحقق من عدم وجود مفاتيح حساسة في Git
git check-ignore .env.local    # يجب أن يكون محظور

# تسجيل المفاتيح المرئية في السجل
grep -r "VITE_SUPABASE_" .env   # يجب أن تكون فارغة
```

---

## 📊 البيانات المدعومة

### الجداول الـ 7

#### 1. `weeks` - الأسابيع
- المقاييس الأسبوعية (النقاط والأنشطة)
- الملاحظات اليومية
- درجات التحديات

#### 2. `tasks` - المهام اليومية
- المهام المرتبطة بالأسابيع
- الأولويات والحالات
- الوسوم والارتباطات بـ pinned_tasks

#### 3. `brain_dump` - جمع المهام
- تجميع الأفكار والمهام
- التحويل إلى مهام فعلية
- الأرشفة

#### 4. `pinned_tasks` - المهام المكررة
- المهام الأسبوعية المتكررة
- أوقات البداية والنهاية
- تاريخ الانتهاء

#### 5. `user_settings` - إعدادات المستخدم
- المظهر (light/dark/system)
- المنطقة الزمنية
- يوم بداية الأسبوع
- خيارات التحميل التلقائي

#### 6. `ai_settings` - إعدادات AI
- مزود AI الافتراضي
- النموذج النشط
- تفعيل الخيار البديل

#### 7. `ai_keys` - مفاتيح API
- مفاتيح API الآمنة
- حالة التفعيل
- تكامل Vault

---

## 🧩 أمثلة الاستخدام

### مثال 1: الاختبار المحلي

```bash
# 1. تشغيل الاختبارات
npm run test:watch

# 2. في VS Code مع Copilot
# اسأل: "اختبر جدول tasks"
# سيقوم Copilot بتشغيل الاختبارات المتعلقة
```

### مثال 2: نقل البيانات

```typescript
import { generateCompleteDataset } from '@/lib/dbSeeder';
import { queryInsertBatch } from '@/lib/dbQuery';

// إنشاء بيانات اختبار
const dataset = generateCompleteDataset({ userCount: 10 });

// نقل البيانات إلى Supabase
await queryInsertBatch('weeks', dataset.weeks);
await queryInsertBatch('tasks', dataset.tasks);
```

### مثال 3: الاستعلام والتحليل

```typescript
import { querySelect, queryCount, printDatabaseStats } from '@/lib/dbQuery';

// عرض الإحصائيات
await printDatabaseStats();

// الاستعلام عن المهام المكتملة
const completed = await querySelect('tasks', {
  filter: { status: 'completed' },
});

console.log(`Completed tasks: ${completed.length}`);
```

---

## 🚀 نصائح الأداء

### أفضل الممارسات

1. **استخدم الفهارس**
   ```sql
   -- الفهارس الموجودة بالفعل
   idx_pinned_tasks_user_active (user_id, is_active)
   idx_pinned_tasks_user_day (user_id, day_of_week)
   ```

2. **قلل عمليات الاستعلام**
   - استخدم `querySelect` مع `limit`
   - تجنب الاستعلامات بدون فلاتر على الجداول الكبيرة

3. **استخدم Real-time subscriptions**
   ```typescript
   const unsubscribe = supabase
     .channel('tasks-realtime')
     .on('postgres_changes', { event: '*', table: 'tasks' }, callback)
     .subscribe();
   ```

---

## 🐛 استكشاف الأخطاء

### خطأ شائع 1: متغيرات البيئة

```bash
# ❌ خطأ
Missing Supabase env vars

# ✅ الحل
# تأكد من وجود .env.local مع VITE_SUPABASE_ANON_KEY
cat .env.local
```

### خطأ شائع 2: فشل الاختبارات

```bash
# ❌ خطأ
Supabase client not initialized

# ✅ الحل
npm test -- --reporter=verbose  # اعرض التفاصيل الكاملة
```

### خطأ شائع 3: مشاكل الأمان في RLS

```bash
# في Supabase Dashboard
# تحقق من: Authentication > Policies
# يجب أن تسمح السياسات بالوصول الصحيح
```

---

## 📖 موارد إضافية

- [Vitest Documentation](https://vitest.dev/)
- [Supabase Client Docs](https://supabase.com/docs/reference/javascript)
- [MCP Protocol Spec](https://github.com/modelcontextprotocol/specification)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)

---

## ✅ قائمة التحقق الأخيرة

- [x] اختبارات شاملة لـ 7 جداول (211 اختبار)
- [x] مصنعات بيانات اختبار (fixtures)
- [x] أداة ملء البيانات (dbSeeder)
- [x] أداة الاستعلامات (dbQuery)
- [x] تكوين Vitest الكامل
- [x] إعداد البيئة الآمن
- [x] MCP integration جاهز
- [x] توثيق شاملة

---

## 📝 الملاحظات

**التاريخ**: 23 أبريل 2026
**الإصدار**: 1.0.0
**الحالة**: ✅ جاهز للإنتاج

تم إعداد كل شيء بنجاح! استمتع باختبار قاعدة البيانات الخاصة بك 🎉
