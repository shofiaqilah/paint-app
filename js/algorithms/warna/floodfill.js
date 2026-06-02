import { getPixelColor, setPixelColor, colorsMatch } from './helper.js';

/**
 * Flood Fill (Queue-based / Iterative)
 */
export function floodFill(imgData, width, height, startX, startY, fillColor) {
    const targetColor = getPixelColor(imgData, startX, startY, width);
    
    // Jika warna target sudah sama dengan warna isi, hentikan agar tidak looping selamanya
    if (colorsMatch(targetColor, fillColor)) return;

    // Gunakan STACK (LIFO) alih-alih Queue (shift) untuk performa O(N)
    const stack = [[startX, startY]];

    while (stack.length > 0) {
        const [x, y] = stack.pop();

        if (x < 0 || x >= width || y < 0 || y >= height) continue;

        const currentColor = getPixelColor(imgData, x, y, width);

        if (colorsMatch(currentColor, targetColor)) {
            setPixelColor(imgData, x, y, width, fillColor);

            // Masukkan tetangga ke dalam stack
            stack.push([x + 1, y]);
            stack.push([x - 1, y]);
            stack.push([x, y + 1]);
            stack.push([x, y - 1]);
        }
    }
}