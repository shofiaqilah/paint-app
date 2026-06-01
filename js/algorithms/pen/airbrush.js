/**
 * Menggambar dengan gaya airbrush (titik-titik tersebar).
 * @param {CanvasRenderingContext2D} ctx 
 * @param {number} x 
 * @param {number} y 
 * @param {string} color 
 * @param {number} size - Digunakan sebagai radius penyebaran
 */
export function drawAirbrush(ctx, x, y, color, size) {
  const density = size * 5; // Semakin besar size, semakin banyak titik
  const radius = size * 2;
  
  ctx.fillStyle = color;
  for (let i = 0; i < density; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * radius;
    const px = x + Math.cos(angle) * dist;
    const py = y + Math.sin(angle) * dist;
    
    ctx.fillRect(Math.round(px), Math.round(py), 1, 1);
  }
}
