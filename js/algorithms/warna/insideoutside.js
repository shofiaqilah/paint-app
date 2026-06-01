import { isPointInsidePolygon} from './helper.js';


export function insideOutsideFill(ctx, vertices, fillColor) {
    let minX = vertices[0].x, maxX = vertices[0].x;
    let minY = vertices[0].y, maxY = vertices[0].y;

    for (let i = 1; i < vertices.length; i++) {
        if (vertices[i].x < minX) minX = vertices[i].x;
        if (vertices[i].x > maxX) maxX = vertices[i].x;
        if (vertices[i].y < minY) minY = vertices[i].y;
        if (vertices[i].y > maxY) maxY = vertices[i].y;
    }

    ctx.fillStyle = fillColor;

    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
        for (let x = Math.floor(minX); x <= Math.ceil(maxX); x++) {
            if (isPointInsidePolygon(x, y, vertices)) {
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
}