// ═══════════════════════════════════════════════════════════════
//  🔑 تنظیمات Supabase
//
//  📌 راهنمای راه‌اندازی:
//  1. یک پروژه در https://supabase.com بساز
//  2. برو به: Project Settings → API
//  3. مقادیر زیر رو کپی کن و جایگزین کن:
//     • Project URL       → SUPABASE_URL
//     • anon public key   → SUPABASE_ANON_KEY
//
//  ⚠️ نکته امنیتی مهم:
//  فقط از کلید "anon public" استفاده کن.
//  هرگز از "service_role" استفاده نکن!
// ═══════════════════════════════════════════════════════════════

window.SUPABASE_URL      = 'YOUR_SUPABASE_URL_HERE';
window.SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';


// ═══════════════════════════════════════════════════════════════
//  ⚙️ تنظیمات برنامه
// ═══════════════════════════════════════════════════════════════

// نام برنامه
window.APP_NAME = 'پیام‌رسان';

// حداکثر حجم فایل برای آپلود (مگابایت)
window.MAX_FILE_MB = 500;

// دامنه ساختگی برای تبدیل username به ایمیل
// (Supabase با ایمیل کار می‌کنه، پس از این دامنه استفاده می‌کنیم)
window.EMAIL_DOMAIN = 'messenger.local';