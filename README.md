# 💬 پیام‌رسان

پیام‌رسان کامل با **Supabase** + **JavaScript خالص** — بدون build، بدون framework، بدون npm.

## ✨ امکانات

- ✅ ثبت‌نام و ورود با نام کاربری
- ✅ چت خصوصی (Private)
- ✅ گروه (قفل / آزاد / عمومی)
- ✅ کانال
- ✅ پیام متنی
- ✅ تصویر، ویدیو، **🎤 پیام صوتی**، فایل
- ✅ حذف پیام برای من / برای همه
- ✅ کپی پیام
- ✅ جستجوی کاربران و گروه‌های عمومی
- ✅ عضویت با یک کلیک در گروه/کانال عمومی
- ✅ آواتار برای کاربر، گروه، کانال
- ✅ تغییر نام کاربر / گروه / کانال
- ✅ تم روشن و تاریک 🌙
- ✅ ریسپانسیو کامل (موبایل + دسکتاپ)
- ✅ نوتیفیکیشن مرورگر 🔔
- ✅ Realtime (پیام‌ها لحظه‌ای)
- ✅ ضبط و ارسال پیام صوتی 🎤
- ✅ حذف کامل حساب کاربری 🗑️

## 🛠️ تکنولوژی

- **Frontend:** HTML + CSS + Vanilla JavaScript
- **Backend:** Supabase (Auth + Database + Storage + Realtime)
- **Deploy:** GitHub Pages

## 🚀 راه‌اندازی

### قدم ۱: پروژه Supabase

1. برو به [supabase.com](https://supabase.com) و یک پروژه بساز
2. برو به **SQL Editor** و کد SQL موجود در پروژه رو اجرا کن
3. **Authentication → Providers → Email** رو فعال کن
4. مطمئن شو **Confirm email** خاموشه
5. در **Storage** دو باکت بساز:
   - `avatars` (Public ✅)
   - `media` (Public ✅)

### قدم ۲: تنظیم `config.js`

از **Project Settings → API** این دو مقدار رو کپی کن:

```js
window.SUPABASE_URL      = 'https://xxxxx.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGc...';