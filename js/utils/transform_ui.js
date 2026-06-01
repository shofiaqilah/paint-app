/**
 * Module untuk menangani tampilan Bounding Box Transformasi (Resize & Rotate handles)
 */

export const HANDLE_SIZE = 8;
export const ROTATION_HANDLE_OFFSET = 30;

/**
 * Mendefinisikan posisi semua handle berdasarkan bounding box (rect)
 * @param {Object} rect - {x, y, width, height}
 */
export function getHandlePositions(rect) {
    const { x, y, width: w, height: h } = rect;
    return {
        tl: { x: x, y: y, cursor: 'nwse-resize' },
        tc: { x: x + w / 2, y: y, cursor: 'ns-resize' },
        tr: { x: x + w, y: y, cursor: 'nesw-resize' },
        ml: { x: x, y: y + h / 2, cursor: 'ew-resize' },
        mr: { x: x + w, y: y + h / 2, cursor: 'ew-resize' },
        bl: { x: x, y: y + h, cursor: 'nesw-resize' },
        bc: { x: x + w / 2, y: y + h, cursor: 'ns-resize' },
        br: { x: x + w, y: y + h, cursor: 'nwse-resize' },
        rot: { x: x + w / 2, y: y - ROTATION_HANDLE_OFFSET, cursor: 'grab' }
    };
}

/**
 * Menggambar UI Transformasi pada context (biasanya overlayCtx)
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Object} rect - Bounding box {x, y, width, height}
 * @param {string} accentColor - Warna tema UI (misal: #0078d4)
 */
export function drawTransformOverlay(ctx, rect, accentColor = '#0078d4') {
    if (!rect || rect.width < 5 || rect.height < 5) return;

    const handles = getHandlePositions(rect);

    ctx.save();
    
    // 1. Gambar Bounding Box Border (Solid thin line)
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([]); // Pastikan tidak putus-putus untuk UI ini
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

    // 2. Gambar Garis Penghubung Handle Rotasi
    ctx.beginPath();
    ctx.moveTo(handles.tc.x, handles.tc.y);
    ctx.lineTo(handles.rot.x, handles.rot.y);
    ctx.stroke();

    // 3. Gambar Semua Handle (Kotak Putih dengan Border Accent)
    ctx.fillStyle = '#ffffff';
    
    for (const key in handles) {
        const h = handles[key];
        
        // Gunakan lingkaran untuk handle rotasi agar beda
        if (key === 'rot') {
            ctx.beginPath();
            ctx.arc(h.x, h.y, HANDLE_SIZE / 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.fillRect(
                h.x - HANDLE_SIZE / 2, 
                h.y - HANDLE_SIZE / 2, 
                HANDLE_SIZE, 
                HANDLE_SIZE
            );
            ctx.strokeRect(
                h.x - HANDLE_SIZE / 2, 
                h.y - HANDLE_SIZE / 2, 
                HANDLE_SIZE, 
                HANDLE_SIZE
            );
        }
    }

    ctx.restore();
}

/**
 * Mengecek apakah koordinat mouse mengenai salah satu handle
 * @param {number} mx - Mouse X (scaled)
 * @param {number} my - Mouse Y (scaled)
 * @param {Object} rect - Bounding box
 * @returns {string|null} - ID handle ('tl', 'tr', dll) atau null
 */
export function hitTestHandles(mx, my, rect) {
    if (!rect) return null;
    const handles = getHandlePositions(rect);
    const hitArea = HANDLE_SIZE + 4; // Toleransi klik

    for (const key in handles) {
        const h = handles[key];
        if (mx >= h.x - hitArea / 2 && mx <= h.x + hitArea / 2 &&
            my >= h.y - hitArea / 2 && my <= h.y + hitArea / 2) {
            return key;
        }
    }
    return null;
}
