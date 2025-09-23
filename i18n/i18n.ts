import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      home: {
        title: "Welcome to NUX",
        scanCode: "Scan QR Code",
        scanCodeDesc: "Scan restaurant QR codes to earn points",
        payWallet: "Pay with Wallet",
        noBalances: "No Balances Found",
        noBalancesDesc:
          "Visit restaurants and scan their QR codes to earn points",
      },
      restaurant: {
        mealsCode: "Meals QR Code",
        drinksCode: "Drinks QR Code",
      },
      payment: {
        paymentAmount: "Payment Amount",
        selectPaymentMethod: "Select Payment Method",
        confirmPayment: "Confirm Payment",
        currentBalance: "Current Balance",
        insufficientBalance: "Insufficient balance",
        paymentSuccessful: "Payment successful",
        selectedMethod: "Selected Method",
        processingPayment: "Processing payment...",
        selectRestaurantFirst: "Please select a restaurant first",
        noBalanceData: "No balance data available for this restaurant",
        enterValidAmount: "Please enter a valid amount",
      },
      notifications: {
        title: "Notifications",
      },
      camera: {
        placeCodeInFrame: "Place QR code in frame",
      },
      purchase: {
        mealPoints: "Meal Points",
        drinkPoints: "Drink Points",
        walletBalance: "Wallet Balance",
      },
      auth: {
        email: "Email",
        password: "Password",
        agreeToTerms: "I agree to the",
        privacyPolicy: "Privacy Policy",
        termsOfUse: "Terms of Use",
        loginButton: "Login",
        noAccount: "Don't have an account?",
        register: "Register",
      },
      drawer: {
        privacyPolicy: "Privacy Policy",
        termsOfUse: "Terms of Use",
      },
      common: {
        and: "and",
        error: "Error",
        success: "Success",
      },
    },
  },
  ar: {
    translation: {
      home: {
        title: "مرحباً بك في NUX",
        scanCode: "مسح الكود",
        scanCodeDesc: "امسح أكواد المطاعم لكسب النقاط",
        payWallet: "الدفع بالمحفظة",
        noBalances: "لا توجد أرصدة",
        noBalancesDesc: "قم بزيارة المطاعم وامسح أكوادها لكسب النقاط",
      },
      restaurant: {
        mealsCode: "كود الوجبات",
        drinksCode: "كود المشروبات",
      },
      payment: {
        paymentAmount: "مبلغ الدفع",
        selectPaymentMethod: "اختر طريقة الدفع",
        confirmPayment: "تأكيد الدفع",
        currentBalance: "الرصيد الحالي",
        insufficientBalance: "رصيد غير كافي",
        paymentSuccessful: "تم الدفع بنجاح",
        selectedMethod: "الطريقة المختارة",
        processingPayment: "جاري معالجة الدفع...",
        selectRestaurantFirst: "يرجى اختيار مطعم أولاً",
        noBalanceData: "لا توجد بيانات رصيد متاحة لهذا المطعم",
        enterValidAmount: "يرجى إدخال مبلغ صحيح",
      },
      notifications: {
        title: "الإشعارات",
      },
      camera: {
        placeCodeInFrame: "ضع رمز QR في الإطار",
      },
      purchase: {
        mealPoints: "نقاط الوجبات",
        drinkPoints: "نقاط المشروبات",
        walletBalance: "رصيد المحفظة",
      },
      auth: {
        email: "البريد الإلكتروني",
        password: "كلمة المرور",
        agreeToTerms: "أوافق على",
        privacyPolicy: "سياسة الخصوصية",
        termsOfUse: "شروط الاستخدام",
        loginButton: "تسجيل الدخول",
        noAccount: "ليس لديك حساب؟",
        register: "إنشاء حساب",
      },
      drawer: {
        privacyPolicy: "سياسة الخصوصية",
        termsOfUse: "شروط الاستخدام",
      },
      common: {
        and: "و",
        error: "خطأ",
        success: "نجح",
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    debug: __DEV__,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
