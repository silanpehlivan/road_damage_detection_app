import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";

const API_BASE_URL = "http://10.254.147.182:8000";

const DAMAGE_INFO = {
  D00: {
    title: "Boyuna Çatlak",
    icon: "┃",
    color: "#2563EB",
    bg: "#DBEAFE",
    text: "Yol doğrultusu boyunca ilerleyen çatlak türüdür.",
  },
  D10: {
    title: "Enine Çatlak",
    icon: "━",
    color: "#7C3AED",
    bg: "#EDE9FE",
    text: "Yol doğrultusuna dik oluşan çatlak türüdür.",
  },
  D20: {
    title: "Timsah Çatlağı",
    icon: "▦",
    color: "#EA580C",
    bg: "#FFEDD5",
    text: "Ağ biçiminde yayılan çoklu çatlak yapısıdır.",
  },
  D40: {
    title: "Çukur",
    icon: "●",
    color: "#DC2626",
    bg: "#FEE2E2",
    text: "Yol yüzeyinde çukur veya oyuk oluşumudur.",
  },
};

const STATUS_STYLE = {
  İnceleniyor: {
    bg: "#FEF3C7",
    color: "#92400E",
  },
  Çözüldü: {
    bg: "#DCFCE7",
    color: "#166534",
  },
  Çözülemedi: {
    bg: "#FEE2E2",
    color: "#991B1B",
  },
};

const normalizeImageUri = async (uri) => {
  try {
    const extensionFromUri =
      uri.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";

    const safeExtension = extensionFromUri === "png" ? "png" : "jpg";

    const newPath = `${FileSystem.cacheDirectory}road_damage_${Date.now()}.${safeExtension}`;

    await FileSystem.copyAsync({
      from: uri,
      to: newPath,
    });

    return newPath;
  } catch (error) {
    console.log("Görsel cache alanına kopyalanamadı:", error.message);
    return uri;
  }
};

const buildPreviewUri = (asset) => {
  if (asset?.base64) {
    const mimeType = asset.mimeType || "image/jpeg";
    return `data:${mimeType};base64,${asset.base64}`;
  }

  return asset?.uri || null;
};

export default function App() {
  const [panel, setPanel] = useState("user");
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImageUri, setPreviewImageUri] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);

  const getDamageInfo = (code) => {
    return DAMAGE_INFO[code] || {
      title: "Bilinmeyen Hasar",
      icon: "!",
      color: "#374151",
      bg: "#E5E7EB",
      text: "Yol yüzeyinde hasar olabilecek bir bölge tespit edildi.",
    };
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("İzin gerekli", "Galeriden görsel seçebilmek için izin vermelisin.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const copiedUri = await normalizeImageUri(asset.uri);
      const previewUri = buildPreviewUri(asset) || copiedUri;

      setSelectedImage(copiedUri);
      setPreviewImageUri(previewUri);
      setPrediction(null);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("İzin gerekli", "Kamera kullanabilmek için izin vermelisin.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.85,
      base64: true,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const copiedUri = await normalizeImageUri(asset.uri);
      const previewUri = buildPreviewUri(asset) || copiedUri;

      setSelectedImage(copiedUri);
      setPreviewImageUri(previewUri);
      setPrediction(null);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) {
      Alert.alert("Görsel seçilmedi", "Önce kamera ile fotoğraf çek veya galeriden görsel seç.");
      return;
    }

    try {
      setLoading(true);

      const uploadResult = await FileSystem.uploadAsync(
        `${API_BASE_URL}/predict`,
        selectedImage,
        {
          httpMethod: "POST",
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: "file",
          mimeType: "image/jpeg",
          parameters: {},
        }
      );

      const data = JSON.parse(uploadResult.body);

      if (uploadResult.status < 200 || uploadResult.status >= 300) {
        throw new Error(data.detail || "Analiz sırasında hata oluştu.");
      }

      setPrediction(data);
    } catch (error) {
      Alert.alert("Analiz Hatası", error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendReport = async () => {
    if (!prediction || !selectedImage) {
      Alert.alert("Eksik bilgi", "Önce görseli analiz etmelisin.");
      return;
    }

    try {
      setLoading(true);

      const uploadResult = await FileSystem.uploadAsync(
        `${API_BASE_URL}/reports`,
        selectedImage,
        {
          httpMethod: "POST",
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: "file",
          mimeType: "image/jpeg",
          parameters: {
            damage_code: String(prediction.damage_code),
            damage_name: String(prediction.damage_name),
            confidence: String(prediction.confidence),
            description: String(prediction.description),
          },
        }
      );

      const data = JSON.parse(uploadResult.body);

      if (uploadResult.status < 200 || uploadResult.status >= 300) {
        throw new Error(data.detail || "Bildirim gönderilemedi.");
      }

      Alert.alert("Başarılı", "Sorun bildirimi admin paneline gönderildi.");
      await loadReports();
    } catch (error) {
      Alert.alert("Bildirim Hatası", error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/reports`);
      const data = await response.json();

      if (response.ok) {
        setReports(data);
      }
    } catch (error) {
      console.log("Raporlar alınamadı:", error.message);
    }
  };

  const updateStatus = async (reportId, status) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("status", status);

      const response = await fetch(`${API_BASE_URL}/reports/${reportId}/status`, {
        method: "PUT",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Durum güncellenemedi.");
      }

      await loadReports();
    } catch (error) {
      Alert.alert("Durum Hatası", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const renderConfidenceBar = (percent) => {
    const width = Math.max(4, Math.min(100, Number(percent) || 0));

    return (
      <View style={styles.confidenceOuter}>
        <View style={[styles.confidenceInner, { width: `${width}%` }]} />
      </View>
    );
  };

  const renderUserPanel = () => {
    const damageInfo = prediction ? getDamageInfo(prediction.damage_code) : null;

    return (
      <View>
        <View style={styles.heroCard}>
          <View>
            <Text style={styles.heroSmall}>Yapay Zekâ Destekli Analiz</Text>
            <Text style={styles.heroTitle}>Yol hasarını saniyeler içinde tespit et</Text>
            <Text style={styles.heroText}>
              Kamera veya galeri üzerinden yol görüntüsü yükle, model hasar türünü ve güven skorunu hesaplasın.
            </Text>
          </View>
        </View>

        <View style={styles.quickStatsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>Hasar sınıfı</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>AI</Text>
            <Text style={styles.statLabel}>Model analizi</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>API</Text>
            <Text style={styles.statLabel}>Backend bağlı</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Görüntü Seçimi</Text>
          <Text style={styles.infoText}>
            Yol yüzeyini net gösterecek bir fotoğraf seçerek analiz başlatabilirsin.
          </Text>

          <View style={styles.row}>
            <TouchableOpacity style={styles.primaryButton} onPress={takePhoto}>
              <Text style={styles.buttonIcon}>📷</Text>
              <Text style={styles.buttonText}>Kamera</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
              <Text style={styles.secondaryButtonIcon}>🖼️</Text>
              <Text style={styles.secondaryButtonText}>Galeri</Text>
            </TouchableOpacity>
          </View>

          {previewImageUri ? (
            <View style={styles.imageFrame}>
              <Image
                key={previewImageUri}
                source={{ uri: previewImageUri }}
                style={styles.previewImage}
                resizeMode="cover"
                onError={(error) => {
                  console.log("Önizleme görseli yüklenemedi:", error.nativeEvent);
                }}
              />
              <View style={styles.imageLabel}>
                <Text style={styles.imageLabelText}>Seçilen Görsel</Text>
              </View>
            </View>
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderIcon}>🛣️</Text>
              <Text style={styles.placeholderText}>Henüz görsel seçilmedi</Text>
            </View>
          )}

          <TouchableOpacity style={styles.analyzeButton} onPress={analyzeImage}>
            <Text style={styles.buttonText}>Analiz Et</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#1F3C88" />
            <Text style={styles.loadingText}>Model görüntüyü analiz ediyor...</Text>
          </View>
        )}

        {prediction && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={[styles.damageIconBox, { backgroundColor: damageInfo.bg }]}>
                <Text style={[styles.damageIcon, { color: damageInfo.color }]}>
                  {damageInfo.icon}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.resultMiniTitle}>Analiz Sonucu</Text>
                <Text style={styles.resultMainTitle}>{prediction.damage_name}</Text>
              </View>

              <View style={[styles.codeBadge, { backgroundColor: damageInfo.bg }]}>
                <Text style={[styles.codeBadgeText, { color: damageInfo.color }]}>
                  {prediction.damage_code}
                </Text>
              </View>
            </View>

            <Text style={styles.description}>{prediction.description}</Text>

            <View style={styles.confidenceBox}>
              <View style={styles.confidenceTop}>
                <Text style={styles.confidenceLabel}>Güven Skoru</Text>
                <Text style={styles.confidenceValue}>
                  %{prediction.confidence_percent}
                </Text>
              </View>
              {renderConfidenceBar(prediction.confidence_percent)}
            </View>

            {prediction.top_predictions && (
              <View style={styles.predictionList}>
                <Text style={styles.subTitle}>Modelin sınıf olasılıkları</Text>

                {prediction.top_predictions.slice(0, 4).map((item) => {
                  const info = getDamageInfo(item.damage_code);
                  return (
                    <View key={item.damage_code} style={styles.predictionItem}>
                      <View style={styles.predictionLeft}>
                        <View style={[styles.smallDot, { backgroundColor: info.color }]} />
                        <Text style={styles.predictionName}>
                          {item.damage_code} - {item.damage_name}
                        </Text>
                      </View>

                      <Text style={styles.predictionPercent}>
                        %{Math.round(item.confidence * 100)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            <TouchableOpacity style={styles.reportButton} onPress={sendReport}>
              <Text style={styles.buttonText}>Admin Paneline Bildir</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderAdminPanel = () => (
    <View>
      <View style={styles.adminTopCard}>
        <View>
          <Text style={styles.heroSmallDark}>Yönetim Paneli</Text>
          <Text style={styles.adminTitle}>Gelen Yol Sorunları</Text>
          <Text style={styles.adminText}>
            Kullanıcıların gönderdiği hasar kayıtlarını görüntüle ve durumlarını güncelle.
          </Text>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={loadReports}>
          <Text style={styles.refreshText}>Yenile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickStatsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{reports.length}</Text>
          <Text style={styles.statLabel}>Toplam kayıt</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {reports.filter((item) => item.status === "İnceleniyor").length}
          </Text>
          <Text style={styles.statLabel}>İnceleniyor</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {reports.filter((item) => item.status === "Çözüldü").length}
          </Text>
          <Text style={styles.statLabel}>Çözüldü</Text>
        </View>
      </View>

      {reports.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>Henüz bildirim yok</Text>
          <Text style={styles.infoText}>
            Kullanıcı panelinden gönderilen yol sorunları burada listelenecek.
          </Text>
        </View>
      ) : (
        reports.map((report) => {
          const damageInfo = getDamageInfo(report.damage_code);
          const statusStyle = STATUS_STYLE[report.status] || STATUS_STYLE.İnceleniyor;

          return (
            <View key={report.id} style={styles.reportCard}>
              <View style={styles.reportTop}>
                <View style={[styles.reportIconBox, { backgroundColor: damageInfo.bg }]}>
                  <Text style={[styles.reportIcon, { color: damageInfo.color }]}>
                    {damageInfo.icon}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.reportDamage}>
                    {report.damage_code} - {report.damage_name}
                  </Text>
                  <Text style={styles.dateText}>{report.created_at}</Text>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.statusText, { color: statusStyle.color }]}>
                    {report.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.reportText}>{report.description}</Text>

              <View style={styles.reportConfidence}>
                <Text style={styles.confidenceLabel}>Güven Skoru</Text>
                <Text style={styles.confidenceValue}>
                  %{Math.round(Number(report.confidence) * 100)}
                </Text>
              </View>

              <View style={styles.statusButtons}>
                <TouchableOpacity
                  style={styles.smallButtonWarning}
                  onPress={() => updateStatus(report.id, "İnceleniyor")}
                >
                  <Text style={styles.smallButtonText}>İnceleniyor</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.smallButtonSuccess}
                  onPress={() => updateStatus(report.id, "Çözüldü")}
                >
                  <Text style={styles.smallButtonText}>Çözüldü</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.smallButtonDanger}
                  onPress={() => updateStatus(report.id, "Çözülemedi")}
                >
                  <Text style={styles.smallButtonText}>Çözülemedi</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>🛣️</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Road Damage AI</Text>
          <Text style={styles.subtitle}>Yol bozukluğu ve çukur tespiti</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, panel === "user" && styles.activeTab]}
          onPress={() => setPanel("user")}
        >
          <Text style={[styles.tabText, panel === "user" && styles.activeTabText]}>
            Kullanıcı
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, panel === "admin" && styles.activeTab]}
          onPress={() => {
            setPanel("admin");
            loadReports();
          }}
        >
          <Text style={[styles.tabText, panel === "admin" && styles.activeTabText]}>
            Admin
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {panel === "user" ? renderUserPanel() : renderAdminPanel()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF3FA",
  },
  header: {
    backgroundColor: "#132A5E",
    paddingTop: 46,
    paddingBottom: 22,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconText: {
    fontSize: 26,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  subtitle: {
    color: "#C7D2FE",
    marginTop: 4,
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 18,
    marginTop: -18,
    padding: 6,
    borderRadius: 18,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#1F3C88",
  },
  tabText: {
    color: "#4B5563",
    fontWeight: "800",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  content: {
    padding: 18,
    paddingBottom: 44,
  },
  heroCard: {
    backgroundColor: "#1F3C88",
    borderRadius: 26,
    padding: 22,
    marginTop: 4,
    shadowColor: "#1F3C88",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 5,
  },
  heroSmall: {
    color: "#BFDBFE",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
  },
  heroSmallDark: {
    color: "#1F3C88",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 6,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 31,
  },
  heroText: {
    color: "#DBEAFE",
    marginTop: 10,
    lineHeight: 21,
    fontSize: 14,
  },
  quickStatsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1F3C88",
  },
  statLabel: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 21,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#1F3C88",
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 7,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#EFF6FF",
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    flexDirection: "row",
    justifyContent: "center",
    gap: 7,
  },
  buttonIcon: {
    fontSize: 16,
  },
  secondaryButtonIcon: {
    fontSize: 16,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
  secondaryButtonText: {
    color: "#1F3C88",
    fontWeight: "900",
  },
  imageFrame: {
    marginTop: 18,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },
  previewImage: {
    width: "100%",
    height: 235,
  },
  imageLabel: {
    position: "absolute",
    left: 12,
    top: 12,
    backgroundColor: "rgba(17,24,39,0.75)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  imageLabelText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  placeholderImage: {
    height: 185,
    backgroundColor: "#F8FAFC",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  placeholderIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  placeholderText: {
    color: "#9CA3AF",
    fontWeight: "800",
  },
  analyzeButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 17,
    alignItems: "center",
    marginTop: 18,
  },
  loadingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginTop: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  loadingText: {
    marginTop: 10,
    color: "#4B5563",
    fontWeight: "700",
  },
  resultCard: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 24,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  damageIconBox: {
    width: 52,
    height: 52,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  damageIcon: {
    fontSize: 28,
    fontWeight: "900",
  },
  resultMiniTitle: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "800",
  },
  resultMainTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
  },
  codeBadge: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 999,
  },
  codeBadgeText: {
    fontWeight: "900",
  },
  description: {
    fontSize: 14,
    color: "#4B5563",
    marginTop: 14,
    lineHeight: 21,
  },
  confidenceBox: {
    marginTop: 16,
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 18,
  },
  confidenceTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 9,
  },
  confidenceLabel: {
    color: "#6B7280",
    fontWeight: "800",
    fontSize: 13,
  },
  confidenceValue: {
    color: "#111827",
    fontWeight: "900",
    fontSize: 14,
  },
  confidenceOuter: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  confidenceInner: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#16A34A",
  },
  predictionList: {
    marginTop: 16,
  },
  subTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 10,
  },
  predictionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  predictionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  smallDot: {
    width: 9,
    height: 9,
    borderRadius: 99,
  },
  predictionName: {
    color: "#4B5563",
    fontWeight: "700",
    fontSize: 13,
  },
  predictionPercent: {
    color: "#111827",
    fontWeight: "900",
  },
  reportButton: {
    backgroundColor: "#16A34A",
    paddingVertical: 16,
    borderRadius: 17,
    alignItems: "center",
    marginTop: 18,
  },
  adminTopCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginTop: 4,
  },
  adminTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: "#111827",
  },
  adminText: {
    color: "#6B7280",
    marginTop: 8,
    lineHeight: 21,
  },
  refreshButton: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 13,
    alignSelf: "flex-start",
    marginTop: 14,
  },
  refreshText: {
    color: "#1F3C88",
    fontWeight: "900",
  },
  emptyBox: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 22,
    marginTop: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyIcon: {
    fontSize: 42,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 8,
  },
  reportCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 22,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  reportTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  reportIconBox: {
    width: 45,
    height: 45,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  reportIcon: {
    fontSize: 23,
    fontWeight: "900",
  },
  reportDamage: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "900",
  },
  reportText: {
    color: "#4B5563",
    marginTop: 12,
    lineHeight: 20,
  },
  dateText: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 3,
  },
  reportConfidence: {
    marginTop: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  smallButtonWarning: {
    flex: 1,
    backgroundColor: "#F59E0B",
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
  },
  smallButtonSuccess: {
    flex: 1,
    backgroundColor: "#16A34A",
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
  },
  smallButtonDanger: {
    flex: 1,
    backgroundColor: "#DC2626",
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
  },
  smallButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 11,
  },
});