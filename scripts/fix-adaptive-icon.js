/**
 * Fix adaptive icon for Android - scale logo to safe zone (center ~66%)
 * Android adaptive icons crop the outer ~18% on each side, so the logo
 * must fit within the center 66% to avoid being cut off.
 *
 * Usage: node scripts/fix-adaptive-icon.js
 * Requires: npm install sharp --save-dev
 */

const fs = require("fs");
const path = require("path");

let sharp;
try {
  sharp = require("sharp");
} catch (e) {
  console.error("❌ sharp is not installed. Run: npm install sharp --save-dev");
  process.exit(1);
}

const SIZE = 1024;
const SAFE_RATIO = 0.66; // Logo fits in center 66% (Android safe zone)
const inputPath = path.join(__dirname, "../assets/adaptive-icon.png");
const outputPath = path.join(__dirname, "../assets/adaptive-icon.png");
const backupPath = path.join(__dirname, "../assets/adaptive-icon-backup.png");

async function fixAdaptiveIcon() {
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ File not found: ${inputPath}`);
    process.exit(1);
  }

  console.log("🔧 Fixing adaptive icon for Android safe zone...");

  try {
    // Backup original
    fs.copyFileSync(inputPath, backupPath);
    console.log("📦 Backup saved: assets/adaptive-icon-backup.png");

    const logoSize = Math.round(SIZE * SAFE_RATIO);

    // Resize logo to fit safe zone, then center on transparent 1024x1024
    await sharp(inputPath)
      .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer()
      .then((logoBuffer) =>
        sharp({
          create: {
            width: SIZE,
            height: SIZE,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          },
        })
          .composite([{ input: logoBuffer, gravity: "center" }])
          .png()
          .toFile(outputPath)
      );

    console.log(`✅ adaptive-icon.png updated (logo scaled to ${SAFE_RATIO * 100}% safe zone)`);
    console.log("\n💡 Next: rebuild the app (npx expo run:android) to see the new icon.");
    console.log("   To restore original: cp assets/adaptive-icon-backup.png assets/adaptive-icon.png");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

fixAdaptiveIcon();
