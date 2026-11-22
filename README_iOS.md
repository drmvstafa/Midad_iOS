# مداد للآيفون والآيباد — Midad iOS

يوفّر هذا المجلد نسختين للآيفون والآيباد بدون التعديل على نسخة الأندرويد:

## 1) التثبيت كـ تطبيق ويب (PWA) فوراً من متصفح Safari (بدون Mac أو كابل)
تمت تهيئة ملفات الويب (`index.html` و`manifest.webmanifest` و`apple-touch-icon.png` ومساحات الحافة الآمنة `env(safe-area-inset-*)`):
1. افتح رابط موقع الويب الخاص بمداد من **Safari** على الآيفون.
2. اضغط على زر **مشاركة (Share)** أسفل المتصفح.
3. اختر **إضافة إلى الشاشة الرئيسية (Add to Home Screen)**.
4. سيظهر **مداد** بأيقونته الكاملة كتطبيق مستقل بدون شريط متصفح.

## 2) بناء ملف تطبيق الآيفون الأصلي (`Midad-iOS.ipa`)
> ملاحظة: ترجمة كود Swift وإنشاء ملف `.ipa` يتطلب بيئة **macOS / Xcode** (سواء على جهاز Mac أو عبر GitHub Actions السحابي مجاناً).

### الطريقة الأسهل (تلقائياً عبر GitHub Actions بدون جهاز Mac):
1. ارفع محتويات مجلد `Midad_iOS` إلى مستودع GitHub خاص أو عام.
2. افتح تبويب **Actions** وشغّل **Build Midad iOS (.ipa)** (يستخدم ملف `.github/workflows/build-ios.yml`).
3. بعد اكتمال البناء (دقيقتين تقريباً)، حمّل ملف **`Midad-iOS-IPA`** الذي يحتوي على `Midad-iOS.ipa`.
4. ثبّت الـ `.ipa` على الآيفون مباشرة باستخدام **AltStore** أو **SideStore** أو **Sideloadly**.

### الطريقة المباشرة على جهاز Mac (Xcode):
```bash
brew install xcodegen
cd Midad_iOS
xcodegen generate
open Midad.xcodeproj
```
ثم اختر جهازك في Xcode واضغط **Run (⌘R)**.

## المزايا المدمجة في الكود الأصلي (`Sources/`)
- `MidadBridge.swift`: جسر `WKWebView` متكامل لـ `URLSession` (تجاوز قيود المتصفح للبحث في جميع المصادر الـ 24+)، ومدير تحميل أوفلاين في مجلد `Files -> مداد` (`UIFileSharingEnabled`)، ومشغل صوتي للكتب المسموعة بالخلفية مع أزرار شاشة القفل (`MPNowPlayingInfoCenter`)، واستيراد الكتب من تطبيق الملفات.
- `MidadReaderViewController.swift`: قارئ `PDFKit` + رسم وتظليل عبر `PencilKit` (قلم، ماركر، ممحاة، تراجع/إعادة)، 4 مظاهر قراءة (`نهاري`، `ورق دافئ`، `مريح`، `داكن`)، علامات مرجعية وحفظ الصفحة تلقائياً.
