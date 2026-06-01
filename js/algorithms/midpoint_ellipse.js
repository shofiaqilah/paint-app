export function getMidpointEllipse(xc, yc, rx, ry, lineStyle = 'solid') {
  const points = [];
  let x = 0;
  let y = ry;
  const rxSq = rx * rx;
  const rySq = ry * ry;
  let p1 = rySq - rxSq * ry + 0.25 * rxSq;
  let dx = 2 * rySq * x;
  let dy = 2 * rxSq * y;
  let pixelCount = 0;

  function shouldDraw() {
    if (lineStyle === 'solid') return true;
    if (lineStyle === 'dashed') return (pixelCount % 12) < 8;
    if (lineStyle === 'dotted') return (pixelCount % 6) < 3;
    if (lineStyle === 'dashed-dotted') {
      const mod = pixelCount % 16;
      return mod < 8 || (mod >= 10 && mod < 13);
    }
    return true;
  }

  const addSymmetryPoints = (centerX, centerY, px, py) => {
    if (shouldDraw()) {
      points.push({ x: centerX + px, y: centerY + py });
      points.push({ x: centerX - px, y: centerY + py });
      points.push({ x: centerX + px, y: centerY - py });
      points.push({ x: centerX - px, y: centerY - py });
    }
    pixelCount++;
  };

  addSymmetryPoints(xc, yc, x, y);

  while (dx < dy) {
    x++;
    dx += 2 * rySq;

    if (p1 < 0) {
      p1 += dx + rySq;
    } else {
      y--;
      dy -= 2 * rxSq;
      p1 += dx - dy + rySq;
    }

    addSymmetryPoints(xc, yc, x, y);
  }

  let p2 =
    rySq * (x + 0.5) * (x + 0.5) + rxSq * (y - 1) * (y - 1) - rxSq * rySq;

  while (y >= 0) {
    y--;
    dy -= 2 * rxSq;

    if (p2 > 0) {
      p2 += rxSq - dy;
    } else {
      x++;
      dx += 2 * rySq;
      p2 += dx - dy + rxSq;
    }

    addSymmetryPoints(xc, yc, x, y);
  }

  return points;
}
