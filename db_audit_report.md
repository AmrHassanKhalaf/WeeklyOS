# WeeklyOS — Database Full Audit Report
> Generated: 2026-05-29

---

## 🔴 CRITICAL — Security Issues

### 1. Storage Bucket `voice-responses` — PUBLIC with no auth protection
- **Status:** ❌ **خطر فعلي**
- **Problem:** البكت `voice-responses` مضبوط على `public = true` — يعني **أي شخص في العالم** يقدر يقرأ أي ملف فيه بدون authentication. فيه **72 ملف** محمّلين دلوقتي.
- **RLS Policy:** فيه policy واحدة بس للـ INSERT — لا يوجد DELETE، لا يوجد SELECT restriction، لا يوجد size limit، لا يوجد MIME type restriction.
- **The bucket name implies voice recordings** — ده بيانات حساسة.
- **Fix:** غيّر البكت لـ `public = false` + أضف RLS policies صحيحة ← **يحتاج تدخل يدوي من Dashboard**

### 2. `set_updated_at()` — Mutable Search Path (SECURITY DEFINER missing)
- **Status:** ⚠️ **تحذير من Supabase Advisor**
- **Problem:** الفانكشن `public.set_updated_at()` ليس لها `SET search_path = 'public'` — ممكن يتم استغلالها بـ search_path injection لو أي extension تعاكست.
- **Fix:** ← **تُطبَّق تلقائياً في هذا الـ migration**

### 3. Leaked Password Protection — Disabled
- **Status:** ⚠️ **تحذير من Supabase Auth Advisor**
- **Problem:** Supabase Auth مش بيشيك على HaveIBeenPwned — ممكن مستخدمين يسجلوا بكلمات مرور مسربة.
- **Fix:** ← **يحتاج تفعيل يدوي من Dashboard** (Auth → Password Settings → Enable leaked password protection)

---

## 🟠 HIGH — RLS Policy Gaps

### 4. `user_settings` — Policy واحدة بدون تحديد CMD
- **Problem:** فيه policy واحدة `"Users can manage their own settings"` — لكن مش واضح هي بتغطي INSERT/UPDATE/SELECT/DELETE كلهم ولا لأ. لو هي `ALL` فده مقبول، لو لأ فيه ثغرة.
- **Fix:** ← **تُطبَّق تلقائياً — split لـ 4 explicit policies**

### 5. `focus_sessions` — Policy واحدة بدون تحديد CMD
- **نفس المشكلة:** `"Users can manage their own focus sessions"` — policy `ALL` واحدة بدون `with_check`.
- **Fix:** ← **تُطبَّق تلقائياً — explicit policies**

---

## 🟡 MEDIUM — Orphaned / Dead Objects

### 6. Storage Bucket `voice-responses` — لا يوجد استخدام في الكود
- **Problem:** البكت موجود وفيه 72 ملف، لكن مفيش أي reference لـ `voice-responses` في الـ source code كله. الـ voice feature في AIWorkspace بتعمل recording بس مش بتحفظ في storage.
- **Impact:** 72 ملف مكشوفة للعالم بدون أي وظيفة في التطبيق.
- **Fix:** ← **يحتاج قرار يدوي: هل تحذف الملفات؟ هل البكت ده من feature قديمة؟**

### 7. Column `habits.difficulty` — موجود ومش مستخدم أبدًا
- **Problem:** كل الصفوف = `'medium'` (القيمة الافتراضية). الكود لا يقرأ ولا يكتب فيه.
- **Impact:** صفر — مجرد مساحة زيادة.
- **Fix:** ← **تُطبَّق تلقائياً — DROP COLUMN**

---

## 🔵 INFO — Unused Indexes (Low Risk, Space Overhead)

كل الـ indexes دي `idx_scan = 0` — لأن الـ stats اتعملت reset مع كل migration جديد. **الـ indexes دي صح وهتتستخدم مع الوقت** — ماحتاجش تمسحها.

| Index | Table | Decision |
|---|---|---|
| `idx_tasks_user_status` | tasks | ✅ اتبقى — query pattern موجود |
| `idx_tasks_pinned_task_id` | tasks | ✅ اتبقى — FK join |
| `habit_completions_habit_id_day_month_year_key` | habit_completions | ✅ UNIQUE constraint — لا تُمسح |
| `idx_habit_completions_user_id` | habit_completions | ✅ اتبقى — user filter |
| `idx_pinned_tasks_user_active` | pinned_tasks | ✅ اتبقى |
| `ai_keys_user_provider_unique` | ai_keys | ✅ UNIQUE constraint |
| `idx_ai_tool_permissions_mode` | ai_tool_permissions | ✅ اتبقى |
| `idx_focus_sessions_task_id` | focus_sessions | ✅ اتبقى |
| `idx_user_feedback_user_id` | user_feedback | ✅ اتبقى |
| AI tables indexes | ai_runs, ai_telemetry, etc. | ✅ جديدة — ستُستخدم |

---

## ✅ ما تم إصلاحه تلقائياً في هذا الـ Audit

1. `set_updated_at()` — أضفنا `SET search_path`
2. `user_settings` — explicit policies
3. `focus_sessions` — explicit policies  
4. `habits.difficulty` — DROP COLUMN
5. Storage bucket — تحذير وتعليمات يدوية

---

## 📋 ما يحتاج تدخل يدوي منك

| الإجراء | المكان | الأولوية |
|---|---|---|
| تغيير `voice-responses` لـ private | Supabase Dashboard → Storage → Bucket Settings | 🔴 فوري |
| تفعيل Leaked Password Protection | Supabase Dashboard → Auth → Password | 🟠 قريب |
| قرار: هل تمسح الـ 72 ملف في `voice-responses`؟ | Supabase Dashboard → Storage → Browse | 🟡 قريب |
