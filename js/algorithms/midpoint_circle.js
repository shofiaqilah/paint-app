export function getMidpointCircle(xc, yc, r) {
  const points = [];
  let x = 0;
  let y = r;
  let p = 1 - r;

  const addSymmetryPoints = (centerX, centerY, px, py) => {
    points.push({ x: centerX + px, y: centerY + py });
    points.push({ x: centerX - px, y: centerY + py });
    points.push({ x: centerX + px, y: centerY - py });
    points.push({ x: centerX - px, y: centerY - py });
    points.push({ x: centerX + py, y: centerY + px });
    points.push({ x: centerX - py, y: centerY + px });
    points.push({ x: centerX + py, y: centerY - px });
    points.push({ x: centerX - py, y: centerY - px });
  };

  addSymmetryPoints(xc, yc, x, y);

  while (x < y) {
    x++;

    if (p < 0) {
      p += 2 * x + 1;
    } else {
      y--;
      p += 2 * (x - y) + 1;
    }

    addSymmetryPoints(xc, yc, x, y);
  }

  return points;
}
