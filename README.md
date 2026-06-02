# Road Damage AI - Yol Bozukluğu ve Çukur Tespiti

**Road Damage AI**, yol yüzeylerinde oluşan hasarları derin öğrenme modeli ile sınıflandıran ve mobil uygulama üzerinden kullanıcı/admin akışı sunan bir görüntü işleme projesidir. Projede kullanıcılar kamera veya galeri üzerinden yol görüntüsü seçerek analiz başlatabilir. Sistem, eğitilmiş yapay zekâ modeli ile hasar türünü ve güven skorunu hesaplar. Admin panelinde ise gelen yol sorunları listelenir ve durumları **İnceleniyor**, **Çözüldü** veya **Çözülemedi** olarak güncellenebilir.

Bu proje, derin öğrenme dersi kapsamında hazırlanmıştır. Model eğitimi Google Colab ortamında yapılmış, uygulama tarafında FastAPI backend ve React Native / Expo mobil arayüz geliştirilmiştir.

---

## Proje Özeti

Projenin temel amacı, telefon kamerası veya galeriden alınan yol görüntülerini analiz ederek yol hasarı türünü tespit etmektir. Çalışmada RDD2022 veri setinden elde edilen yol hasarı görüntüleri kullanılmıştır. Veri setindeki YOLO anotasyonlarından hasar bölgeleri kırpılmış ve bu kırpılmış görüntüler sınıflandırma modelleriyle eğitilmiştir.

Projede dört temel yol hasarı sınıfı kullanılmıştır:

| Sınıf Kodu | İngilizce Adı | Türkçe Karşılığı |
|---|---|---|
| D00 | Longitudinal Crack | Boyuna çatlak |
| D10 | Transverse Crack | Enine çatlak |
| D20 | Alligator Crack | Timsah çatlağı |
| D40 | Pothole | Çukur |

Model karşılaştırması için üç farklı mimari denenmiştir:

- Basic CNN
- MobileNetV2
- EfficientNetB0

5-Fold Cross Validation sonucunda en başarılı model EfficientNetB0 olmuştur. Bu nedenle backend tarafında tahmin işlemleri için `road_damage_efficientnetb0_best.keras` modeli kullanılmıştır.

---

## Kullanılan Teknolojiler

### Model Eğitimi

- Google Colab
- Python
- TensorFlow / Keras
- NumPy
- Pandas
- Matplotlib
- Scikit-learn
- OpenCV

### Backend

- Python
- FastAPI
- Uvicorn
- TensorFlow / Keras
- Pillow / OpenCV
- JSON tabanlı rapor kaydı

### Mobil Uygulama

- React Native
- Expo
- JavaScript
- Kamera / galeri üzerinden görsel seçimi
- Kullanıcı paneli
- Admin paneli

---

## Proje Dosya Yapısı

Aşağıdaki yapı, projenin VS Code içerisindeki sadeleştirilmiş ve teslim için anlamlı dosya yapısını göstermektedir. `.venv`, `node_modules`, `.expo`, `__pycache__` gibi otomatik oluşan klasörler bu yapıya dahil edilmemiştir.

```text
ROAD_DAMAGE_DETECTION_APP/
├── backend/
│   ├── app/
│   │   ├── data/
│   │   │   └── reports.json
│   │   ├── model/
│   │   │   ├── class_labels.json
│   │   │   ├── model_info.json
│   │   │   └── road_damage_efficientnetb0_best.keras
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── predict_routes.py
│   │   │   └── report_routes.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── prediction_service.py
│   │   │   └── report_service.py
│   │   ├── uploads/
│   │   │   └── .gitkeep
│   │   ├── utils/
│   │   │   ├── __init__.py
│   │   │   └── image_utils.py
│   │   ├── __init__.py
│   │   └── main.py
│   ├── requirements.txt
│   └── README.md
│
├── mobile/
│   ├── assets/
│   ├── App.js
│   ├── app.json
│   ├── eas.json
│   ├── index.js
│   ├── package.json
│   ├── package-lock.json
│   ├── LICENSE
│   ├── AGENTS.md
│   ├── CLAUDE.md
│   └── README.md
│
└── README.md
```

---

## Backend Yapısı

Backend tarafı FastAPI ile geliştirilmiştir. Backend, mobil uygulamadan gelen görselleri alır, eğitilmiş EfficientNetB0 modeline gönderir ve tahmin sonucunu JSON formatında döndürür. Ayrıca kullanıcı tarafından bildirilen yol sorunlarını `reports.json` dosyasında saklar.

### Önemli Backend Dosyaları

| Dosya | Açıklama |
|---|---|
| `backend/app/main.py` | FastAPI uygulamasının ana giriş dosyasıdır. |
| `backend/app/routes/predict_routes.py` | Görsel tahmini için kullanılan API rotalarını içerir. |
| `backend/app/routes/report_routes.py` | Yol sorunu kayıtlarını listeleme ve güncelleme rotalarını içerir. |
| `backend/app/services/prediction_service.py` | Model yükleme ve tahmin işlemlerini yürütür. |
| `backend/app/services/report_service.py` | Admin panelindeki rapor kayıtlarını yönetir. |
| `backend/app/utils/image_utils.py` | Görsel ön işleme işlemlerini içerir. |
| `backend/app/model/road_damage_efficientnetb0_best.keras` | Eğitilmiş derin öğrenme modelidir. |
| `backend/app/model/class_labels.json` | Modelin sınıf etiketlerini içerir. |
| `backend/app/model/model_info.json` | Model bilgilerini ve sınıf açıklamalarını içerir. |
| `backend/app/data/reports.json` | Kullanıcıların gönderdiği yol hasarı kayıtlarını saklar. |
| `backend/app/uploads/` | Kullanıcı tarafından yüklenen görsellerin tutulduğu klasördür. |

---

## Mobil Uygulama Yapısı

Mobil uygulama React Native / Expo ile geliştirilmiştir. Uygulama iki ana panelden oluşur:

1. **Kullanıcı Paneli**
2. **Admin Paneli**

### Kullanıcı Paneli

Kullanıcı panelinde kullanıcı kamera veya galeri üzerinden yol görüntüsü seçebilir. Ardından **Analiz Et** butonu ile görüntü backend tarafına gönderilir. Model, görüntüdeki yol hasarı türünü tahmin eder ve güven skorunu hesaplar.

Kullanıcı panelinde bulunan temel özellikler:

- Kamera ile fotoğraf alma
- Galeriden görsel seçme
- Seçilen görselin önizlemesini gösterme
- AI model analizi başlatma
- Backend API bağlantısı ile tahmin sonucu alma
- D00, D10, D20 ve D40 hasar sınıflarını destekleme

### Admin Paneli

Admin paneli, kullanıcılar tarafından sisteme gönderilen yol sorunlarının takip edilmesi için hazırlanmıştır. Admin, gelen kayıtları görebilir ve her kaydın durumunu değiştirebilir.

Admin panelinde bulunan temel özellikler:

- Gelen yol sorunlarını listeleme
- Toplam kayıt sayısını gösterme
- İncelenen ve çözülen kayıt sayılarını gösterme
- Her kayıt için hasar türünü ve güven skorunu görüntüleme
- Kayıt durumunu güncelleme:
  - İnceleniyor
  - Çözüldü
  - Çözülemedi

---

## Derin Öğrenme Modeli

Projede RDD2022 veri seti kullanılarak yol hasarı görüntüleri üzerinde sınıflandırma yapılmıştır. Model eğitimi Google Colab ortamında gerçekleştirilmiştir. Veri setinde yer alan YOLO formatındaki anotasyonlar okunmuş, hasarlı bölgeler kırpılmış ve sınıflandırma modeli için uygun hale getirilmiştir.

### Kullanılan Modeller

| Model | Açıklama |
|---|---|
| Basic CNN | Temel karşılaştırma modeli olarak kullanılmıştır. |
| MobileNetV2 | Hafif yapısı nedeniyle mobil uygulama senaryosu için değerlendirilmiştir. |
| EfficientNetB0 | En yüksek başarıyı veren model olarak backend tarafına entegre edilmiştir. |

### Ortalama 5-Fold Sonuçları

| Model | Ortalama Accuracy | Ortalama Macro F1 |
|---|---:|---:|
| Basic CNN | 0.8258 | 0.8259 |
| MobileNetV2 | 0.8760 | 0.8758 |
| EfficientNetB0 | 0.8866 | 0.8865 |

Sonuçlara göre EfficientNetB0 modeli en yüksek accuracy ve macro F1 değerlerine ulaşmıştır. MobileNetV2 modeli de EfficientNetB0'a yakın performans göstermiştir. Bu nedenle MobileNetV2, daha hafif mimarisi sayesinde mobil cihaz senaryoları için güçlü bir alternatif olarak değerlendirilebilir.

---

## API Kullanımı

Backend çalıştırıldıktan sonra mobil uygulama, API üzerinden tahmin ve rapor işlemlerini gerçekleştirir.

### Tahmin API'si

Görüntü tahmini için kullanılan endpoint:

```text
POST /api/predict
```

Bu endpoint, mobil uygulamadan gelen yol görüntüsünü alır ve model tahmin sonucunu döndürür.

Örnek dönüş yapısı:

```json
{
  "predicted_class": "D00",
  "label": "Boyuna çatlak",
  "confidence": 0.86,
  "description": "Yol doğrultusu boyunca ilerleyen boyuna çatlak tespit edildi."
}
```

### Rapor API'si

Yol sorunu kayıtlarını yönetmek için kullanılan endpointler:

```text
GET /api/reports
POST /api/reports
PATCH /api/reports/{report_id}/status
```

Bu endpointler ile admin panelinde gelen sorunlar listelenebilir ve durumları güncellenebilir.

---

## Kurulum ve Çalıştırma

### 1. Projeyi İndirme

```bash
git clone <repo-linki>
cd ROAD_DAMAGE_DETECTION_APP
```

Repo bağlantısı kullanılmayacaksa proje klasörü doğrudan VS Code ile açılabilir.

---

## Backend Kurulumu

Backend klasörüne geçilir:

```bash
cd backend
```

Sanal ortam oluşturulur:

```bash
python -m venv .venv
```

Windows PowerShell üzerinde sanal ortam aktif edilir:

```bash
.venv\\Scripts\\activate
```

Gerekli paketler yüklenir:

```bash
pip install -r requirements.txt
```

Backend çalıştırılır:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend çalıştıktan sonra API aşağıdaki adreste aktif olur:

```text
http://localhost:8000
```

Aynı ağdaki fiziksel telefondan test yapılacaksa `localhost` yerine bilgisayarın yerel IP adresi kullanılmalıdır. Örneğin:

```text
http://196.168.1.24:8080
```

---

## Mobil Uygulama Kurulumu

Yeni bir terminal açılarak mobil klasörüne geçilir:

```bash
cd mobile
```

Paketler yüklenir:

```bash
npm install
```

Expo uygulaması başlatılır:

```bash
npx expo start
```

Fiziksel cihazda test etmek için Expo Go uygulaması kullanılabilir. Android emülatör ile çalıştırmak için:

```bash
npx expo start --android
```

---

## Backend Bağlantı Adresi

Mobil uygulama fiziksel telefonda çalıştırılacaksa backend URL'si bilgisayarın yerel IP adresiyle ayarlanmalıdır.

Örnek:

```javascript
const API_BASE_URL = "http://196.168.1.24:8080";
```

Android emülatör kullanılacaksa genellikle şu adres tercih edilir:

```javascript
const API_BASE_URL = "http://10.0.2.2:8000";
```

Web veya bilgisayar üzerinden testlerde:

```javascript
const API_BASE_URL = "http://localhost:8000";
```

---

## Kullanım Akışı

### Kullanıcı Akışı

1. Mobil uygulama açılır.
2. Kullanıcı paneli seçilir.
3. Kamera veya galeri üzerinden yol görüntüsü seçilir.
4. Seçilen görüntü önizleme alanında gösterilir.
5. **Analiz Et** butonuna basılır.
6. Görüntü backend API'ye gönderilir.
7. Model hasar sınıfını ve güven skorunu hesaplar.
8. Sonuç kullanıcıya gösterilir.
9. İstenirse sonuç yol sorunu bildirimi olarak kaydedilir.

### Admin Akışı

1. Mobil uygulamada admin sekmesi açılır.
2. Sisteme gelen yol sorunu kayıtları listelenir.
3. Her kayıt için hasar türü, güven skoru ve tarih bilgisi görüntülenir.
4. Admin, kaydın durumunu günceller:
   - İnceleniyor
   - Çözüldü
   - Çözülemedi
5. Güncellenen durum kayıt dosyasına işlenir.

---

## Mobil Uygulama Arayüzü

Proje arayüzünde kullanıcı ve admin panelleri tamamlanmıştır.

### Kullanıcı Paneli

Kullanıcı panelinde kamera/galeri üzerinden görüntü seçme, önizleme ve analiz başlatma akışı bulunmaktadır.

### Admin Paneli

Admin panelinde gelen yol sorunları, güven skoru ve durum güncelleme butonları yer almaktadır.

---

## Projenin Öne Çıkan Yönleri

- RDD2022 veri seti üzerinde çalışılmıştır.
- D00, D10, D20 ve D40 olmak üzere dört farklı yol hasarı sınıfı desteklenmiştir.
- Basic CNN, MobileNetV2 ve EfficientNetB0 modelleri karşılaştırılmıştır.
- 5-Fold Cross Validation ile daha güvenilir değerlendirme yapılmıştır.
- EfficientNetB0 modeli backend sistemine entegre edilmiştir.
- FastAPI ile API tabanlı tahmin servisi oluşturulmuştur.
- React Native / Expo ile mobil kullanıcı ve admin paneli geliştirilmiştir.
- Kullanıcıdan gelen yol sorunları admin panelinde takip edilebilir hale getirilmiştir.
- Proje yalnızca model eğitimiyle sınırlı kalmamış, uçtan uca çalışan bir mobil destekli sisteme dönüştürülmüştür.

---

## Geliştiriciler

- Semanur YILDIRIM
- Şilan PEHLİVAN

---

## Ders ve Proje Bilgisi

Bu proje, derin öğrenme dersi kapsamında görüntü işleme ve yol hasarı tespiti alanında hazırlanmıştır. Çalışmada model eğitimi, model karşılaştırması, backend API geliştirme ve mobil arayüz tasarımı bir arada yürütülmüştür.

---

## Lisans

Bu proje eğitim amacıyla geliştirilmiştir. Kullanılan açık kaynak kütüphanelerin kendi lisans koşulları geçerlidir.
