# Telefon Kamerasıyla Yol Bozukluğu ve Çukur Tespiti

Bu proje, telefon kamerası veya galeri üzerinden alınan yol görüntülerinde yol yüzeyi hasarlarını derin öğrenme yöntemleriyle sınıflandırmayı ve elde edilen sonucu mobil uygulama üzerinden kullanıcıya göstermeyi amaçlayan görüntü işleme tabanlı bir çalışmadır. Projede **RDD2022** veri seti kullanılmış, YOLO formatındaki anotasyonlardan hasar bölgeleri kırpılmış ve dört ana yol hasarı sınıfı için sınıflandırma modelleri eğitilmiştir.

Çalışmada **Basic CNN**, **MobileNetV2** ve **EfficientNetB0** modelleri Google Colab ortamında eğitilmiş; modellerin performansları **5-Fold Cross Validation** yöntemiyle karşılaştırılmıştır. Elde edilen model çıktıları, grafikler, confusion matrix sonuçları ve başarı tabloları proje dosyaları içinde saklanmıştır.

---

## Proje Bilgileri

| Alan | Açıklama |
|---|---|
| Proje adı | Telefon Kamerasıyla Yol Bozukluğu ve Çukur Tespiti |
| Proje türü | Görüntü işleme ve derin öğrenme tabanlı sınıflandırma |
| Veri seti | Road Damage Dataset 2022 (RDD2022) |
| Eğitim ortamı | Google Colab |
| Kullanılan modeller | Basic CNN, MobileNetV2, EfficientNetB0 |
| Değerlendirme yöntemi | 5-Fold Cross Validation |
| Mobil arayüz | React Native / Expo |
| API yaklaşımı | FastAPI tabanlı tahmin servisi |
| Geliştiriciler | Semanur YILDIRIM, Şilan PEHLİVAN |

---

## Projenin Amacı

Yol yüzeylerinde oluşan çatlak, çukur ve bozulmalar trafik güvenliği, sürüş konforu, bakım maliyetleri ve şehir altyapısı açısından önemli bir problemdir. Geleneksel yol kontrol süreçleri çoğunlukla manuel inceleme gerektirdiği için zaman alıcı ve maliyetlidir. Bu projede, yol görüntülerinden hasar türünü otomatik olarak belirleyen bir derin öğrenme modeli geliştirilerek bu sürecin daha hızlı, düşük maliyetli ve mobil kullanıma uygun hale getirilmesi hedeflenmiştir.

Projenin temel hedefleri şunlardır:

- RDD2022 veri setinden yol hasarı görüntülerini hazırlamak.
- YOLO anotasyonlarından sınıflandırma için kırpılmış hasar görüntüleri üretmek.
- Basic CNN, MobileNetV2 ve EfficientNetB0 modellerini aynı deney düzeninde eğitmek.
- Modelleri 5-Fold Cross Validation ile karşılaştırmak.
- Accuracy, precision, recall, F1-score ve confusion matrix sonuçlarını raporlamak.
- En başarılı modeli mobil uygulama ve API akışıyla kullanılabilir hale getirmek.
- Kullanıcının yol görüntüsü yükleyip hasar türünü görebileceği, admin tarafında ise bildirilen sorunların takip edilebileceği bir sistem tasarlamak.

---

## Kullanılan Hasar Sınıfları

Projede RDD2022 veri setindeki dört ana hasar sınıfı kullanılmıştır.

| Sınıf kodu | İngilizce ad | Türkçe karşılık | Açıklama |
|---|---|---|---|
| D00 | Longitudinal Crack | Boyuna çatlak | Yol doğrultusu boyunca ilerleyen çatlaklar |
| D10 | Transverse Crack | Enine çatlak | Yol doğrultusuna dik veya yatay çatlaklar |
| D20 | Alligator Crack | Timsah çatlağı | Ağ biçiminde, çoklu ve parçalı çatlaklar |
| D40 | Pothole | Çukur | Yol yüzeyindeki çukur, oyuk veya derin bozulmalar |

---

## Veri Seti ve Veri Hazırlama

Projede kullanılan ham veri seti **RDD2022** veri setidir. Ham veri seti boyut olarak büyük olduğu için bu proje paketine doğrudan dahil edilmemiştir. Ham veri, gerektiğinde RDD2022 kaynağından tekrar indirilebilir.

Veri hazırlama sürecinde şu adımlar uygulanmıştır:

1. RDD2022 veri setindeki görüntü ve YOLO formatındaki etiket dosyaları okunmuştur.
2. D00, D10, D20 ve D40 dışındaki sınıflar kapsam dışı bırakılmıştır.
3. Annotation dosyalarındaki bounding box koordinatları kullanılarak hasarlı bölgeler kırpılmıştır.
4. Kırpılan görüntüler sınıf klasörlerine göre düzenlenmiştir.
5. Görüntüler model eğitiminde kullanılmak üzere 224x224 boyutuna getirilmiştir.
6. Sınıf dengesizliğini azaltmak için dengeli veri tablosu oluşturulmuştur.
7. Aynı orijinal görüntüden gelen kırpımların farklı foldlara dağılması engellenerek veri sızıntısı riski azaltılmıştır.

### Veri Hazırlama Çıktıları

| Çıktı | Değer |
|---|---:|
| Toplam YOLO anotasyonu | 65.712 |
| D00-D10-D20-D40 kapsamındaki anotasyon | 59.168 |
| Kırpılmış hasar görüntüsü | 59.167 |
| Dengelenmiş veri sayısı | 42.464 |
| Her sınıftaki dengeli örnek sayısı | 10.616 |
| Kullanılan sınıf sayısı | 4 |

### Dengelenmiş Sınıf Dağılımı

| Sınıf | Örnek sayısı |
|---|---:|
| D00 | 10.616 |
| D10 | 10.616 |
| D20 | 10.616 |
| D40 | 10.616 |

---

## 5-Fold Cross Validation Deney Düzeni

Model başarısının yalnızca tek bir eğitim-test ayrımına bağlı kalmaması için projede **5-Fold Cross Validation** uygulanmıştır. Veri beş parçaya ayrılmış, her turda dört parça eğitim ve bir parça doğrulama için kullanılmıştır.

| Fold | Eğitim örneği | Doğrulama örneği | Val D00 | Val D10 | Val D20 | Val D40 |
|---:|---:|---:|---:|---:|---:|---:|
| 0 | 33.856 | 8.608 | 2.164 | 2.111 | 2.170 | 2.163 |
| 1 | 33.985 | 8.479 | 2.122 | 2.188 | 2.051 | 2.118 |
| 2 | 34.024 | 8.440 | 2.041 | 2.147 | 2.107 | 2.145 |
| 3 | 33.924 | 8.540 | 2.150 | 2.078 | 2.190 | 2.122 |
| 4 | 34.067 | 8.397 | 2.139 | 2.092 | 2.098 | 2.068 |

---

## Kullanılan Modeller

### 1. Basic CNN

Basic CNN modeli, projede temel karşılaştırma modeli olarak kullanılmıştır. Bu model sıfırdan eğitilen daha basit bir evrişimli sinir ağıdır. Transfer öğrenme tabanlı modellerin katkısını görebilmek için referans model görevi görmüştür.

### 2. MobileNetV2

MobileNetV2, hafif yapısı nedeniyle mobil ve gömülü sistemler için uygun bir transfer öğrenme modelidir. Bu projede telefon kamerası tabanlı kullanım senaryosuna yakın olduğu için karşılaştırmaya dahil edilmiştir.

### 3. EfficientNetB0

EfficientNetB0, parametre-verimlilik dengesi güçlü olan bir transfer öğrenme modelidir. Çalışmada en yüksek genel başarıyı veren model olmuştur. Bu nedenle final model seçimi ve akademik yorumlarda ana model olarak öne çıkarılmıştır.

---

## Model Başarı Sonuçları

Aşağıdaki tablo, üç modelin 5-fold ortalama sonuçlarını göstermektedir.

| Model | Accuracy Mean | Accuracy Std | Precision Macro Mean | Recall Macro Mean | F1 Macro Mean | F1 Macro Std |
|---|---:|---:|---:|---:|---:|---:|
| Basic CNN | 82.58% | 0.74 | 83.45% | 82.58% | 82.59% | 0.75 |
| MobileNetV2 | 87.60% | 0.33 | 87.72% | 87.61% | 87.58% | 0.32 |
| EfficientNetB0 | 88.66% | 0.32 | 88.69% | 88.66% | 88.65% | 0.34 |

### Genel Değerlendirme

- **EfficientNetB0**, 5-fold ortalama accuracy ve macro F1 değerlerinde en başarılı model olmuştur.
- **MobileNetV2**, EfficientNetB0'a yakın performans göstermiştir ve hafif mimarisi nedeniyle mobil kullanım için güçlü bir alternatiftir.
- **Basic CNN**, temel model olarak kabul edilebilir sonuçlar üretmiş ancak transfer öğrenme modellerinin gerisinde kalmıştır.
- Sonuçlar, transfer öğrenme tabanlı modellerin yol hasarı sınıflandırmasında daha güçlü özellik çıkarımı sağladığını göstermektedir.

---

## En İyi Model

En iyi fold sonucu EfficientNetB0 modelinde elde edilmiştir.

| Model | Fold | Accuracy | Macro F1 |
|---|---:|---:|---:|
| EfficientNetB0 | Fold 3 | 89.00% | 89.06% |

Bu nedenle uygulama tarafında kullanılacak model için öncelikli aday **EfficientNetB0 Fold 3 best model** olarak belirlenmiştir.

Model dosyası:

```text
models/efficientnetb0/efficientnetb0_fold3_best.keras
```

---

## Proje Klasör Yapısı

```text
Yol_Bozuklugu_Cukur_Tespiti_TUM_PROJE_DOSYALARI/
│
├── dataset/
│   └── processed/
│       ├── annotations_all_yolo.csv
│       ├── annotations_4class.csv
│       ├── cropped_damage_metadata.csv
│       ├── cropped_damage_metadata_balanced.csv
│       └── folds/
│           ├── cropped_damage_balanced_5fold.csv
│           ├── fold_0_train.csv
│           ├── fold_0_val.csv
│           ├── fold_1_train.csv
│           ├── fold_1_val.csv
│           ├── fold_2_train.csv
│           ├── fold_2_val.csv
│           ├── fold_3_train.csv
│           ├── fold_3_val.csv
│           ├── fold_4_train.csv
│           ├── fold_4_val.csv
│           └── fold_train_val_summary.csv
│
├── figures/
│   ├── cropped_class_distribution.png
│   ├── balanced_cropped_class_distribution.png
│   ├── balanced_cropped_samples_by_class.png
│   ├── basic_cnn/
│   ├── mobilenetv2/
│   ├── efficientnetb0/
│   └── final_comparison/
│
├── models/
│   ├── basic_cnn/
│   ├── mobilenetv2/
│   └── efficientnetb0/
│
├── outputs/
│   ├── basic_cnn/
│   ├── mobilenetv2/
│   ├── efficientnetb0/
│   └── final_comparison/
│
├── reports/
├── export_for_vscode/
└── PAKET_ICERIGI.txt
```

---

## Önemli Çıktı Dosyaları

### Veri Hazırlama Dosyaları

| Dosya | Açıklama |
|---|---|
| `dataset/processed/annotations_all_yolo.csv` | Tüm YOLO anotasyonlarının tablo hali |
| `dataset/processed/annotations_4class.csv` | D00, D10, D20, D40 sınıflarına indirgenmiş anotasyonlar |
| `dataset/processed/cropped_damage_metadata.csv` | Kırpılmış hasar görüntülerinin metadata tablosu |
| `dataset/processed/cropped_damage_metadata_balanced.csv` | Dengelenmiş veri tablosu |
| `dataset/processed/folds/fold_train_val_summary.csv` | Fold bazlı eğitim/doğrulama özetleri |

### Model Dosyaları

| Klasör | Açıklama |
|---|---|
| `models/basic_cnn/` | Basic CNN fold bazlı best/last model dosyaları |
| `models/mobilenetv2/` | MobileNetV2 fold bazlı best/last model dosyaları |
| `models/efficientnetb0/` | EfficientNetB0 fold bazlı best/last model dosyaları |

### Sonuç Dosyaları

| Dosya | Açıklama |
|---|---|
| `outputs/final_comparison/model_comparison_5fold.csv` | Tüm modellerin 5-fold ortalama sonuçları |
| `outputs/final_comparison/model_comparison_5fold_percent.csv` | Yüzdelik formatta model karşılaştırması |
| `outputs/*/*_5fold_all_metrics.csv` | Her modelin fold bazlı metrikleri |
| `outputs/*/*_5fold_summary_mean_std.csv` | Her modelin ortalama ve standart sapma değerleri |
| `outputs/*/*_confusion_matrix.csv` | Fold bazlı confusion matrix çıktıları |
| `outputs/*/*_classification_report.txt` | Fold bazlı precision, recall ve F1 raporları |
| `outputs/*/*_history.csv` | Eğitim sürecindeki accuracy/loss geçmişi |

### Görsel Dosyalar

| Klasör | Açıklama |
|---|---|
| `figures/basic_cnn/` | Basic CNN accuracy, loss ve confusion matrix görselleri |
| `figures/mobilenetv2/` | MobileNetV2 accuracy, loss ve confusion matrix görselleri |
| `figures/efficientnetb0/` | EfficientNetB0 accuracy, loss, confusion matrix ve örnek tahmin görselleri |
| `figures/final_comparison/` | Modellerin karşılaştırmalı accuracy ve F1 grafikleri |

---

## Google Colab Üzerinde Çalıştırma

Bu proje Google Colab ortamında yürütülmüştür. Ham veri seti büyük olduğu için proje paketine dahil edilmemiştir. Colab üzerinde çalıştırmak için genel akış aşağıdaki gibidir.

### 1. Google Drive Bağlantısı

```python
from google.colab import drive
drive.mount('/content/drive')
```

### 2. Proje Klasörünü Belirleme

```python
PROJECT_DIR = "/content/drive/MyDrive/Yol_Bozuklugu_Cukur_Tespiti"
```

### 3. Gerekli Kütüphaneler

```python
import os
import cv2
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import tensorflow as tf

from sklearn.model_selection import StratifiedGroupKFold
from sklearn.metrics import classification_report, confusion_matrix
from tensorflow.keras.models import load_model
```

### 4. Eğitilmiş Modeli Yükleme

```python
model_path = "models/efficientnetb0/efficientnetb0_fold3_best.keras"
model = load_model(model_path)
```

### 5. Tahmin Alma Mantığı

```python
# Örnek akış:
# 1. Görüntü okunur.
# 2. 224x224 boyutuna getirilir.
# 3. Normalize edilir.
# 4. Model tahmini alınır.
# 5. En yüksek olasılığa sahip sınıf sonuç olarak döndürülür.
```

---

## Mobil Uygulama Akışı

Mobil uygulama React Native / Expo yaklaşımıyla tasarlanmıştır. Uygulamada kullanıcı ve admin tarafı olmak üzere iki temel akış vardır.

### Kullanıcı Paneli

Kullanıcı panelinde amaç, kullanıcının telefon kamerası veya galeri üzerinden yol görüntüsü alarak modeli çalıştırmasıdır.

Temel işlevler:

- Yol görüntüsü seçme veya kamerayla fotoğraf çekme
- Görüntüyü analiz için API tarafına gönderme
- Hasar türünü ve güven skorunu görüntüleme
- Tespit edilen hasarı bildirim olarak sisteme kaydetme
- Daha önce gönderilen bildirimlerin durumunu takip etme

### Admin Paneli

Admin panelinde amaç, kullanıcılar tarafından gönderilen yol hasarı bildirimlerini takip etmektir.

Temel işlevler:

- Gelen yol hasarı bildirimlerini listeleme
- Bildirime ait fotoğraf, hasar türü, güven skoru, tarih ve konum bilgisini görüntüleme
- Bildirim durumunu güncelleme
- Durum seçenekleri: `İnceleniyor`, `Çözüldü`, `Çözülemedi`

---

## API Mantığı

Modelin mobil uygulama ile kullanılabilmesi için FastAPI tabanlı bir servis yapısı planlanmıştır. Bu yapı, mobil uygulamadan gelen görüntüyü alır, modeli çalıştırır ve tahmin sonucunu JSON formatında döndürür.

Örnek tahmin çıktısı:

```json
{
  "predicted_class": "D40",
  "class_name_tr": "Çukur",
  "confidence": 0.92,
  "message": "Yol yüzeyinde çukur tespit edildi."
}
```

Örnek sınıf eşlemesi:

```json
{
  "D00": "Boyuna çatlak",
  "D10": "Enine çatlak",
  "D20": "Timsah çatlağı",
  "D40": "Çukur"
}
```

---

## Değerlendirme Metrikleri

Projede model başarısını değerlendirmek için aşağıdaki metrikler kullanılmıştır:

- **Accuracy:** Doğru sınıflandırılan örneklerin tüm örneklere oranı.
- **Precision:** Modelin pozitif tahminlerinin ne kadarının doğru olduğunu gösterir.
- **Recall:** Gerçek pozitif örneklerin ne kadarının doğru yakalandığını gösterir.
- **Macro F1-score:** Her sınıfın F1 skorunun eşit ağırlıklı ortalamasıdır.
- **Weighted F1-score:** Sınıf örnek sayıları dikkate alınarak hesaplanan F1 skorudur.
- **Confusion matrix:** Sınıfların birbirine karışma durumunu gösterir.

Bu çalışmada özellikle **macro F1-score** önemlidir; çünkü çok sınıflı sınıflandırma problemlerinde her sınıfın başarısını dengeli biçimde değerlendirmeye yardımcı olur.

---

## Sonuç Özeti

Bu projede RDD2022 veri seti kullanılarak D00, D10, D20 ve D40 yol hasarı sınıfları için derin öğrenme tabanlı sınıflandırma yapılmıştır. YOLO formatındaki anotasyonlardan hasarlı bölgeler kırpılmış, veri dengelenmiş ve modeller 5-fold cross validation yöntemiyle değerlendirilmiştir.

Elde edilen sonuçlara göre:

1. EfficientNetB0 modeli en yüksek genel başarıyı elde etmiştir.
2. MobileNetV2 modeli daha hafif yapısına rağmen EfficientNetB0'a yakın sonuç vermiştir.
3. Basic CNN modeli temel karşılaştırma için yeterli olsa da transfer öğrenme modellerinden daha düşük performans göstermiştir.
4. 5-fold sonuçlarının standart sapma değerleri düşük olduğu için modellerin farklı veri bölmelerinde tutarlı sonuçlar verdiği görülmüştür.
5. Proje, yalnızca model eğitimiyle sınırlı kalmayıp mobil uygulama ve admin takip sistemiyle gerçek kullanıma yakın bir yapı sunmaktadır.

---

## Literatür Bağlantısı

Bu proje, yol hasarı tespiti, yol yüzeyi kalite analizi ve derin öğrenme tabanlı görüntü sınıflandırma çalışmalarına dayanmaktadır. Literatürde YOLO, Faster R-CNN, EfficientDet, MobileNet, EfficientNet ve çeşitli feature fusion yaklaşımları yol hasarı tespitinde sıkça kullanılmaktadır.

Bu çalışmanın literatüre göre öne çıkan yönleri:

- RDD2022 veri setinin dört temel yol hasarı sınıfına odaklanması
- Basic CNN, MobileNetV2 ve EfficientNetB0 modellerinin aynı 5-fold düzeninde karşılaştırılması
- Sadece başarı oranı değil, confusion matrix ve F1-score üzerinden sınıf bazlı değerlendirme yapılması
- Google Colab üzerinde tekrar üretilebilir bir deney akışı kurulması
- Mobil uygulama ile yol hasarı bildirim senaryosuna bağlanması

---

## Notlar

- Ham RDD2022 veri seti proje paketine dahil edilmemiştir.
- Büyük boyutlu model dosyaları `.keras` formatında saklanmıştır.
- Colab notebook bağlantısı teslim aşamasında README veya rapor içerisine ayrıca eklenmelidir.
- `models/efficientnetb0/efficientnetb0_fold3_best.keras` dosyası en iyi model adayıdır.
- Mobil uygulama tarafında modelin çalışması için API tarafında aynı ön işleme adımlarının uygulanması gerekir.

---

## Geliştiriciler

- Semanur YILDIRIM
- Şilan PEHLİVAN

---

## Lisans ve Kullanım

Bu çalışma, Derin Öğrenme dersi kapsamında akademik amaçla hazırlanmıştır. Veri seti, kullanılan açık kaynak kütüphaneler ve literatür kaynakları kendi kullanım koşullarına tabidir.
