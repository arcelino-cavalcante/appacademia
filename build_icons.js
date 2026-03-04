import sharp from 'sharp';

async function generate() {
    try {
        console.log("Generating PNG icons...");
        await sharp('./public/pwa-192x192.svg')
            .resize(192, 192)
            .png()
            .toFile('./public/pwa-192x192.png');

        await sharp('./public/pwa-512x512.svg')
            .resize(512, 512)
            .png()
            .toFile('./public/pwa-512x512.png');

        await sharp('./public/pwa-512x512.svg')
            .resize(180, 180)
            .png()
            .toFile('./public/apple-touch-icon.png');

        console.log("Done generating PNG icons.");
    } catch (e) {
        console.error(e);
    }
}
generate();
