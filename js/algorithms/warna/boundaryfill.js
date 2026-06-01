import { getPixelColor, setPixelColor, colorsMatch } from './helper.js';

export function boundaryFill(imgData, width, height, startX, startY, fillColor, boundaryColor) {
    if (startX < 0 || startX >= width || startY < 0 || startY >= height) return;

    // Jika titik awal sudah merupakan warna boundary atau sudah diwarnai fillColor, batalkan
    const startColor = getPixelColor(imgData, startX, startY, width);
    if (colorsMatch(startColor, boundaryColor) || colorsMatch(startColor, fillColor)) return;

    const queue = [[startX, startY]];
    
    // Gunakan matriks/array 1D penanda (visited) untuk performa optimal agar tidak memproses piksel ganda
    const visited = new Uint8Array(width * height);
    visited[startY * width + startX] = 1;

    while (queue.length > 0) {
        const [x, y] = queue.shift();

        // Warnai piksel aktif
        setPixelColor(imgData, x, y, width, fillColor);

        // Cek 4 arah mata angin
        const directions = [
            [x + 1, y], // Kanan
            [x - 1, y], // Kiri
            [x, y + 1], // Bawah
            [x, y - 1]  // Atas
        ];

        for (const [nx, ny] of directions) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const idx = ny * width + nx;
                if (!visited[idx]) {
                    const nextColor = getPixelColor(imgData, nx, ny, width);
                    
                    // Jika belum menyentuh warna pembatas dan belum diwarnai warna fill
                    if (!colorsMatch(nextColor, boundaryColor) && !colorsMatch(nextColor, fillColor)) {
                        visited[idx] = 1;
                        queue.push([nx, ny]);
                    }
                }
            }
        }
    }
}