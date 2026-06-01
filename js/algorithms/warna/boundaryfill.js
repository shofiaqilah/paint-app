import { getPixelColor, setPixelColor, colorsMatch } from './helper.js';

/**
 * Boundary Fill (4-Connected)
 */
export function boundaryFill(imgData, width, height, x, y, fillColor, boundaryColor) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;

    const currentColor = getPixelColor(imgData, x, y, width);

    // Jalankan jika warna sekarang bukan warna boundary DAN belum diwarnai dengan fillColor
    if (!colorsMatch(currentColor, boundaryColor) && !colorsMatch(currentColor, fillColor)) {
        setPixelColor(imgData, x, y, width, fillColor);

        // Rekursi ke 4 arah tetangga
        boundaryFill(imgData, width, height, x + 1, y, fillColor, boundaryColor); // Kanan
        boundaryFill(imgData, width, height, x - 1, y, fillColor, boundaryColor); // Kiri
        boundaryFill(imgData, width, height, x, y + 1, fillColor, boundaryColor); // Bawah
        boundaryFill(imgData, width, height, x, y - 1, fillColor, boundaryColor); // Atas
    }
}