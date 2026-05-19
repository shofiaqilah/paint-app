
export const canvas = document.getElementById("paintCanvas");
export const ctx = canvas.getContext("2d");

export function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export function drawPixel(x, y, color = "black") {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}
