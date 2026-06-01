import { getPixelColor, setPixelColor, colorsMatch } from './helper.js';

export function floodFill(imgData, width, height, startX, startY, fillColor) {
    const targetColor = getPixelColor(imgData, startX, startY, width);
    if (colorsMatch(targetColor, fillColor)) return;

    const queue = [[startX, startY]];
    const visited = new Uint8Array(width * height);
    visited[startY * width + startX] = 1;

    while (queue.length > 0) {
        const [x, y] = queue.shift();

        const currentColor = getPixelColor(imgData, x, y, width);

        if (colorsMatch(currentColor, targetColor)) {
            setPixelColor(imgData, x, y, width, fillColor);

            const directions = [
                [x + 1, y],
                [x - 1, y],
                [x, y + 1],
                [x, y - 1]
            ];

            for (const [nx, ny] of directions) {
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const idx = ny * width + nx;
                    if (!visited[idx]) {
                        visited[idx] = 1;
                        queue.push([nx, ny]);
                    }
                }
            }
        }
    }
}