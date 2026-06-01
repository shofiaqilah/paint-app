/**
 * Scan Line Algorithm untuk Poligon
 * @param {CanvasRenderingContext2D} ctx - Konteks canvas untuk menggambar langsung
 * @param {Array} vertices - Titik sudut poligon [{x: 10, y: 20}, ...]
 * @param {String} fillColor - Warna (contoh: '#FF0000')
 */


export function scanLineFill(ctx, vertices, fillColor) {
    const n = vertices.length;
    if (n < 3) return; // Bukan poligon jika kurang dari 3 titik

    // 1. Cari nilai Y minimum dan maksimum dari poligon
    let minY = vertices[0].y;
    let maxY = vertices[0].y;
    for (let i = 1; i < n; i++) {
        if (vertices[i].y < minY) minY = vertices[i].y;
        if (vertices[i].y > maxY) maxY = vertices[i].y;
    }

    ctx.fillStyle = fillColor;

    // 2. Lakukan perulangan untuk setiap scanline dari minY sampai maxY
    for (let y = minY; y <= maxY; y++) {
        let intersectionPoints = [];

        // Cari titik potong setiap sisi poligon dengan garis y
        for (let i = 0; i < n; i++) {
            let p1 = vertices[i];
            let p2 = vertices[(i + 1) % n]; // Titik berikutnya (sisi penutup)

            // Pastikan p1 selalu memiliki Y lebih kecil untuk kemudahan logika
            if (p1.y > p2.y) {
                let temp = p1; p1 = p2; p2 = temp;
            }

            // Cek apakah scanline melewati sisi ini
            if (y >= p1.y && y < p2.y) {
                // Rumus interpolasi linear untuk mencari koordinat X titik potong
                let x = p1.x + ((y - p1.y) * (p2.x - p1.x)) / (p2.y - p1.y);
                intersectionPoints.push(x);
            }
        }

        // 3. Urutkan titik potong dari kiri ke kanan
        intersectionPoints.sort((a, b) => a - b);

        // 4. Warnai berpasangan (Inside-Outside rule)
        for (let i = 0; i < intersectionPoints.length; i += 2) {
            let xStart = Math.ceil(intersectionPoints[i]);
            let xEnd = Math.floor(intersectionPoints[i + 1]);
            
            if (xStart <= xEnd) {
                // Menggambar garis horizontal antar titik potong
                ctx.fillRect(xStart, y, xEnd - xStart + 1, 1);
            }
        }
    }
}