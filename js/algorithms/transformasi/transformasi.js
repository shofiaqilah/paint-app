/**
 * Fungsi pembantu untuk mengalikan matriks 3x3 dengan sebuah titik [x, y, 1]
 */
function multiplyMatrixVector(matrix, point) {
    const x = point.x;
    const y = point.y;
    
    // Koordinat homogen [x, y, 1]
    const nx = matrix[0][0] * x + matrix[0][1] * y + matrix[0][2] * 1;
    const ny = matrix[1][0] * x + matrix[1][1] * y + matrix[1][2] * 1;
    
    return { x: nx, y: ny };
}

/**
 * Fungsi pembantu untuk menerapkan matriks transformasi ke semua titik objek
 */
function applyTransformation(vertices, matrix) {
    return vertices.map(point => multiplyMatrixVector(matrix, point));
}

// ==========================================
// 1. TRANSLASI (Pergeseran)
// ==========================================
/**
 * @param {Array} vertices - [{x, y}, ...]
 * @param {number} tx - Pergeseran sumbu X
 * @param {number} ty - Pergeseran sumbu Y
 */
export function translate(vertices, tx, ty) {
    const matrix = [
        [1, 0, tx],
        [0, 1, ty],
        [0, 0,  1]
    ];
    return applyTransformation(vertices, matrix);
}

// ==========================================
// 2. SKALA (Perbesaran/Pengecilan)
// ==========================================
/**
 * @param {Array} vertices - [{x, y}, ...]
 * @param {number} sx - Faktor skala sumbu X (misal: 2 untuk 2x lebih besar)
 * @param {number} sy - Faktor skala sumbu Y
 * @param {Object} [center={x:0, y:0}] - Titik pusat penskalaan
 */
export function scale(vertices, sx, sy, center = { x: 0, y: 0 }) {
    // Jika skala dilakukan terhadap titik tertentu (bukan 0,0), 
    // kita perlu translasi ke (0,0), skala, lalu kembalikan posisinya.
    let matrix = [
        [sx,  0, center.x * (1 - sx)],
        [ 0, sy, center.y * (1 - sy)],
        [ 0,  0,                   1]
    ];
    return applyTransformation(vertices, matrix);
}

// ==========================================
// 3. ROTASI (Perputaran)
// ==========================================
/**
 * @param {Array} vertices - [{x, y}, ...]
 * @param {number} angleDegrees - Sudut rotasi dalam derajat (derajat positif = berlawanan arah jarum jam)
 * @param {Object} [center={x:0, y:0}] - Titik pusat rotasi
 */
export function rotate(vertices, angleDegrees, center = { x: 0, y: 0 }) {
    const radians = (angleDegrees * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    // Matriks rotasi terhadap titik pusat tertentu
    const matrix = [
        [cos, -sin, center.x * (1 - cos) + center.y * sin],
        [sin,  cos, center.y * (1 - cos) - center.x * sin],
        [  0,    0,                                     1]
    ];
    return applyTransformation(vertices, matrix);
}

// ==========================================
// 4. REFLEKSI (Pencerminan)
// ==========================================
/**
 * @param {Array} vertices - [{x, y}, ...]
 * @param {string} axis - 'X' (horizontal), 'Y' (vertikal), atau 'ORIGIN' (titik pusat 0,0)
 */
export function reflect(vertices, axis) {
    let matrix;
    
    if (axis.toUpperCase() === 'X') {
        // Mencerminkan terhadap sumbu X (Y menjadi negatif)
        matrix = [
            [1,  0, 0],
            [0, -1, 0],
            [0,  0, 1]
        ];
    } else if (axis.toUpperCase() === 'Y') {
        // Mencerminkan terhadap sumbu Y (X menjadi negatif)
        matrix = [
            [-1, 0, 0],
            [ 0, 1, 0],
            [ 0, 0, 1]
        ];
    } else if (axis.toUpperCase() === 'ORIGIN') {
        // Mencerminkan terhadap titik (0,0)
        matrix = [
            [-1,  0, 0],
            [ 0, -1, 0],
            [ 0,  0, 1]
        ];
    } else {
        throw new Error("Axis harus berupa 'X', 'Y', atau 'ORIGIN'");
    }

    return applyTransformation(vertices, matrix);
}

// ==========================================
// 5. SHEAR (Pensiangan / Efek Miring)
// ==========================================
/**
 * @param {Array} vertices - [{x, y}, ...]
 * @param {number} shx - Faktor kemiringan sumbu X
 * @param {number} shy - Faktor kemiringan sumbu Y
 */
export function shear(vertices, shx, shy) {
    const matrix = [
        [  1, shx, 0],
        [shy,   1, 0],
        [  0,   0, 1]
    ];
    return applyTransformation(vertices, matrix);
}