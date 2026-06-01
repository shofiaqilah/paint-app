import { getPixelColor, setPixelColor, colorsMatch } from './helper.js';

/**
 * Flood Fill (Queue-based / Iterative)
 */
export function floodFill(imgData, width, height, startX, startY, fillColor) {
    const targetColor = getPixelColor(imgData, startX, startY, width);
    
    // Jika warna target sudah sama dengan warna isi, hentikan agar tidak looping selamanya
    if (colorsMatch(targetColor, fillColor)) return;

    const queue = [[startX, startY]];

    while (queue.length > 0) {
        const [x, y] = queue.shift();

        if (x < 0 || x >= width || y < 0 || y >= height) continue;

        const currentColor = getPixelColor(imgData, x, y, width);

        if (colorsMatch(currentColor, targetColor)) {
            setPixelColor(imgData, x, y, width, fillColor);

            // Masukkan tetangga ke dalam queue
            queue.push([x + 1, y]);
            queue.push([x - 1, y]);
            queue.push([x, y + 1]);
            queue.push([x, y - 1]);
        }
    }
}