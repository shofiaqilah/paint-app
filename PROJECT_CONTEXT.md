# 🎨 Project Context: Paint App (Advanced Computer Graphics)

## 📌 Overview
Aplikasi ini adalah editor grafis 2D berbasis web yang mengimplementasikan algoritma dasar Grafika Komputer secara manual (**Low-level Pixel Manipulation**) menggunakan Vanilla JavaScript dan HTML5 Canvas. Aplikasi ini menggabungkan fleksibilitas pengeditan objek (Vector) dengan kekuatan manipulasi piksel (Bitmap).

## 🏗️ Core Architecture: Hybrid Layering System
Sistem utama aplikasi membagi data menjadi dua lapisan yang saling bekerja sama:

1.  **Vector Layer (The `objects` Array):**
    *   **Source of Truth:** Menyimpan representasi matematis dari bentuk (e.g., `{type: 'circle', cx: 100, cy: 100, r: 50, color: '#ff0000'}`).
    *   **Non-Destructive:** Objek dapat dipindahkan, diputar, atau diubah ukurannya tanpa kehilangan kualitas karena digambar ulang dari koordinat aslinya.
    *   **Rendering:** Fungsi `renderAllObjects()` membersihkan kanvas, memulihkan background bitmap, lalu mengiterasi array ini untuk menggambar semua bentuk di atasnya.

2.  **Bitmap Layer (`transformBaseSnapshot`):**
    *   **Raster Data:** Menyimpan hasil operasi piksel langsung seperti *Pencil*, *Marker*, dan hasil dari algoritma *Fill*.
    *   **Background Layer:** Berfungsi sebagai "alas" bagi objek-objek vector.

---

## 💾 State Management (Key Variables in `main.js`)
*   `objects`: `Array<Object>` - Daftar semua bentuk vector yang ada di kanvas.
*   `transformBaseSnapshot`: `ImageData` - Status bitmap latar belakang.
*   `historyStack` / `redoStack`: Menyimpan riwayat `ImageData` untuk fitur Undo/Redo.
*   `currentShape`: Menyimpan tool yang sedang aktif (e.g., `'bresenham_line'`, `'select'`, `'fill'`).

---

## 🛠️ Logika & Algoritma Khusus

### 1. Sistem "Apply Fill" (Batch Processing)
Pengisian warna dilakukan secara massal melalui tombol **Apply Fill**:
1.  **Object Selection:** Sistem memfilter objek yang bisa di-fill (*polygon, circle, ellipse*).
2.  **Centroid Detection:** Menggunakan fungsi `getVerticesCentroid()` untuk menentukan titik tengah objek secara otomatis sebagai titik awal (*seed point*) pengisian.
3.  **Clean Snapshot Logic:** 
    *   Algoritma merender objek ke kanvas sementara untuk mendeteksi batas (*boundary*).
    *   Setelah proses pengisian warna selesai, sistem melakukan **Pixel Diffing**: Hanya piksel yang berubah menjadi warna isi (`fillColor`) yang akan disalin ke `transformBaseSnapshot`.
    *   **Tujuan:** Mencegah garis batas (outline) objek vector "terpanggang" secara permanen ke latar belakang bitmap, sehingga objek tetap bisa digeser secara mandiri tanpa meninggalkan bekas.

### 2. Algoritma Pewarnaan (Warna)
*   **Iterative Implementation:** `floodFill` dan `boundaryFill` menggunakan pendekatan **Stack-based** (bukan rekursif) untuk mencegah *Stack Overflow* pada area yang luas.
*   **Polygon Fill:** `scanLineFill` (Y-X Edge List) dan `insideOutsideFill` (Ray Casting/Even-Odd Rule).

### 3. Algoritma Primitif & Transformasi
*   **Rasterisasi:** Bresenham & DDA (Garis), Midpoint (Lingkaran & Elips).
*   **Transformasi:** Operasi matriks (Translasi, Rotasi, Skala, Shear, Refleksi) yang diterapkan secara parametrik pada properti objek.

---

## 📂 Struktur Modul
*   `js/main.js`: Logika kontrol, event listener UI, dan manajemen siklus hidup rendering.
*   `js/algorithms/`: Implementasi algoritma grafika (rasterisasi, transformasi, warna).
*   `js/shapes/shapes.js`: Logika pembentukan titik-titik dasar untuk berbagai bentuk poligon.
*   `js/utils/`: Utilitas kanvas dan UI transformasi (bounding box & handles).

---

## ⚠️ Aturan Pengembangan (Engineering Standards)
1.  **Vanilla JS Only:** Dilarang menggunakan library eksternal (jQuery, Fabric.js, dll).
2.  **Pixel Precision:** Anti-aliasing dimatikan (`imageSmoothingEnabled = false`) untuk memastikan manipulasi piksel yang presisi.
3.  **Coordinate Scaling:** Selalu gunakan `getCanvasPoint(e)` untuk sinkronisasi posisi mouse dengan resolusi internal kanvas (900x550).
4.  **State Integrity:** Setiap perubahan pada `objects` harus diikuti dengan pemanggilan `renderAllObjects()`. Setiap perubahan pada bitmap harus disimpan ke `transformBaseSnapshot` dan riwayat sejarah (`saveHistory()`).

---
*Terakhir diperbarui: Juni 2026.*
