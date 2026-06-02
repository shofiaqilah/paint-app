import { getPixelColor, setPixelColor, colorsMatch } from './helper.js';

/**
 * Boundary Fill (Iterative Stack-based)
 */
export function boundaryFill(imgData, width, height, startX, startY, fillColor, boundaryColor) {
    const stack = [[startX, startY]];

    while (stack.length > 0) {
        const [x, y] = stack.pop();

        if (x < 0 || x >= width || y < 0 || y >= height) continue;

        const currentColor = getPixelColor(imgData, x, y, width);

        // Jalankan jika warna sekarang bukan warna boundary DAN belum diwarnai dengan fillColor
        if (!colorsMatch(currentColor, boundaryColor) && !colorsMatch(currentColor, fillColor)) {
            setPixelColor(imgData, x, y, width, fillColor);

            // Masukkan tetangga ke dalam stack (4-connected)
            stack.push([x + 1, y]);
            stack.push([x - 1, y]);
            stack.push([x, y + 1]);
            stack.push([x, y - 1]);
        }
    }
}