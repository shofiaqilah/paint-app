export function getMidpointCircle(xc, yc, r, lineStyle = 'solid') {
  const points = [];
  let x = 0;
  let y = r;
  let p = 1 - r;
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
      points.push({ x: centerX + py, y: centerY + px });
      points.push({ x: centerX - py, y: centerY + px });
      points.push({ x: centerX + py, y: centerY - px });
      points.push({ x: centerX - py, y: centerY - px });
    }
    pixelCount++;
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
