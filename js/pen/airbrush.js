/**
 * Menggambar dengan gaya airbrush (titik-titik tersebar acak).
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {string} color 
 * @param {number} size 
 */
export function drawAirbrush(ctx, x, y, color, size) {
  const density = size * 5; // N = brushSize * 5
  const radius = size * 2;  // R = brushSize * 2
  
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.4;

  for (let i = 0; i < density; i++) {
    const angle = Math.random() * Math.PI * 2;
    // Distribusi seragam di dalam lingkaran
    const dist = Math.sqrt(Math.random()) * radius;
    const px = x + Math.cos(angle) * dist;
    const py = y + Math.sin(angle) * dist;
    
    ctx.fillRect(Math.round(px), Math.round(py), 1, 1);
  }
  ctx.restore();
}

