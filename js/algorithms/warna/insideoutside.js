/**
 * Ray-Casting Algorithm (Even-Odd Rule)
 * Mengembalikan true jika titik (x,y) berada di dalam poligon
 */
export function isPointInsidePolygon(x, y, vertices) {
    let inside = false;
    const n = vertices.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = vertices[i].x, yi = vertices[i].y;
        const xj = vertices[j].x, yj = vertices[j].y;

        // Cek apakah garis horizontal (ray) memotong sisi poligon
        const intersect = ((yi > y) !== (yj > y)) && 
                          (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        
        if (intersect) inside = !inside;
    }

    return inside;
}

/**
 * Mewarnai Shape menggunakan metode Inside-Outside Test
 */
export function insideOutsideFill(ctx, vertices, fillColor) {
    // 1. Cari bounding box poligon
    let minX = vertices[0].x, maxX = vertices[0].x;
    let minY = vertices[0].y, maxY = vertices[0].y;

    for (let i = 1; i < vertices.length; i++) {
        if (vertices[i].x < minX) minX = vertices[i].x;
        if (vertices[i].x > maxX) maxX = vertices[i].x;
        if (vertices[i].y < minY) minY = vertices[i].y;
        if (vertices[i].y > maxY) maxY = vertices[i].y;
    }

    ctx.fillStyle = fillColor;

    // 2. Loop hanya di dalam area bounding box (Optimasi)
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
        for (let x = Math.floor(minX); x <= Math.ceil(maxX); x++) {
            // Jika titik di dalam poligon, gambar pikselnya
            if (isPointInsidePolygon(x, y, vertices)) {
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
}