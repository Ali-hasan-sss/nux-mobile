/**
 * Script to generate app icons and splash screen from logo
 * 
 * Usage: node scripts/generate-icons.js
 * 
 * Requirements:
 * - Install sharp: npm install sharp --save-dev
 * - Logo file should be at: assets/images/logo.png
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('❌ Error: sharp is not installed.');
  console.log('📦 Please install it by running: npm install sharp --save-dev');
  process.exit(1);
}

const logoPath = path.join(__dirname, '../assets/images/logo.png');
const assetsDir = path.join(__dirname, '../assets');

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Check if logo exists
if (!fs.existsSync(logoPath)) {
  console.error(`❌ Logo not found at: ${logoPath}`);
  process.exit(1);
}

console.log('🎨 Starting icon generation...');

async function generateIcons() {
  try {
    // Read the logo
    const logo = sharp(logoPath);
    const metadata = await logo.metadata();
    console.log(`📐 Logo dimensions: ${metadata.width}x${metadata.height}`);

    // Generate icon.png (1024x1024) — logo ~75% for clarity on home screen
    const ICON_LOGO_RATIO = 0.75;
    const ADAPTIVE_LOGO_RATIO = 0.62; // Android adaptive safe zone
    const SPLASH_LOGO_RATIO = 0.54;
    const BG = { r: 26, g: 31, b: 58, alpha: 1 }; // #1A1F3A

    async function compositeLogo(canvasSize, logoRatio, outFile, label) {
      const logoPx = Math.round(canvasSize * logoRatio);
      const logoBuf = await logo
        .resize(logoPx, logoPx, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toBuffer();

      await sharp({
        create: {
          width: canvasSize,
          height: canvasSize,
          channels: 4,
          background: BG,
        },
      })
        .composite([{ input: logoBuf, gravity: "center" }])
        .png()
        .toFile(outFile);
      console.log(`✅ ${label} created`);
    }

    console.log("📱 Generating icon.png (1024x1024)...");
    await compositeLogo(
      1024,
      ICON_LOGO_RATIO,
      path.join(assetsDir, "icon.png"),
      "icon.png"
    );

    console.log("📱 Generating adaptive-icon.png (1024x1024)...");
    await compositeLogo(
      1024,
      ADAPTIVE_LOGO_RATIO,
      path.join(assetsDir, "adaptive-icon.png"),
      "adaptive-icon.png"
    );

    // Generate splash.png (1284x2778 for iPhone)
    console.log("🖼️  Generating splash.png (1284x2778)...");
    
    const splashWidth = 1284;
    const splashHeight = 2778;
    const logoSize = Math.min(splashWidth, splashHeight) * SPLASH_LOGO_RATIO;
    
    await sharp({
      create: {
        width: splashWidth,
        height: splashHeight,
        channels: 4,
        background: BG,
      },
    })
      .composite([
        {
          input: await logo
            .resize(Math.round(logoSize), Math.round(logoSize), {
              fit: "contain",
              background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .toBuffer(),
          gravity: "center",
        },
      ])
      .png()
      .toFile(path.join(assetsDir, "splash.png"));
    console.log("✅ splash.png created");

    console.log("\n🎉 All icons generated successfully!");
    console.log('\n📁 Generated files:');
    console.log('   - assets/icon.png');
    console.log('   - assets/adaptive-icon.png');
    console.log('   - assets/splash.png');
    console.log('\n💡 Next steps:');
    console.log('   1. Review the generated icons');
    console.log('   2. Run: npx expo prebuild --clean');
    console.log('   3. Rebuild your app: npx expo run:android or npx expo run:ios');

  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();

