# 📱 دليل بناء نسخة Release

## 🔐 معلومات الـ Keystore

تم إنشاء keystore للتوقيع على التطبيق:

- **اسم الملف:** `nux-release.keystore`
- **Alias:** `nux-key`
- **Store Password:** `NUX2025secure`
- **Key Password:** `NUX2025secure`
- **صلاحية:** 10,000 يوم (~27 سنة)

⚠️ **مهم جداً:** احتفظ بالـ keystore وكلمات السر في مكان آمن! إذا فقدتها لن تستطيع تحديث التطبيق على المتاجر.

---

## 📝 خطوات إضافة Secrets في GitHub

### 1. افتح إعدادات Repository

اذهب إلى:

```
https://github.com/Ali-hasan-sss/nux-mobile/settings/secrets/actions
```

أو من صفحة المشروع:

- **Settings** → **Secrets and variables** → **Actions**

---

### 2. أضف الـ Secrets التالية

اضغط **"New repository secret"** لكل secret:

#### Secret 1: ANDROID_KEYSTORE_BASE64

- **Name:** `ANDROID_KEYSTORE_BASE64`
- **Value:** محتوى ملف `nux-keystore-base64.txt`
  - افتح الملف بالـ Notepad
  - انسخ المحتوى **كاملاً** (نص طويل)
  - الصقه في Value

#### Secret 2: KEYSTORE_PASSWORD

- **Name:** `KEYSTORE_PASSWORD`
- **Value:** `NUX2025secure`

#### Secret 3: KEY_ALIAS

- **Name:** `KEY_ALIAS`
- **Value:** `nux-key`

#### Secret 4: KEY_PASSWORD

- **Name:** `KEY_PASSWORD`
- **Value:** `NUX2025secure`

---

## 🚀 بناء نسخة Release

بعد إضافة جميع Secrets:

### الطريقة 1: من واجهة GitHub (موصى به)

1. اذهب إلى: https://github.com/Ali-hasan-sss/nux-mobile/actions
2. اختر **"Build Android APK (Local)"**
3. اضغط **"Run workflow"**
4. من القائمة المنسدلة، اختر: **release** ⚠️
5. اضغط **"Run workflow"** الأخضر
6. انتظر ~10-15 دقيقة
7. حمّل **app-release.apk** من Artifacts

### الطريقة 2: تلقائياً عند Push

يمكنك تغيير الإعداد الافتراضي في `build-apk.yml`:

```yaml
default: "release" # بدلاً من "debug"
```

---

## ✅ مميزات نسخة Release

- ✅ **حجم أصغر** (~50% من debug)
- ✅ **أداء أفضل** (محسّن ومضغوط)
- ✅ **لا يطلب Metro bundler**
- ✅ **جاهزة للنشر** على Play Store
- ✅ **موقّعة** بشكل آمن

---

## 📊 مقارنة Debug vs Release

| الميزة        | Debug    | Release    |
| ------------- | -------- | ---------- |
| الحجم         | ~80 MB   | ~40 MB     |
| السرعة        | بطيء     | سريع       |
| Metro bundler | ✅ يظهر  | ❌ لا يظهر |
| Source maps   | ✅ مضمّن | ❌ منفصل   |
| للنشر         | ❌       | ✅         |

---

## 🔒 أمان الـ Keystore

**احتفظ بهذه الملفات في مكان آمن:**

- ✅ `nux-release.keystore`
- ✅ كلمات السر

**لا تشارك:**

- ❌ لا تضع keystore في Git
- ❌ لا تشارك كلمات السر علناً
- ❌ لا تحذف keystore الأصلي

---

## 🐛 حل المشاكل

### البناء فشل في Gradle

- تأكد من إضافة **جميع** الـ 4 Secrets
- تأكد من نسخ base64 **كاملاً** بدون مسافات زائدة

### APK لا يعمل

- تأكد من اختيار **release** وليس debug
- تأكد من صحة الـ Secrets

### نسيت كلمة السر

- لا يمكن استرجاعها
- يجب إنشاء keystore جديد
- لن تستطيع تحديث التطبيق على المتاجر (يجب تطبيق جديد)

---

## 📚 المزيد من المعلومات

- [Android App Signing](https://developer.android.com/studio/publish/app-signing)
- [Expo Build Process](https://docs.expo.dev/build/introduction/)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
