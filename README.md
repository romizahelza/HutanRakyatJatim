# 🌳 Pemetaan Indikasi Hutan Rakyat Jawa Timur Tahun 2025
Repositori ini berisi skrip Google Earth Engine (GEE) untuk melakukan pemetaan Hutan Rakyat menggunakan citra Sentinel-2 Surface Reflectance dengan pendekatan klasifikasi **Random Forest**.

Pemetaan dilakukan dengan mengombinasikan band spektral, indeks vegetasi, dan fitur tekstur (GLCM) untuk meningkatkan kemampuan pemisahan kelas vegetasi, khususnya Hutan Rakyat dengan tingkat kerapatan yang berbeda. 

Dapat dibuka dan dijalankan di https://code.earthengine.google.com/

# 🛰️ Klasifikasi Citra (Random Forest)
## 🧮 Data yang dibutuhkan
1. `CDK Wilayah Jawa Timur`
2. `Titik sampel` (high, medium, low, potential)
3. `Titik sampel ground check`
   
## 📥 Donwload Data
- 

## ⚙️ Menjalankan Scriptcode
1. Buka **Code Editor Google Earth Engine**
2. Import `🧮 Data yang dibutuhkan`
3. Sesuaikan area kajian dan periode waktu yang diinginkan
4. Jalankan script dengan klik `Run`
5. Untuk mengunduh hasilnya, bisa menuju panel `Task` dan klik `Run`
