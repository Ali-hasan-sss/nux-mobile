# بناء التطبيق عبر EAS (Android APK + iOS)

المشروع: `mobile_app_new` — Expo SDK 54، معرّف EAS: `8a2d5ea2-4dde-4d25-a325-6d9c24784488` (`@alihasan_123/nux-app`).

## المتطلبات

1. حساب [Expo](https://expo.dev) (المالك في `app.json`: `alihasan_123`).
2. Node.js 20+.
3. من مجلد التطبيق:

```bash
cd mobile_app_new
npm ci
```

4. تسجيل الدخول:

```bash
npm run eas:login
# أو: npx eas login
```

## متغيرات البيئة (مهم للبناء)

على خوادم EAS لا يُرفع ملف `.env`. استخدم أحد الخيارين:

### أ) أسرار EAS (موصى به للفريق)

من مجلد `mobile_app_new`:

```bash
eas secret:create --name EXPO_PUBLIC_API_URL --value "https://back.nuxapp.de/api" --type string
eas secret:create --name EXPO_PUBLIC_WEBSITE_URL --value "https://nuxapp.de" --type string
eas secret:create --name EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY --value "pk_..." --type string
eas secret:create --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "....apps.googleusercontent.com" --type string
eas secret:create --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value "....apps.googleusercontent.com" --type string
eas secret:create --name GOOGLE_MAPS_API_KEY --value "AIza..." --type string
# iOS Google Sign-In (اختياري):
eas secret:create --name GOOGLE_IOS_URL_SCHEME --value "com.googleusercontent.apps.xxxxx" --type string
eas secret:create --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value "....apps.googleusercontent.com" --type string
```

### ب) القيم الافتراضية في `config/build-time-env.js`

تُحمَّل تلقائياً عبر `app.config.js` عندما لا يوجد سر EAS (مناسب لمستودع خاص).

في `eas.json` مفعّل `EXPO_NO_DOTENV=1` حتى لا يعتمد البناء على `.env` المحلي.

## دعم إصدارات Android

- **الحد الأدنى:** Android 7.0 (Nougat) — `minSdkVersion: 24` عبر `expo-build-properties` في `app.config.js`.
- **الهياكل (ABI):** `armeabi-v7a`, `arm64-v8a`, `x86`, `x86_64` (من `android/gradle.properties`).

## ملفات البناء (`eas.json`)

| الملف الشخصي | الاستخدام |
|--------------|-----------|
| `preview` | APK أندرويد + iOS للاختبار الداخلي (الخطوة الأولى) |
| `preview-simulator` | iOS للمحاكي فقط (بدون حساب Apple للأجهزة) |
| `development` | Dev client + APK / محاكي iOS |
| `production` | AAB للمتجر + iOS للإنتاج (`autoIncrement`) |

## EAS Update (قنوات preview / production)

مُفعَّل عبر `expo-updates` في `app.json`. مع مجلد `android/` (bare workflow) يجب أن يكون `runtimeVersion` نصاً ثابتاً (مثل `"1.0.0"`) وليس `policy: appVersion`. عند تغييرات native أو رفع `version`، حدّث `runtimeVersion` و`EXPO_RUNTIME_VERSION` في `AndroidManifest.xml` معاً.

## 1) معاينة Android (APK) — ابدأ هنا

```bash
cd mobile_app_new
npm run eas:build:preview:android
```

أو:

```bash
npx eas build --platform android --profile preview
```

- أول مرة: EAS يطلب إنشاء **keystore** للتوقيع — اختر **Let EAS handle credentials**.
- بعد اكتمال البناء: حمّل الـ APK من [expo.dev](https://expo.dev) → المشروع → Builds.
- ثبّت على الجهاز (تفعيل «مصادر غير معروفة» إن لزم).

### Google Sign-In / Maps بعد البناء

أضف **SHA-1** من EAS إلى Google Cloud (OAuth Android + تقييد Maps):

```bash
eas credentials -p android
```

انسخ SHA-1 لملف التوقيع `preview` / `production`.

## 2) معاينة iOS

### خطأ Apple 403 / PLA / «Failed to register bundle identifier»

وجود `com.lolity.app` في **Identifiers** لا يكفي — EAS يستدعي واجهة Apple وقد تُرفض الطلبات إذا:

1. **الفريق غير متطابق:** افتح [Identifiers → com.lolity.app](https://developer.apple.com/account/resources/identifiers/list) وتأكد أن **Team** = Genix Tech GmbH (`KJMV8KSP3T`). إن كان الـ Bundle تحت فريق آخر، انقله أو غيّر `ios.appleTeamId` في `app.json`.
2. **اتفاقيات App Store Connect (ليس دائماً تنبيهاً على developer.apple.com):**
   - [App Store Connect → Agreements, Tax, and Banking](https://appstoreconnect.apple.com/agreements)
   - وافق على **Apple Developer Program License Agreement** وأي **Paid Applications** / **Free Applications** معلّقة.
   - يجب أن يفعل ذلك **Account Holder** (مالك الحساب)، وليس Admin/Developer فقط.
3. **بعد الموافقة:** انتظر 15–60 دقيقة، ثم:
   ```bash
   eas logout
   eas login
   npm run eas:credentials
   ```
   اختر iOS → **Build Credentials** → دع EAS يستخدم Bundle ID الموجود دون «إنشاء» جديد.
4. **إنشاء التطبيق في ASC (اختياري لكن مفيد):** App Store Connect → Apps → + → Bundle ID `com.lolity.app`.
5. **لا يزال 403:** من حساب Account Holder: [Contact Apple Developer Support](https://developer.apple.com/contact/) واذكر Team ID `KJMV8KSP3T` ورسالة PLA.

**محاكي فقط (بدون Apple API للـ Bundle):** `npm run eas:build:preview:ios-simulator`

### خطأ iOS: `ExpoReactDelegate has no member 'reactNativeFactory'`

سبب شائع: حزم غير متوافقة مع SDK 54 (مثل `expo-clipboard@55` بدل `~8.0.8`، أو `expo-dev-client` قديم).

```bash
cd mobile_app_new
npm install
npx expo install --fix
npx expo install expo-linking react-native-screens react-native-svg
```

ثم أعد البناء. تم ضبط `ios.buildReactNativeFromSource: true` في `expo-build-properties` لتوافق Xcode 26 على EAS.

يتطلب **Apple Developer Program** للتثبيت على أجهزة حقيقية (`preview`).

```bash
npm run eas:build:preview:ios
```

أو للمحاكي فقط (Mac + Xcode، بدون جهاز):

```bash
npm run eas:build:preview:ios-simulator
```

- أول مرة: `eas build` يوجّهك لربط **Apple Team** وشهادات التوقيع (يُفضّل Let EAS manage).
- التوزيع الداخلي: رابط تثبيت من لوحة Expo أو TestFlight حسب الإعداد.

## 3) الإنتاج (لاحقاً)

```bash
npm run eas:build:production:android   # AAB لـ Google Play
npm run eas:build:production:ios
```

رفع المتاجر:

```bash
eas submit --platform android --profile production
eas submit --platform ios --profile production
```

## أوامر مفيدة

```bash
npm run eas:credentials          # إدارة المفاتيح والشهادات
eas build:list                 # آخر البناءات
eas build:cancel               # إلغاء بناء جارٍ
```

## استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| Maps / Stripe / API لا تعمل في APK | تحقق من أسرار EAS أو `config/build-time-env.js` |
| Google Sign-In يفشل | أضف SHA-1 من `eas credentials` في Google Cloud |
| iOS: No bundle identifier | مضبوط: `com.lolity.app` في `app.json` |
| البناء من جذر المستودع | نفّذ الأوامر داخل `mobile_app_new` فقط |

## مرجع

- [EAS Build](https://docs.expo.dev/build/introduction/)
- [expo-build-properties](https://docs.expo.dev/versions/latest/sdk/build-properties/)
- `.env.example` — قائمة المتغيرات
