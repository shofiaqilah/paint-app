// js/algorithms.js

export function getMidpointCircle(xc, yc, r) {
  let points = [];
  let x = 0;
  let y = r;
  let p = 1 - r; // Parameter keputusan awal

  // Fungsi pembantu untuk memasukkan 8 titik simetri sekaligus
  const addSymmetryPoints = (xc, yc, x, y) => {
    points.push({ x: xc + x, y: yc + y });
    points.push({ x: xc - x, y: yc + y });
    points.push({ x: xc + x, y: yc - y });
    points.push({ x: xc - x, y: yc - y });
    points.push({ x: xc + y, y: yc + x });
    points.push({ x: xc - y, y: yc + x });
    points.push({ x: xc + y, y: yc - x });
    points.push({ x: xc - y, y: yc - x });
  };

  addSymmetryPoints(xc, yc, x, y);

  while (x < y) {
    x++;
    if (p < 0) {
      p = p + 2 * x + 1;
    } else {
      y--;
      p = p + 2 * (x - y) + 1;
    }
    addSymmetryPoints(xc, yc, x, y);
  }

  return points;
}
