import { getPixelColor, setPixelColor, colorsMatch } from './helper.js';

export function scanLineFill(ctx, vertices, fillColor) {
    const n = vertices.length;
    if (n < 3) return; 

    let minY = vertices[0].y;
    let maxY = vertices[0].y;
    for (let i = 1; i < n; i++) {
        if (vertices[i].y < minY) minY = vertices[i].y;
        if (vertices[i].y > maxY) maxY = vertices[i].y;
    }

    ctx.fillStyle = fillColor;

    for (let y = minY; y <= maxY; y++) {
        let intersectionPoints = [];

        for (let i = 0; i < n; i++) {
            let p1 = vertices[i];
            let p2 = vertices[(i + 1) % n];

            if (p1.y > p2.y) {
                let temp = p1; p1 = p2; p2 = temp;
            }

            if (y >= p1.y && y < p2.y) {
                let x = p1.x + ((y - p1.y) * (p2.x - p1.x)) / (p2.y - p1.y);
                intersectionPoints.push(x);
            }
        }

        intersectionPoints.sort((a, b) => a - b);

        for (let i = 0; i < intersectionPoints.length; i += 2) {
            let xStart = Math.ceil(intersectionPoints[i]);
            let xEnd = Math.floor(intersectionPoints[i + 1]);
            
            if (xStart <= xEnd) {
                ctx.fillRect(xStart, y, xEnd - xStart + 1, 1);
            }
        }
    }
}