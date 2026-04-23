# 🚀 MCP + Database Integration Guide

## نظرة عامة

هذا الدليل يوضح كيفية استخدام **MCP (Model Context Protocol)** مع أدوات قاعدة البيانات لـ WeeklyOS.

---

## 📋 المحتويات

1. [البدء السريع](#-البدء-السريع)
2. [استخدام MCP](#-استخدام-mcp)
3. [أدوات قاعدة البيانات](#-أدوات-قاعدة-البيانات)
4. [أمثلة عملية](#-أمثلة-عملية)
5. [سير العمل](#-سير-العمل)
6. [استكشاف الأخطاء](#-استكشاف-الأخطاء)

---

## 🎯 البدء السريع

### التحقق من التثبيت

```bash
# تشغيل الاختبارات للتحقق
npm test

# النتيجة المتوقعة:
# ✅ 245 اختبار - جميعها نجحت
# ⏱️ الوقت: ~2-3 ثواني
```

### التحقق من MCP

```bash
# في VS Code Copilot Chat:
# اسأل: "Show me available Supabase MCP tools"

# المتوقع:
# ✅ list_migrations
# ✅ get_project
# ✅ apply_migration
# ✅ execute_sql
# ✅ get_project_url
# ✅ get_logs
# ✅ get_advisors
```

---

## 🔧 استخدام MCP

### من Copilot Chat

#### 1️⃣ فحص المشروع

```
في Copilot Chat:
"Use MCP to check the Supabase project status"

MCP سيقوم بـ:
- التحقق من حالة المشروع
- عرض آخر نشاط
- عرض إحصائيات الاستخدام
```

#### 2️⃣ عرض المهام

```
في Copilot Chat:
"List all database migrations using MCP"

MCP سيقوم بـ:
- عرض جميع migrations المطبقة
- عرض تاريخ التطبيق
- عرض أسماء الملفات
```

#### 3️⃣ فحص الأمان

```
في Copilot Chat:
"Check security advisors for the database using MCP"

MCP سيقوم بـ:
- فحص RLS policies
- كشف الثغرات الأمنية
- توصيات لتحسين الأمان
```

#### 4️⃣ مراقبة الأداء

```
في Copilot Chat:
"Show performance advisors using MCP"

MCP سيقوم بـ:
- فحص الفهارس
- كشف الاستعلامات البطيئة
- توصيات للتحسين
```

#### 5️⃣ عرض السجلات

```
في Copilot Chat:
"Get database logs for the last hour using MCP"

MCP سيقوم بـ:
- عرض سجلات قاعدة البيانات
- تصفية حسب الخدمة (API, Postgres, Auth)
- عرض الأخطاء والتحذيرات
```

### من الكود

```typescript
// MCP يعمل عبر Copilot Chat وليس مباشرة من الكود
// ولكن يمكنك استخدام النتائج في الكود:

import { querySelect, queryInsertBatch } from '@/lib/dbQuery';

// بعد استخدام MCP للتحقق من الأمان:
const tasks = await querySelect('tasks', { limit: 10 });
// الآن متأكد من أن البيانات آمنة!
```

---

## 🗄️ أدوات قاعدة البيانات

### 1. dbQuery - الاستعلامات المباشرة

```typescript
import {
  querySelect,
  queryInsert,
  queryInsertBatch,
  queryUpdate,
  queryDelete,
  queryCount,
  queryDatabaseStats,
  printDatabaseStats,
} from '@/lib/dbQuery';

// ✅ الاستعلام
const tasks = await querySelect('tasks', {
  filter: { status: 'completed' },
  limit: 10,
  orderBy: 'created_at',
  ascending: false,
});

// ✅ الإدراج
await queryInsert('tasks', {
  user_id: 'user-123',
  week_id: 'week-456',
  title: 'جديد',
  priority: 'high',
  day: 'monday',
  status: 'pending',
});

// ✅ الإدراج الجماعي
await queryInsertBatch('tasks', [
  { user_id: 'u1', title: 'task1' },
  { user_id: 'u1', title: 'task2' },
]);

// ✅ التحديث
await queryUpdate('tasks', 'task-id', { status: 'completed' });

// ✅ الحذف
await queryDelete('tasks', 'task-id');

// ✅ العد
const count = await queryCount('tasks');
const activeCount = await queryCount('tasks', { status: 'pending' });

// ✅ الإحصائيات
await printDatabaseStats();
```

### 2. dbSeeder - ملء البيانات

```typescript
import {
  generateCompleteDataset,
  generateWeekTasks,
  generateBrainDumps,
  generatePinnedTasks,
  printStats,
} from '@/lib/dbSeeder';

// ✅ إنشاء مجموعة بيانات كاملة
const dataset = generateCompleteDataset({
  userCount: 5,        // 5 مستخدمين
  weeksPerUser: 10,    // 10 أسابيع لكل مستخدم
  tasksPerWeek: 15,    // 15 مهمة لكل أسبوع
  brainDumpsPerUser: 5, // 5 brain dumps لكل مستخدم
  pinnedTasksPerUser: 5, // 5 مهام مثبتة لكل مستخدم
});

// ✅ عرض الإحصائيات
printStats(dataset);

// ✅ نقل البيانات إلى Supabase
await queryInsertBatch('weeks', dataset.weeks);
await queryInsertBatch('tasks', dataset.tasks);
await queryInsertBatch('brain_dump', dataset.brainDumps);
await queryInsertBatch('pinned_tasks', dataset.pinnedTasks);

// ✅ إنشاء مهام لأسبوع معين
const tasks = generateWeekTasks('user-123', 'week-456', 20);
await queryInsertBatch('tasks', tasks);

// ✅ إنشاء brain dumps
const dumps = generateBrainDumps('user-123', 5);
await queryInsertBatch('brain_dump', dumps);

// ✅ إنشاء مهام مثبتة
const pinnedTasks = generatePinnedTasks('user-123', 5);
await queryInsertBatch('pinned_tasks', pinnedTasks);
```

---

## 📚 أمثلة عملية

### مثال 1: فحص قاعدة البيانات

```typescript
import { printDatabaseStats } from '@/lib/dbQuery';

async function checkDatabase() {
  console.log('🔍 فحص قاعدة البيانات...\n');
  
  await printDatabaseStats();
  
  // المتوقع:
  // weeks: 45 records
  // tasks: 450 records
  // brain_dump: 25 records
  // pinned_tasks: 20 records
  // user_settings: 10 records
  // ai_settings: 10 records
  // ai_keys: 15 records
}
```

### مثال 2: إضافة مستخدم جديد مع بيانات

```typescript
import { queryInsertBatch } from '@/lib/dbQuery';
import { generateCompleteDataset } from '@/lib/dbSeeder';

async function addNewUser() {
  // 1. إنشاء بيانات للمستخدم الجديد
  const data = generateCompleteDataset({ userCount: 1 });
  
  // 2. إدراج الأسابيع
  await queryInsertBatch('weeks', data.weeks);
  
  // 3. إدراج المهام
  await queryInsertBatch('tasks', data.tasks);
  
  // 4. إدراج البيانات الأخرى
  await queryInsertBatch('brain_dump', data.brainDumps);
  await queryInsertBatch('pinned_tasks', data.pinnedTasks);
  
  console.log('✅ تم إضافة مستخدم جديد مع كل بيانته');
}
```

### مثال 3: الاستعلام والتصفية

```typescript
import { querySelect } from '@/lib/dbQuery';

async function getCompletedTasks(userId: string) {
  const tasks = await querySelect('tasks', {
    filter: { user_id: userId, status: 'completed' },
    orderBy: 'created_at',
    ascending: false,
    limit: 20,
  });
  
  console.log(`✅ عدد المهام المكتملة: ${tasks?.length}`);
  return tasks;
}

async function getHighPriorityTasks(userId: string) {
  const tasks = await querySelect('tasks', {
    filter: { user_id: userId, priority: 'high' },
    limit: 10,
  });
  
  console.log(`🔴 عدد المهام ذات الأولوية العالية: ${tasks?.length}`);
  return tasks;
}
```

### مثال 4: حلقة التطوير مع MCP

```typescript
// 1️⃣ توليد البيانات
const dataset = generateCompleteDataset({ userCount: 1 });

// 2️⃣ إدراج البيانات
await queryInsertBatch('weeks', dataset.weeks);
await queryInsertBatch('tasks', dataset.tasks);

// 3️⃣ التحقق من الأمان (MCP)
// في Copilot: "Check security advisors for the database"

// 4️⃣ التحقق من النتائج
const taskCount = await queryCount('tasks');
console.log(`✅ عدد المهام: ${taskCount}`);

// 5️⃣ مراقبة الأداء (MCP)
// في Copilot: "Show performance advisors"

// ✨ اكتمل!
```

---

## ⚙️ سير العمل

### سير عمل: إضافة ميزة جديدة

```
1. ✍️ كتابة الاختبارات
   └─ npm test

2. 🌱 ملء بيانات اختبار
   └─ const data = generateCompleteDataset(...)

3. 📊 إدراج البيانات
   └─ await queryInsertBatch('table', data)

4. 🔒 فحص الأمان (MCP)
   └─ في Copilot: "Check security advisors"

5. ⚡ مراقبة الأداء (MCP)
   └─ في Copilot: "Show performance advisors"

6. 📝 مراجعة السجلات (MCP)
   └─ في Copilot: "Show database logs"

7. ✅ دمج الكود
   └─ git commit
```

### سير عمل: استكشاف مشكلة

```
1. 🚨 اكتشاف مشكلة
   └─ في الإنتاج أو الاختبار

2. 📋 الاستعلام عن البيانات
   └─ const data = await querySelect('table', { ... })

3. 🔍 عرض السجلات (MCP)
   └─ في Copilot: "Show error logs for the last hour"

4. 🔒 فحص الأمان (MCP)
   └─ في Copilot: "Check if RLS policies are correct"

5. 🛠️ تصحيح المشكلة
   └─ تعديل الكود أو السياسات

6. ✅ اختبار الحل
   └─ npm test
```

---

## 🐛 استكشاف الأخطاء

### خطأ 1: متغيرات البيئة

```
❌ المشكلة:
Error: Missing Supabase env vars

✅ الحل:
1. تأكد من وجود .env.local
2. تحقق من VITE_SUPABASE_ANON_KEY
3. أعد تحميل Copilot (Reload Window)
```

### خطأ 2: MCP غير متوفر

```
❌ المشكلة:
MCP tools not available in Copilot

✅ الحل:
1. تحقق من .vscode/mcp.json
2. تحقق من SUPABASE_ACCESS_TOKEN
3. تحقق من SUPABASE_PROJECT_REF
```

### خطأ 3: فشل الاختبارات

```
❌ المشكلة:
Some tests failing

✅ الحل:
npm test -- --reporter=verbose  # اعرض التفاصيل
npm test -- src/lib/__tests__   # اختبر ملف معين
```

### خطأ 4: مشاكل البيانات

```
❌ المشكلة:
Data insertion failed

✅ الحل:
1. استخدم MCP للتحقق من الأمان (RLS)
2. استخدم queryCount للتحقق من البيانات
3. تحقق من السجلات: "Show database logs" (MCP)
```

---

## 📊 مقارنة الأدوات

| الميزة | dbQuery | dbSeeder | MCP |
|--------|---------|----------|-----|
| الاستعلامات المباشرة | ✅ | ❌ | ❌ |
| توليد البيانات | ❌ | ✅ | ❌ |
| فحص الأمان | ❌ | ❌ | ✅ |
| مراقبة الأداء | ❌ | ❌ | ✅ |
| عرض السجلات | ❌ | ❌ | ✅ |
| إدارة Migrations | ❌ | ❌ | ✅ |
| متوفر في Copilot | ❌ | ❌ | ✅ |

---

## 💡 أفضل الممارسات

### 1. استخدم الاختبارات أولاً

```typescript
// ✅ الطريقة الصحيحة
describe('Adding tasks', () => {
  it('should add task successfully', async () => {
    const task = await queryInsert('tasks', taskData);
    expect(task.id).toBeDefined();
  });
});
```

### 2. تحقق من الأمان بعد التعديلات

```typescript
// بعد إضافة بيانات:
// في Copilot: "Check security advisors"
```

### 3. استخدم البيانات العشوائية للاختبار

```typescript
// ✅ الطريقة الصحيحة
const dataset = generateCompleteDataset({ userCount: 5 });

// ❌ تجنب البيانات الثابتة
const hardcodedData = { id: '123' };
```

### 4. راقب الأداء

```typescript
// قبل الإطلاق:
// في Copilot: "Show performance advisors"
```

---

## 🎓 الدرس الكامل

### للمبتدئين

```bash
# 1. اقرأ هذا الدليل
# 2. شغّل الاختبارات
npm test

# 3. استكشف MCP في Copilot Chat
# 4. جرّب أمثلة بسيطة من dbQuery
```

### للمتقدمين

```bash
# 1. أتقن dbSeeder وdbQuery
# 2. استخدم MCP بكفاءة
# 3. اكتب اختبارات شاملة
# 4. راقب الأداء والأمان
```

---

## ✅ قائمة التحقق

- [x] تثبيت MCP ✅
- [x] تثبيت أدوات قاعدة البيانات ✅
- [x] كتابة 245 اختبار ✅
- [x] توثيق شاملة ✅
- [x] أمثلة عملية ✅
- [x] سير عمل محدد ✅
- [x] استكشاف أخطاء ✅

---

## 📞 الدعم

للمزيد من المعلومات:
- اقرأ [DATABASE_TESTING_GUIDE.md](./DATABASE_TESTING_GUIDE.md)
- استكشف ملفات الاختبار: `src/**/__tests__/*.test.ts`
- راجع أمثلة الكود: `src/lib/mcpDatabaseExamples.ts`

---

**آخر تحديث**: 23 أبريل 2026  
**الإصدار**: 1.0.0  
**الحالة**: ✅ جاهز للإنتاج
