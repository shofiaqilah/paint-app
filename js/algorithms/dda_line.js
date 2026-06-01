/**
 * Menghasilkan semua titik garis menggunakan algoritma DDA.
 * @param {number} x0 - Titik awal X
 * @param {number} y0 - Titik awal Y
 * @param {number} x1 - Titik akhir X
 * @param {number} y1 - Titik akhir Y
 * @returns {{ x: number, y: number }[]} Array titik-titik garis
 */
export function getDdaPoints(x0, y0, x1, y1) {
  const points = [];
  const dx = x1 - x0;
  const dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));

  if (steps === 0) {
    return [{ x: x0, y: y0 }];
  }

  const xIncrement = dx / steps;
  const yIncrement = dy / steps;
  let x = x0;
  let y = y0;

  for (let i = 0; i <= steps; i++) {
    points.push({ x: Math.round(x), y: Math.round(y) });
    x += xIncrement;
    y += yIncrement;
  }

  return points;
}

/**
 * Memfilter titik-titik garis berdasarkan tipe garis (line style).
 *
 * Pola dihitung berdasarkan jarak piksel kumulatif sepanjang garis,
 * bukan per-titik, sehingga tetap konsisten di semua sudut dan ketebalan.
 *
 * @param {{ x: number, y: number }[]} points - Semua titik garis
 * @param {'solid'|'dotted'|'dashed'|'dashed-dotted'} lineStyle - Tipe garis
 * @returns {{ x: number, y: number }[]} Titik-titik yang akan digambar
 */
export function applyLineStyle(points, lineStyle) {
  if (lineStyle === "solid" || !lineStyle) return points;

  // Pola dalam satuan piksel (jarak kumulatif):
  // dotted        : 3 on, 10 off
  // dashed        : 18 on, 10 off
  // dashed-dotted : 18 on, 8 off, 3 on, 8 off
  const patterns = {
    dotted: [3, 10],
    dashed: [18, 10],
    "dashed-dotted": [18, 8, 3, 8],
  };

  const pattern = patterns[lineStyle];
  if (!pattern) return points;

  const result = [];
  let dist = 0;          // jarak kumulatif sepanjang garis
  let patternIndex = 0;  // posisi dalam array pola
  let segDist = 0;       // jarak yang sudah ditempuh dalam segmen pola saat ini
  let drawing = true;    // true = gambar, false = skip

  for (let i = 0; i < points.length; i++) {
    // Hitung jarak dari titik sebelumnya
    let step = 1;
    if (i > 0) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      step = Math.sqrt(dx * dx + dy * dy);
      if (step < 0.001) step = 1; // hindari division by zero
    }

    dist += step;
    segDist += step;

    // Maju dalam pola selama segDist melebihi panjang segmen saat ini
    while (segDist >= pattern[patternIndex]) {
      segDist -= pattern[patternIndex];
      patternIndex = (patternIndex + 1) % pattern.length;
      drawing = !drawing;
    }

    if (drawing) {
      result.push(points[i]);
    }
  }

  return result;
}
