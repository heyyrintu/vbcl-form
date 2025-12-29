const https = require('https');
const fs = require('fs');
const path = require('path');

// Icon URL from Dribbble (the one used in the original layout)
const iconUrl = 'https://cdn.dribbble.com/userupload/45188200/file/49510167ef68236a40dd16a5212e595e.png?resize=400x400&vertical=center';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

async function downloadIcon() {
    return new Promise((resolve, reject) => {
        https.get(iconUrl, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                https.get(response.headers.location, (res) => {
                    const chunks = [];
                    res.on('data', (chunk) => chunks.push(chunk));
                    res.on('end', () => resolve(Buffer.concat(chunks)));
                    res.on('error', reject);
                }).on('error', reject);
            } else {
                const chunks = [];
                response.on('data', (chunk) => chunks.push(chunk));
                response.on('end', () => resolve(Buffer.concat(chunks)));
                response.on('error', reject);
            }
        }).on('error', reject);
    });
}

async function main() {
    console.log('Downloading icon from Dribbble...');

    try {
        const iconBuffer = await downloadIcon();

        // For simplicity, we'll save the same image for all sizes
        // In production, you'd want to resize these properly
        for (const size of sizes) {
            const filename = `icon-${size}x${size}.png`;
            const filepath = path.join(iconsDir, filename);
            fs.writeFileSync(filepath, iconBuffer);
            console.log(`Created ${filename}`);
        }

        console.log('\n✅ All icons created successfully!');
        console.log('\nNote: These icons are all the same size (400x400).');
        console.log('For production, you may want to resize them to their proper dimensions.');
        console.log('You can use tools like https://www.pwa-asset-generator.dev/ to generate proper icons.');
    } catch (error) {
        console.error('Error downloading icon:', error);

        // Fallback: create simple placeholder icons
        console.log('\nCreating fallback placeholder icons...');

        // Create a simple PNG with solid color (minimal valid PNG)
        const createPlaceholderPng = (size) => {
            // This creates a minimal valid PNG file
            // In reality, you should use proper image processing
            const pngHeader = Buffer.from([
                0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
            ]);
            return pngHeader;
        };

        for (const size of sizes) {
            const filename = `icon-${size}x${size}.png`;
            const filepath = path.join(iconsDir, filename);
            // Just create empty files as placeholders
            fs.writeFileSync(filepath, '');
            console.log(`Created placeholder ${filename}`);
        }
    }
}

main();
