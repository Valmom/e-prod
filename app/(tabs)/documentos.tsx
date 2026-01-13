import ScreenLayout from "@/components/ScreenLayout";
import { eprodapi } from "@/services/api";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

interface Documento {
  id: string;
  name: string;
  url: string;
}

const { width } = Dimensions.get("window");

export default function Documentos() {
  const [diretorios, setDiretorios] = useState<string[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [visualizando, setVisualizando] = useState<string | null>(null);
  const [modoDiretorio, setModoDiretorio] = useState(true);
  const [diretorioAtual, setDiretorioAtual] = useState<string | null>(null);
  const [nomeDiretorio, setNomeDiretorio] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [documentoAtual, setDocumentoAtual] = useState<Documento | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchDiretorios = async () => {
      try {
        const tokenEprod = await SecureStore.getItemAsync("eprod-token");
        const response = await eprodapi.get("/v1/documents/directories", {
          headers: {
            Authorization: `Bearer ${tokenEprod}`,
            "Content-Type": "application/json",
          },
        });
        setDiretorios(response.data);
      } catch (error) {
        console.error("Erro ao carregar diretórios:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDiretorios();
  }, []);

  const abrirDiretorio = async (dir: string) => {
    setLoading(true);
    try {
      const tokenEprod = await SecureStore.getItemAsync("eprod-token");
      const response = await eprodapi.get(`/v1/documents/${encodeURIComponent(dir)}`, {
        headers: {
          Authorization: `Bearer ${tokenEprod}`,
          "Content-Type": "application/json",
        },
      });
      setDocumentos(response.data);
      setModoDiretorio(false);
      setDiretorioAtual(dir);
      setNomeDiretorio(dir);
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
    } finally {
      setLoading(false);
    }
  };

  const voltarDiretorios = () => {
    setModoDiretorio(true);
    setDiretorioAtual(null);
    setDocumentos([]);
  };

  const abrirDocumento = (documento: Documento) => {
    setDocLoading(true);
    setVisualizando(documento.url);
    setDocumentoAtual(documento);
  };

  const renderDiretorioItem = ({ item }: { item: string }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => abrirDiretorio(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Ionicons name="folder-open" size={24} color="#007AFF" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item}</Text>
          <Text style={styles.cardSubtitle}>Pasta de documentos</Text>
        </View>
        <TouchableOpacity 
          onPress={() => abrirDiretorio(item)}
          style={styles.actionButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="keyboard-arrow-right" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderDocumentoItem = ({ item }: { item: Documento }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Ionicons name="document-text" size={24} color="#FF9500" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.cardSubtitle}>Documento PDF</Text>
        </View>
        <TouchableOpacity 
          onPress={() => abrirDocumento(item)}
          style={styles.actionButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="visibility" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <ScreenLayout title="🧠 Base de Conhecimento">
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loaderText}>Carregando...</Text>
          </View>
        ) : (
          <>
            {!modoDiretorio && (
              <TouchableOpacity style={styles.backButton} onPress={voltarDiretorios}>
                <Ionicons name="arrow-back" size={18} color="#007AFF" />
                <View style={styles.textContainerButton}>
                  <Text style={styles.backButtonText} numberOfLines={1}>
                    {nomeDiretorio}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {modoDiretorio ? (
              <FlatList
                data={diretorios}
                keyExtractor={(item, index) => encodeURIComponent(item) + index}
                contentContainerStyle={styles.listContent}
                renderItem={renderDiretorioItem}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons name="folder-open" size={48} color="#ccc" />
                    <Text style={styles.emptyStateText}>Nenhum diretório encontrado</Text>
                  </View>
                }
              />
            ) : (
              <FlatList
                data={documentos}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={renderDocumentoItem}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Ionicons name="document" size={48} color="#ccc" />
                    <Text style={styles.emptyStateText}>Nenhum documento neste diretório</Text>
                  </View>
                }
              />
            )}
          </>
        )}
      </ScreenLayout>

      {/* Modal para exibir documento */}
      <Modal
        visible={!!visualizando}
        animationType="slide"
        onRequestClose={() => {
          setVisualizando(null);
          setDocumentoAtual(null);
        }}
        transparent={false}
        statusBarTranslucent={true}
      >
        <View style={{ flex: 1, backgroundColor: "#F5F6FA", paddingTop: insets.top }}>
          <LinearGradient
            colors={['#007AFF', '#0056b3']}
            style={styles.modalHeader}
          >
            <View style={styles.modalHeaderContent}>
              <Ionicons name="document" size={20} color="#fff" />
              <View>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {documentoAtual?.name || "Visualizando Documento"}
                </Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {diretorioAtual ? `Diretório: ${diretorioAtual}` : "Base de Conhecimento"}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={() => {
                setVisualizando(null);
                setDocumentoAtual(null);
              }} 
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>
          
          {docLoading && (
            <View style={styles.modalLoader}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.modalLoaderText}>Carregando documento...</Text>
            </View>
          )}
          
          <WebView
            source={{
              uri: `https://docs.google.com/gview?url=${visualizando}&embedded=true`,
            }}
            style={{ flex: 1 }}
            onLoad={() => setDocLoading(false)}
            onError={() => setDocLoading(false)}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: "#555",
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: width - 32,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  textContainerButton: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },  
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#666",
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f0f7ff",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
    alignSelf: "flex-start",
    width: '100%'
  },
  backButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  modalHeader: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  modalHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  modalSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "400",
  },
  modalCloseButton: {
    padding: 4,
    marginLeft: 12,
  },
  modalLoader: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: "center",
    zIndex: 1000,
  },
  modalLoaderText: {
    marginTop: 8,
    color: "#007AFF",
    fontSize: 14,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    width: width - 32,
    alignSelf: "center",
  },
  emptyStateText: {
    marginTop: 16,
    color: "#666",
    fontSize: 16,
    textAlign: "center",
  },
});