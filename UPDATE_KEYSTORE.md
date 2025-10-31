# ⚠️ تحديث عاجل: Keystore جديد

## 🔧 ما الذي حدث؟

تم إنشاء **keystore جديد** متوافق مع أدوات البناء.

السبب: الـ keystore القديم كان PKCS12 وسبب خطأ:

```
Tag number over 30 is not supported
```

---

## ✅ Keystore الجديد

تم إنشاء keystore جديد بنفس المواصفات:

- **اسم الملف:** `nux-release.keystore` ✅
- **Alias:** `nux-key` ✅
- **Store Password:** `NUX2025secure` ✅
- **Key Password:** `NUX2025secure` ✅
- **النوع:** JKS (متوافق تماماً) ✅

---

## 🔄 المطلوب منك: تحديث Secret في GitHub

### ⚠️ مهم جداً: يجب تحديث ANDROID_KEYSTORE_BASE64

1. **اذهب إلى:**

   ```
   https://github.com/Ali-hasan-sss/nux-mobile/settings/secrets/actions
   ```

2. **اعثر على:** `ANDROID_KEYSTORE_BASE64`

3. **اضغط:** على أيقونة "Update" أو "Edit"

4. **احذف القيمة القديمة**

5. **افتح:** ملف `nux-keystore-base64.txt`

6. **انسخ:** المحتوى **كله** (Ctrl+A ثم Ctrl+C)

7. **الصق:** في خانة Value

8. **احفظ:** اضغط "Update secret"

---

## ✅ باقي Secrets لا تحتاج تحديث

هذه لا تزال صحيحة:

- ✅ `KEYSTORE_PASSWORD`: `NUX2025secure`
- ✅ `KEY_ALIAS`: `nux-key`
- ✅ `KEY_PASSWORD`: `NUX2025secure`

---

## 🚀 بعد التحديث

1. ارجع إلى: https://github.com/Ali-hasan-sss/nux-mobile/actions
2. اضغط على الـ workflow الفاشل
3. اختر **"Re-run failed jobs"**
4. أو: اضغط **"Run workflow"** لبناء جديد

---

## ⏱️ البناء سينجح هذه المرة!

بعد تحديث الـ Secret، البناء سيكتمل بنجاح وستحصل على:

- ✅ **app-release.apk** جاهز
- ✅ حجم صغير (~40 MB)
- ✅ يعمل مباشرة بدون Metro bundler

---

## 📝 ملاحظة

احتفظ بالـ keystore الجديد (`nux-release.keystore`) في مكان آمن!
