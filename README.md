# 🌳 Pemetaan Indikasi Hutan Rakyat Jawa Timur Tahun 2025
Repositori ini berisi skrip Google Earth Engine (GEE) untuk melakukan pemetaan Hutan Rakyat menggunakan citra Sentinel-2 Surface Reflectance dengan pendekatan klasifikasi **Random Forest**.

Pemetaan dilakukan dengan mengombinasikan band spektral, indeks vegetasi, dan fitur tekstur (GLCM) untuk meningkatkan kemampuan pemisahan kelas vegetasi, khususnya Hutan Rakyat dengan tingkat kerapatan yang berbeda. 

Dapat dibuka dan dijalankan di https://code.earthengine.google.com/

   
# 🛰️ Klasifikasi Citra (Random Forest)
## 📌 Scriptcode
- Script Metode 1
> [Script Metode 1](https://code.earthengine.google.com/80e7c09e76c583b914e9fd61d61c8560)

> [Contoh Script](https://github.com/romizahelza/HutanRakyatJatim/blob/main/Script_1.js)




- Script Metode 2
> [Script Metode 2](https://code.earthengine.google.com/35ada5b3bb6deaa39eb4a6ec9a6dcb96)
>
> [Contoh Script](https://github.com/romizahelza/HutanRakyatJatim/blob/main/Script_2.js)

## 🧮 Data yang dibutuhkan
1. `CDK Wilayah Jawa Timur`
2. `Titik sampel` (high, medium, low, potential)
   > _H, _HB : kerapatan tinggi (high, high2)

   > _M, _MB : kerapatan sedang (med, med2)

   > _L, _LB : kerapatan rendah low, low2)

   > _POT, _POTB : potensial (pot, pot2)
4. `Titik sampel ground check`
   
## 📥 Donwload Data
- [CDK Jatim](https://github.com/romizahelza/HutanRakyatJatim/raw/refs/heads/main/CDK_Jatim.zip) 
- [Titik Sampel Training](https://drive.google.com/drive/folders/1CFhLbsF5cthu4t89WWbDmp3k4F020Hvu?usp=drive_link)
- [Titik Sampel Groundcheck]()
  
## ⚙️ Menjalankan Scriptcode
1. Buka **Code Editor Google Earth Engine**
2. Import `🧮 Data yang dibutuhkan` ke dalam Assets GEE
3. Sesuaikan area kajian dan periode waktu yang diinginkan
4. Jalankan script dengan klik `Run`
5. Untuk mengunduh hasilnya, bisa menuju panel `Task` dan klik `Run`
