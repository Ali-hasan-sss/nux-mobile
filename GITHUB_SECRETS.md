# 🔐 GitHub Secrets المطلوبة للبناء

قبل تشغيل بناء التطبيق، يجب إضافة هذه الـ Secrets في GitHub.

---

## 📍 رابط الإضافة السريع

```
https://github.com/Ali-hasan-sss/nux-mobile/settings/secrets/actions
```

---

## ✅ الـ Secrets المطلوبة (4 secrets)

### 1️⃣ ANDROID_KEYSTORE_BASE64

**الوصف:** ملف keystore محول إلى base64

**كيفية الحصول عليه:**

- افتح ملف `nux-keystore-base64.txt` بالـ Notepad
- انسخ **كل** المحتوى (نص طويل جداً)
- الصقه في GitHub Secret

**في GitHub:**

- **Name:** `ANDROID_KEYSTORE_BASE64`
- **Value:** [المحتوى من الملف]

---

### 2️⃣ KEYSTORE_PASSWORD

**الوصف:** كلمة سر الـ keystore

**في GitHub:**

- **Name:** `KEYSTORE_PASSWORD`
- **Value:** `NUX2025secure`

---

### 3️⃣ KEY_ALIAS

**الوصف:** اسم المفتاح داخل الـ keystore

**في GitHub:**

- **Name:** `KEY_ALIAS`
- **Value:** `nux-key`

---

### 4️⃣ KEY_PASSWORD

**الوصف:** كلمة سر المفتاح

**في GitHub:**

- **Name:** `KEY_PASSWORD`
- **Value:** `NUX2025secure`

---

## 🚀 بعد إضافة جميع الـ Secrets

1. اذهب إلى: https://github.com/Ali-hasan-sss/nux-mobile/actions
2. ستبدأ عملية البناء **تلقائياً** عند push
3. أو اضغط "Run workflow" لتشغيل يدوي
4. انتظر ~10-15 دقيقة
5. حمّل `app-release.apk` من Artifacts

---

## ⚠️ ملاحظات مهمة

- ✅ يجب إضافة **جميع** الـ 4 Secrets
- ✅ تأكد من نسخ base64 **كاملاً** بدون مسافات زائدة في البداية/النهاية
- ✅ الأسماء يجب أن تكون **بالضبط** كما هو مكتوب (حساسة لحالة الأحرف)
- ❌ لا تشارك هذه Secrets مع أحد
- ❌ لا تضعها في الكود

---

## ✅ Checklist قبل البناء

- [ ] أضفت `ANDROID_KEYSTORE_BASE64`
- [ ] أضفت `KEYSTORE_PASSWORD`
- [ ] أضفت `KEY_ALIAS`
- [ ] أضفت `KEY_PASSWORD`
- [ ] احتفظت بنسخة من `nux-release.keystore` في مكان آمن
- [ ] رفعت الكود إلى GitHub

---

## 🎯 الخطوة التالية

بعد إضافة جميع Secrets، ارفع الكود:

```bash
git add .
git commit -m "Configure release build workflow"
git push origin main
```

سيبدأ البناء تلقائياً! 🎉
