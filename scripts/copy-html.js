import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = path.join(__dirname, '../dist/index.html');
const dest = path.join(__dirname, '../functions/index.html');

try {
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log('Successfully copied index.html to functions directory');
    } else {
        console.warn('Warning: dist/index.html does not exist. Make sure to run build first.');
    }
} catch (err) {
    console.error('Error copying index.html:', err);
    process.exit(1);
}
