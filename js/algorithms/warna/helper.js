/**
 * Fungsi pembantu untuk mengambil warna piksel pada koordinat (x, y)
 */
function getPixelColor(imgData, x, y, width) {
    const index = (y * width + x) * 4;
    return {
        r: imgData.data[index],
        g: imgData.data[index + 1],
        b: imgData.data[index + 2],
        a: imgData.data[index + 3]
    };
}

/**
 * Fungsi pembantu untuk mengubah warna piksel
 */
function setPixelColor(imgData, x, y, width, color) {
    const index = (y * width + x) * 4;
    imgData.data[index] = color.r;
    imgData.data[index + 1] = color.g;
    imgData.data[index + 2] = color.b;
    imgData.data[index + 3] = color.a;
}

function colorsMatch(c1, c2) {
    return c1.r === c2.r && c1.g === c2.g && c1.b === c2.b && c1.a === c2.a;
}