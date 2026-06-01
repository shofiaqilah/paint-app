
function multiplyMatrixVector(matrix, point) {
    const x = point.x;
    const y = point.y;
    
    const nx = matrix[0][0] * x + matrix[0][1] * y + matrix[0][2] * 1;
    const ny = matrix[1][0] * x + matrix[1][1] * y + matrix[1][2] * 1;
    
    return { x: nx, y: ny };
}

function applyTransformation(vertices, matrix) {
    return vertices.map(point => multiplyMatrixVector(matrix, point));
}

export function translate(vertices, tx, ty) {
    const matrix = [
        [1, 0, tx],
        [0, 1, ty],
        [0, 0,  1]
    ];
    return applyTransformation(vertices, matrix);
}

export function scale(vertices, sx, sy, center = { x: 0, y: 0 }) {
    let matrix = [
        [sx,  0, center.x * (1 - sx)],
        [ 0, sy, center.y * (1 - sy)],
        [ 0,  0,                   1]
    ];
    return applyTransformation(vertices, matrix);
}

export function rotate(vertices, angleDegrees, center = { x: 0, y: 0 }) {
    const radians = (angleDegrees * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    const matrix = [
        [cos, -sin, center.x * (1 - cos) + center.y * sin],
        [sin,  cos, center.y * (1 - cos) - center.x * sin],
        [  0,    0,                                     1]
    ];
    return applyTransformation(vertices, matrix);
}

export function reflect(vertices, axis) {
    let matrix;
    
    if (axis.toUpperCase() === 'X') {
        matrix = [
            [1,  0, 0],
            [0, -1, 0],
            [0,  0, 1]
        ];
    } else if (axis.toUpperCase() === 'Y') {
        matrix = [
            [-1, 0, 0],
            [ 0, 1, 0],
            [ 0, 0, 1]
        ];
    } else if (axis.toUpperCase() === 'ORIGIN') {
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

export function shear(vertices, shx, shy) {
    const matrix = [
        [  1, shx, 0],
        [shy,   1, 0],
        [  0,   0, 1]
    ];
    return applyTransformation(vertices, matrix);
}