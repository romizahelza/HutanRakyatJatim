/********************* Load Study Area *****************/
var aoi = CDK_Jatim.filter(ee.Filter.eq('CDK', 'CDK Banyuwangi')); // Bisa diganti pada 'CDK [Wilayah]' menyesuaikan yang ingin di gunakan

/******************* Sentinel 2 Filtering & Cloud Masking *****************/
// Cloud Masking Function
function cloudMask(img) {
  var SCL = img.select('SCL');
  var mask = SCL.neq(3)            // Cloud Cover
                .and(SCL.neq(8))   // Medium probability cloud
                .and(SCL.neq(9))   // Cloud shadow
                .and(SCL.neq(10)); // Cirrus
  return img.updateMask(mask);
}


// Filter Tanggal (YYY, MM, DD)
var startDate = ee.Date.fromYMD(2025, 4, 1);
var endDate = ee.Date.fromYMD(2025, 11, 1);

// Sentinel RAW (Unscalled) > untuk dihitung GLCM
var sentinel_raw = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                .filterDate(startDate, endDate)
                .filterBounds(aoi)
                .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
                .map(cloudMask)
                .median()
                .clip(aoi);

// Sentinel terskala (dikalikan dengan faktor skala 0.0001)
var sentinel = sentinel_raw.multiply(0.0001).clip(aoi);

// Menampilkan Komposit Sentinel pada display map
Map.addLayer(sentinel, {
  min: 0,
  max: 0.4,
  bands: ['B11', 'B8', 'B4']
}, 'Sentinel-2');


/************************ Spectral Indices ************************/
// NDVI = (NIR - Red)/(NIR+Red)
var ndvi = sentinel.normalizedDifference(['B8', 'B4']).rename('NDVI');

// EVI = 2.5 x ((NIR - Red) / (NIR + (6 x Red) + (7 x Blue) + 1))
var evi = sentinel.expression(
  '2.5 * ((NIR - RED) / (NIR + 6*RED - 7.5*BLUE + 1))',
  { 'NIR': sentinel.select('B8'), 'RED': sentinel.select('B4'), 'BLUE': sentinel.select('B2')}
).rename('EVI');

// ClRE = (NIR - Red Edge) - 1
var clre = sentinel.expression('(NIR / REDEDGE) - 1',
  {'NIR': sentinel.select('B8'),'REDEDGE': sentinel.select('B5')}).rename('CLRE');

// SAVI = ((NIR - Red) / (NIR + Red + L(0.5))) x (1 + L)
var savi = sentinel.expression('((NIR - RED) / (NIR + RED + L)) * (1 + L)',
  {'NIR': sentinel.select('B8'),'RED': sentinel.select('B4'),'L': 0.5}).rename('SAVI');

// NDBI = (SWIR - NIR)/(SWIR + NIR)
var ndbi = sentinel.normalizedDifference(['B12', 'B8']).rename('NDBI');


// AVI = = (NIR×(1−RED)×(NIR−RED))^1/3
var avi = sentinel.expression('NIR * pow(((1 - RED) * (NIR - RED)), 1/3)',
  {'NIR': sentinel.select('B8'),'RED': sentinel.select('B4')}).rename('AVI');
  

/*************** GLCM (texture) — use unscaled / integer-friendly data ***************/
// Mengubah type raster menjadi int - int16
var nir_int = sentinel_raw.select('B8').multiply(1).toInt16().rename('nir_int');
var glcm_nir = nir_int.glcmTexture({size: 3});
var nir_contrast = glcm_nir.select('nir_int_contrast').rename('NIR_contrast');

var ndvi_int = ndvi.multiply(1000).toInt16().rename('ndvi_int');
var glcm_ndvi = ndvi_int.glcmTexture({size: 3});
var ndvi_contrast = glcm_ndvi.select('ndvi_int_contrast').rename('NDVI_contrast');

/************************ Build final image with bands ************************/
var image_allbands = sentinel
  .addBands(ndvi)
  .addBands(evi)
  .addBands(savi)
  .addBands(avi)
  .addBands(ndbi)
  .addBands(clre)
  .addBands(nir_contrast)
  .addBands(ndvi_contrast);

/************************ Training Data Preparation ************************/
// BINARY CLASSIFICATION: 0 = Hutan, 1 = Non-Hutan
// Kelas 0-2 (high, med, low) -> Hutan (0)
// Kelas 3-5 (pot, build, water) -> Non-Hutan (1)

var hutan = high.merge(high2).merge(h_c)
              .merge(med).merge(med2)
              .merge(low).merge(low2)
              .map(function(f){ return f.set('class', 0); }); // Hutan

var nan_hutan = pot.merge(pot2)
                  .merge(build)
                  .merge(water)
                  .map(function(f){ return f.set('class', 1); }); // Non-Hutan

// Kombinasi semua data training
var sample = hutan.merge(nan_hutan).randomColumn('random');

// Bagi menjadi data training dan testing (80-20 split)
var train = sample.filter(ee.Filter.lte('random', 0.8));
var test = sample.filter(ee.Filter.gt('random', 0.8));

/************************ Feature Selection ************************/
// Band yang digunakan untuk klasifikasi > bisa diubah sesuai dengan kebutuhan
var bands = ['B2','B3','B4','B5','B6','B7','B8', 'B11','B12',
             'NDVI','EVI','SAVI', 'CLRE',
             'NIR_contrast', 'NDVI_contrast'];

// Ekstraksi sampel training
var trainSample = image_allbands.select(bands).sampleRegions({
  collection: train,
  scale: 10,
  properties: ['class'],
  geometries: true
});

/************************ Test Set Preparation ************************/
// Function to remap groundcheck classes: 0-2 -> 0 (Hutan), 3-5 -> 1 (Non-Hutan)
function remapToBinary(feature) {
  var original_class = ee.Number(feature.get('GC'));
  var binary_class = ee.Algorithms.If(original_class.lte(2), 0, 1);
  return feature.set('class', binary_class).set('source', 'ground');
}

var sampleGC_binary = sampleGC.merge(non_hutan).map(remapToBinary);

// Sample image values for test points
var testSample = image_allbands.select(bands).sampleRegions({
  collection: sampleGC_binary,
  scale: 10,
  properties: ['class'],
  geometries: true
});

/************************ Random Forest Classification ************************/
// Training model menggunakan Random Forest
var model = ee.Classifier.smileRandomForest(300, 3).train(trainSample, 'class', bands);

// Classify test sample and evaluate
var preds = testSample.classify(model, 'prediction');

// Uji akurasi (evaluasi model)
var cm_all = preds.errorMatrix('class','prediction');
print('=== Binary Classification: Hutan vs Non-Hutan ===');
print('Count (test):', testSample.size());
print('Confusion Matrix:', cm_all);
print('Overall Accuracy:', cm_all.accuracy());
print('Kappa:', cm_all.kappa());
print('Producer Accuracy:', cm_all.producersAccuracy());
print('Consumer Accuracy:', cm_all.consumersAccuracy());

// Aplikasikan hasil ke dalam citra
var lulc = image_allbands.select(bands).classify(model).toInt16();

/************************ Visualization ************************/
// 0 = Hutan (hijau tua), 1 = Non-Hutan (merah)
Map.addLayer(lulc, {min:0, max:1, palette: ['2d5016','ff6b6b']}, 'Binary LULC (Hutan/Non-Hutan)');
Map.addLayer(sampleGC_binary, {color: 'blue'}, 'Groundcheck (Binary)');

// Export the processed classification result
Export.image.toDrive({
  image: lulc,
  scale: 10,
  region: aoi,
  crs: 'EPSG:4326',
  maxPixels: 1e13,
  folder: 'LULC_Results',
  description: 'Binary_Forest_NonForest',
  formatOptions: {
    cloudOptimized: true
  }
});
