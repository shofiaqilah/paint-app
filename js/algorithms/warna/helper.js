export function getPixelColor(imgData, x, y, width) {
  const index = (y * width + x) * 4;
  return {
    r: imgData.data[index],
    g: imgData.data[index + 1],
    b: imgData.data[index + 2],
    a: imgData.data[index + 3],
  };
}

export function setPixelColor(imgData, x, y, width, color) {
  const index = (y * width + x) * 4;
  imgData.data[index] = color.r;
  imgData.data[index + 1] = color.g;
  imgData.data[index + 2] = color.b;
  imgData.data[index + 3] = color.a ?? 255; // Default ke solid jika tidak ada alpha
}

// PERBAIKAN 1: Berikan toleransi jarak warna (Threshold) agar tidak sensitif terhadap pembulatan browser
export function colorsMatch(c1, c2, threshold = 15) {
  // Jika keduanya sama-sama transparan (Alpha dekat dengan 0), anggap warna cocok (background kosong)
  if (c1.a < 10 && c2.a < 10) return true;
  
  // Hitung perbedaan absolut jarak warna RGB
  return (
    Math.abs(c1.r - c2.r) <= threshold &&
    Math.abs(c1.g - c2.g) <= threshold &&
    Math.abs(c1.b - c2.b) <= threshold
  );
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
    a: 255, // Solid
  };
}

export function rgbaToCss(color) {
  // Pastikan nilai alpha tidak undefined
  const alpha = color.a !== undefined ? color.a / 255 : 1;
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

export function isPointInsidePolygon(x, y, vertices) {
    let inside = false;
    const n = vertices.length;

    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = vertices[i].x, yi = vertices[i].y;
        const xj = vertices[j].x, yj = vertices[j].y;

        const intersect = ((yi > y) !== (yj > y)) && 
                          (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        
        if (intersect) inside = !inside;
    }

    return inside;
}