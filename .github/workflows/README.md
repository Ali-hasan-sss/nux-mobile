# 📱 Android Build Workflows

## 🚀 كيفية بناء APK

### الطريقة 1: تشغيل يدوي (موصى به)

1. اذهب إلى: [Actions](../../actions)
2. اختر **"Build Android APK (Local)"**
3. اضغط **"Run workflow"**
4. اختر نوع البناء:
   - **debug** → للتطوير والاختبار (بدون توقيع)
   - **release** → للإنتاج (يحتاج keystore في Secrets)
5. انتظر ~10-15 دقيقة
6. حمّل APK من **Artifacts**

### الطريقة 2: بناء تلقائي

البناء يعمل تلقائياً عند:

- Push إلى `main` أو `master`
- سيبني **debug APK** افتراضياً

---

## 📥 تحميل APK

بعد اكتمال البناء:

1. افتح صفحة الـ workflow المكتمل
2. مرّر للأسفل إلى **"Artifacts"**
3. اضغط على **"app-debug.apk"** للتحميل
4. انقل الملف إلى هاتف Android وثبّته

---

## 🔐 إعداد Release Build

لبناء نسخة Release موقّعة:

### 1. إنشاء Keystore

```bash
keytool -genkey -v -keystore release.keystore \
  -alias my-key-alias -keyalg RSA -keysize 2048 \
  -validity 10000
```

### 2. تحويل Keystore إلى Base64

```bash
# Linux/Mac
base64 release.keystore > keystore.base64.txt

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("release.keystore")) > keystore.base64.txt
```

### 3. إضافة Secrets في GitHub

اذهب إلى: **Settings** → **Secrets and variables** → **Actions**

أضف:

- `ANDROID_KEYSTORE_BASE64`: محتوى ملف keystore.base64.txt
- `KEYSTORE_PASSWORD`: كلمة سر الـ keystore
- `KEY_ALIAS`: اسم المفتاح (مثل: my-key-alias)
- `KEY_PASSWORD`: كلمة سر المفتاح

---

## ⚙️ التفاصيل التقنية

- **Build Time**: 10-15 دقيقة
- **Runner**: Ubuntu Latest
- **Node**: v20
- **Java**: 17 (Temurin)
- **Build Tool**: Gradle + Expo Prebuild

---

## 🐛 حل المشاكل

### البناء فشل في `expo prebuild`

- تأكد من أن `package.json` يحتوي على جميع dependencies

### البناء فشل في `assembleRelease`

- تأكد من إضافة جميع Secrets المطلوبة
- تأكد من صحة keystore password

### APK لا يعمل على الهاتف

- استخدم debug build للاختبار
- تأكد من تفعيل "Install from unknown sources"

---

## 📚 مصادر إضافية

- [Expo Prebuild Docs](https://docs.expo.dev/workflow/prebuild/)
- [Android Signing Guide](https://developer.android.com/studio/publish/app-signing)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
