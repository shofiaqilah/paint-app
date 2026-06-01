/**
 * Fungsi pembantu untuk mengambil warna piksel pada koordinat (x, y)
 */
export function getPixelColor(imgData, x, y, width) {
  const index = (y * width + x) * 4;
  return {
    r: imgData.data[index],
    g: imgData.data[index + 1],
    b: imgData.data[index + 2],
    a: imgData.data[index + 3],
  };
}

/**
 * Fungsi pembantu untuk mengubah warna piksel
 */
export function setPixelColor(imgData, x, y, width, color) {
  const index = (y * width + x) * 4;
  imgData.data[index] = color.r;
  imgData.data[index + 1] = color.g;
  imgData.data[index + 2] = color.b;
  imgData.data[index + 3] = color.a;
}

export function colorsMatch(c1, c2) {
  return c1.r === c2.r && c1.g === c2.g && c1.b === c2.b && c1.a === c2.a;
}

export function hexToRgba(hex) {
  const normalizedHex = hex.replace("#", "");
  const value =
    normalizedHex.length === 3
      ? normalizedHex
          .split("")
          .map((char) => char + char)
          .join("")
      : normalizedHex;

  const intValue = Number.parseInt(value, 16);

  return {
    r: (intValue >> 16) & 255,
    g: (intValue >> 8) & 255,
    b: intValue & 255,
    a: 255,
  };
}

export function rgbaToCss(color) {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
}
