const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const screenshotsDir = path.join(__dirname, '../public/screenshots');

// Create screenshots directory if it doesn't exist
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Create a simple placeholder screenshot with text
async function createScreenshot(width, height, filename, label) {
    // Create SVG with gradient background and text
    const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
                <stop offset="50%" style="stop-color:#1e3a8a;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
            </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
        <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" 
              font-family="Arial, sans-serif" font-size="${width > 1000 ? 48 : 32}" font-weight="bold" fill="white">
            VBCL Production Tracker
        </text>
        <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" 
              font-family="Arial, sans-serif" font-size="${width > 1000 ? 24 : 18}" fill="#94a3b8">
            ${label}
        </text>
        <rect x="${width * 0.1}" y="${height * 0.7}" width="${width * 0.8}" height="${height * 0.15}" 
              rx="10" fill="#1e40af" opacity="0.5"/>
        <text x="50%" y="${height * 0.775}" dominant-baseline="middle" text-anchor="middle" 
              font-family="Arial, sans-serif" font-size="${width > 1000 ? 20 : 14}" fill="white">
            Dashboard • Records • Employees • Settings
        </text>
    </svg>`;

    await sharp(Buffer.from(svg))
        .png()
        .toFile(path.join(screenshotsDir, filename));
    
    console.log(`Created: ${filename} (${width}x${height})`);
}

async function main() {
    console.log('Generating PWA screenshots...\n');
    
    // Wide screenshot for desktop (required for PWA install on desktop)
    await createScreenshot(1280, 720, 'screenshot-wide.png', 'Desktop Dashboard View');
    
    // Narrow screenshot for mobile (required for PWA install on mobile)
    await createScreenshot(750, 1334, 'screenshot-mobile.png', 'Mobile Dashboard View');
    
    console.log('\nScreenshots generated successfully!');
    console.log('Location:', screenshotsDir);
}

main().catch(console.error);
