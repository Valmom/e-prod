import ScreenLayout from "@/components/ScreenLayout";
import { api } from "@/services/api";
import { alertService } from "@/services/api/sendJustification";
import { getAccessToken, isTokenExpired } from '@/utils/auth';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { router } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";
import { alertStyles } from "../../styles/alert/style";

// FUNÇÕES DEFINIDAS ANTES DO COMPONENTE
const getCardTheme = (status: string) => {
  switch (status) {
    case "Recusado":
      return {
        backgroundColor: "#FFF5F5",
        borderColor: "#FEE2E2",
        textColor: "#B91C1C",
        buttonColor: "#DC2626",
        buttonTextColor: "#fff",
        iconColor: "#EF4444",        
      };
    case "Não Respondido":
      return {
        backgroundColor: "#FFFBEB",
        borderColor: "#FEF3C7",
        textColor: "#92400E",
        buttonColor: "#F59E0B",
        buttonTextColor: "#fff",
        iconColor: "#F97316",
      };
    case "Aguardando Resposta":
      return {
        backgroundColor: "#EFF6FF",
        borderColor: "#DBEAFE",
        textColor: "#1E40AF",
        buttonColor: "#3B82F6",
        buttonTextColor: "#fff",
        iconColor: "#2563EB",
      };
    default:
      return {
        backgroundColor: "#F5F5F5",
        borderColor: "#E5E5E5",
        textColor: "#404040",
        buttonColor: "#737373",
        buttonTextColor: "#fff",
        iconColor: "#525252",
      };
  }
};

const ReturnColor = (description: string): string => {
  switch (description) {
    case 'Aprovado': return '#00b48b';
    case 'Aguardando Resposta': return '#f04324';
    case 'Aguardando Aprovação': return '#0e459c';
    case 'Não Respondido': return '#d63333';
    case 'Recusado': return '#f04324';
    case 'Não Avaliado': return 'orange';
    default: return '#038a25';
  }
};

interface Alerta {
  id: string;
  status: string;
  classificacao: string;
  prefixo: string;
  prefixoId: string;
  descricao: string;
  acaoCorretivaId: string;
  dataOcorrencia: string;
  icone?: string;
  classificacaoId?: string;
  justificativa?: string;
  acaoCorretiva?: string;
}

interface HistoricoItem {
  time: string;
  title: string;
  description: string;
  circleColor: string;
}

interface Classificacao {
  key: string;
  value: string;
}

interface AcaoCorretivaAPI {
  id: string;
  codigo: string;
  tipoAlerta: string;
  prefixoId: string;
  prefixo: string;
  dataOcorrencia: string;
  status: string;
  statusCor: string;
  classificacaoId: string;
  classificacao: string;
  value?: string;
  descricao?: string;
  nome?: string;
  titulo?: string;
}

const acoesCorretivasPadrao = [
  { key: "1", value: "Equipe em treinamento" },
  { key: "2", value: "Problema técnico resolvido" },
  { key: "3", value: "Manutenção preventiva" },
  { key: "4", value: "Falso positivo" },
  { key: "5", value: "Outro" }
];

export default function Alertas() {
  const theme = useColorScheme();
  const isDark = theme === "dark";
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [alertaSelecionado, setAlertaSelecionado] = useState<Alerta | null>(null);
  const [justificativa, setJustificativa] = useState("");
  const [acaoCorretivaId, setAcaoCorretivaId] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modalAnexoVisible, setModalAnexoVisible] = useState(false);
  const [fotos, setFotos] = useState<{uri: string, type: string, name: string}[]>([]);
  const [erroAnexo, setErroAnexo] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAcoesDropdown, setShowAcoesDropdown] = useState(false);
  const [searchAcaoText, setSearchAcaoText] = useState("");
  const [filteredAcoes, setFilteredAcoes] = useState<Classificacao[]>([]);
  const [classificacoes, setClassificacoes] = useState<Classificacao[]>([]);
  const [classificacao, setClassificacao] = useState<Classificacao | undefined>(undefined);
  const [acoesCorretivasAPI, setAcoesCorretivasAPI] = useState<AcaoCorretivaAPI[]>([]);
  const [loadingAcoes, setLoadingAcoes] = useState(false);
  const [enviando, setEnviando] = useState(false);
  
  const MAX_FOTOS = 5;

  const fetchAlertas = async () => {
    try {
      const response = await api.get('/alertas/table-alerta');
      setAlertas(response.data);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar os alertas");
    }
  };
  
  const fetchClassificacoes = async () => {
    try {
      const response = await api.get('/classificacoes');
      setClassificacoes(response.data);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar as classificações");
    }
  };
  
  const extrairValorAcao = (acao: AcaoCorretivaAPI): string => {
    return acao.value || 
           acao.descricao || 
           acao.nome || 
           acao.titulo || 
           acao.classificacao || 
           acao.tipoAlerta || 
           acao.status || 
           acao.id || 
           "Ação sem descrição";
  };
  
  const fetchAcoesCorretivas = async (classificacaoId: string) => {
    setLoadingAcoes(true);
    try {
      const response = await api.get(`/acoes-corretivas/${classificacaoId}`);

      setAcoesCorretivasAPI(response.data);
      
      const acoes = response.data.map((acao: any) => ({
        key: acao.codigo,
        value: acao.descricao
      }));

      setFilteredAcoes(filteredAcoes);
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Não foi possível carregar as ações corretivas");
      setFilteredAcoes(acoesCorretivasPadrao);
    } finally {
      setLoadingAcoes(false);
    }
  };
  
  useEffect(() => {
    async function fetchData() {
      const token = await getAccessToken();
      if (!token || isTokenExpired(token)) {
        router.navigate("/login");
        return;
      }
      fetchAlertas();
      fetchClassificacoes();
    }
    fetchData();
  }, []);
  
  useEffect(() => {
    (async () => {
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      const mediaStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      setCameraPermission(
        cameraStatus.status === 'granted' && 
        mediaStatus.status === 'granted'
      );
    })();
  }, []);
  
  useEffect(() => {
    if (searchAcaoText.trim() === "") {
      setFilteredAcoes(acoesCorretivasAPI.map(acao => ({
        key: acao.codigo,
        value: extrairValorAcao(acao)
      })));
    } else {
      const filtered = acoesCorretivasAPI
        .map(acao => ({
          key: acao.codigo,
          value: extrairValorAcao(acao)
        }))
        .filter(item => item.value.toLowerCase().includes(searchAcaoText.toLowerCase()));
      
      setFilteredAcoes(filtered);
    }
  }, [searchAcaoText, acoesCorretivasAPI]);
  
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlertas();
    await fetchClassificacoes();
    setRefreshing(false);
  };
  
  const carregarHistorico = async (alertaId: string, alerta: Alerta) => {
    setLoadingHistorico(true);
    setAlertaSelecionado(alerta);
    setMostrarFormulario(false);
    setFotos([]);
    setErroAnexo(false);
    setSearchAcaoText("");
    setShowAcoesDropdown(false);
    
    try {
      const response = await api.get('/alertas/historico-alerta', {
        params: { AlertaId: alertaId }
      });

      const json = response.data;

      const list = json.map((item: any) => ({
        time: item.dataOcorrencia || '',
        title: item.status || '',
        description: item.descricaoAlerta || '',
        circleColor: ReturnColor(item.status || '')
      }));
      
      setHistorico(list);
      
      if (classificacoes.length === 0) {
        await fetchClassificacoes();
      }
      
      const classificacaoEncontrada = classificacoes.find(
        c => c.value === alerta.classificacao
      );

      if (classificacaoEncontrada) {
        setClassificacao(classificacaoEncontrada);
        await fetchAcoesCorretivas(classificacaoEncontrada.key);
      } else {
        setFilteredAcoes(acoesCorretivasPadrao);
        setAcoesCorretivasAPI([]);
      }
      
      setModalVisible(true);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar o histórico");
    } finally {
      setLoadingHistorico(false);
    }
  };
  
  const fecharModal = () => {
    setModalVisible(false);
    setHistorico([]);
    setAlertaSelecionado(null);
    setMostrarFormulario(false);
    setFotos([]);
    setErroAnexo(false);
    setSearchAcaoText("");
    setShowAcoesDropdown(false);
    setAcoesCorretivasAPI([]);
    setJustificativa("");
    setAcaoCorretivaId("");
  };
  
  async function tirarFoto() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão necessária", "É necessário conceder permissão para usar a câmera.");
        return;
      }

      if (fotos.length >= MAX_FOTOS) {
        Alert.alert("Limite atingido", `Você pode anexar no máximo ${MAX_FOTOS} fotos.`);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        aspect: [4, 3],
        quality: 0.8,
        exif: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const novaFoto = {
          uri: result.assets[0].uri,
          type: result.assets[0].type || "image/jpeg",
          name: `foto_${Date.now()}.jpg`,
          width: result.assets[0].width,
          height: result.assets[0].height,
        };
        
        setFotos(prev => [...prev, novaFoto]);
        setErroAnexo(false);
      }

      setModalAnexoVisible(false);

    } catch (error) {
      console.error("Erro ao tirar foto:", error);
      Alert.alert("Erro", "Não foi possível capturar a foto");
    }
  }

  async function selecionarDaGaleria() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão necessária", "É necessário conceder permissão para acessar a galeria.");
        return;
      }

      if (fotos.length >= MAX_FOTOS) {
        Alert.alert("Limite atingido", `Você pode anexar no máximo ${MAX_FOTOS} fotos.`);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: MAX_FOTOS - fotos.length,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const novasFotos = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type || "image/jpeg",
          name: `foto_${Date.now()}_${asset.assetId}.jpg`,
          width: asset.width,
          height: asset.height,
        }));
        
        setFotos(prev => [...prev, ...novasFotos]);
        setErroAnexo(false);
      }

      setModalAnexoVisible(false);

    } catch (error) {
      console.error("Erro ao selecionar imagem:", error);
      Alert.alert("Erro", "Não foi possível selecionar as imagens");
    }
  }

  async function enviarJustificativa() {
    if (!alertaSelecionado) {
      Alert.alert("Erro", "Nenhum alerta selecionado");
      return;
    }

    if (!acaoCorretivaId) {
      Alert.alert("Atenção", "Selecione uma ação corretiva");
      return;
    }

    if (!justificativa.trim()) {
      Alert.alert("Atenção", "Digite uma justificativa");
      return;
    }

    setEnviando(true);

    try {
      const mipiUserData = await SecureStore.getItemAsync("mipi-user-data");
      const tokenEprod = await SecureStore.getItemAsync("eprod-token");

      if (!mipiUserData || !tokenEprod) {
        throw new Error("Token ou dados do usuário não encontrados");
      }

      const userData = JSON.parse(mipiUserData);

      const requestDTO = {
        acaoCorretivaId: acaoCorretivaId,
        alertaId: alertaSelecionado.id,
        classificacaoId: classificacao?.key,
        prefixoId: alertaSelecionado.prefixoId,
        justificativa,
        tipoAlerta: classificacao?.value,
        usuarioId: userData.id,          
      };

      const photosUris = fotos.map(image => image.uri);

      const result = await alertService.sendJustification({
        requestDTO,
        photos: photosUris,
        authToken: tokenEprod,
      });

      if (result.success) {
        Alert.alert("Sucesso", "Justificativa enviada com sucesso!", [
          {
            text: "OK",
            onPress: () => {
              fetchAlertas();
              setJustificativa("");
              setAcaoCorretivaId("");
              setFotos([]);
              setMostrarFormulario(false);
              setModalVisible(false);
            },
          },
        ]);
      } else {
        throw new Error(result.message || "Erro ao enviar justificativa");
      }

    } catch (error: any) {
      console.error("Erro ao enviar justificativa:", error);

      let mensagemErro = "Erro ao enviar justificativa";

      if (error.message.includes('Timeout')) {
        mensagemErro = "Tempo de conexão excedido";
      } else if (error.message.includes('Network request failed')) {
        mensagemErro = "Sem resposta do servidor. Verifique a rede/SSL.";
      } else if (error.message.includes('Erro HTTP')) {
        mensagemErro = error.message;
      } else {
        mensagemErro = error.message || "Erro de configuração";
      }

      Alert.alert("Erro", mensagemErro);
    } finally {
      setEnviando(false);
    }
  }

  const abrirModalAnexo = () => {
    setModalAnexoVisible(true);
  };
  
  const fecharModalAnexo = () => {
    setModalAnexoVisible(false);
  };
  
  const removerAnexo = (index: number) => {
    setFotos(prevAnexos => {
      const novosAnexos = [...prevAnexos];
      novosAnexos.splice(index, 1);
      return novosAnexos;
    });
  };
  
  const renderItem = ({ item }: { item: Alerta }) => {
    const themeStyle = getCardTheme(item.status);
    
    return (
      <View style={[
        alertStyles.card, 
        { 
          backgroundColor: themeStyle.backgroundColor,
          borderColor: themeStyle.borderColor,
        }
      ]}>
        <View style={alertStyles.cardHeader}>
          <MaterialIcons 
            name={item.icone as any || "warning"} 
            size={24} 
            color={themeStyle.iconColor} 
            style={alertStyles.icon}
          />
          <View style={[alertStyles.badge, { backgroundColor: themeStyle.buttonColor }]}>
            <Text style={alertStyles.badgeText}>
              {item.status}
            </Text>
          </View>
        </View>
        
        <Text style={[alertStyles.descricao, { color: themeStyle.textColor }]}>
          {item.classificacao}
        </Text>
        
        <View style={alertStyles.infoContainer}>
          <View style={alertStyles.infoRow}>
            <MaterialIcons name="tag" size={16} color={themeStyle.textColor} />
            <Text style={[alertStyles.infoText, { color: themeStyle.textColor }]}>
              {item.prefixo}
            </Text>
          </View>
          <View style={alertStyles.infoRow}>
            <MaterialIcons name="calendar-today" size={16} color={themeStyle.textColor} />
            <Text style={[alertStyles.infoText, { color: themeStyle.textColor }]}>
              {item.dataOcorrencia}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[alertStyles.botao, { backgroundColor: themeStyle.buttonColor }]}
          onPress={() => carregarHistorico(item.id, item)}
        >
          <Text style={alertStyles.botaoTexto}>Visualizar</Text>
          <MaterialIcons name="history" size={20} color={themeStyle.buttonTextColor} />
        </TouchableOpacity>
      </View>
    );
  };
  
  const renderHistoricoItem = (item: HistoricoItem, index: number) => (
    <View key={index} style={alertStyles.historicoItem}>
      <View style={alertStyles.historicoTimeline}>
        <View style={[alertStyles.historicoCircle, { backgroundColor: item.circleColor }]} />
        {index < historico.length - 1 && <View style={alertStyles.historicoLine} />}
      </View>
      
      <View style={alertStyles.historicoContent}>
        <Text style={alertStyles.historicoTime}>
          {item.time}
        </Text>
        
        <Text style={alertStyles.historicoTitle}>
          {item.title}
        </Text>
        
        {item.description && (
          <Text style={alertStyles.historicoDescription}>
            {item.description}
          </Text>
        )}
      </View>
    </View>
  );
  
  return (
    <ScreenLayout title="Alertas">
      <FlatList
        style={alertStyles.flatList}
        data={alertas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={alertStyles.listContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={alertStyles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor={'#3B82F6'}
          />
        }
        ListEmptyComponent={
          <View style={alertStyles.emptyContainer}>
            <MaterialIcons 
              name="warning" 
              size={48} 
              color={isDark ? "#666" : "#CCC"} 
            />
            <Text style={[
              alertStyles.emptyText,
              isDark && alertStyles.emptyTextDark
            ]}>
              Nenhum alerta encontrado
            </Text>
            <Text style={[
              alertStyles.emptySubText,
              isDark && alertStyles.emptySubTextDark
            ]}>
              Puxe para atualizar a lista
            </Text>
          </View>
        }
      />
      
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={false}
        onRequestClose={fecharModal}
        statusBarTranslucent={true}
      >
        <View style={alertStyles.modalFullScreenContainer}>
          
          <View style={alertStyles.modalHeader}>
            <View style={alertStyles.modalTitleContainer}>
              <Text style={alertStyles.modalTitle}>
                Histórico do Alerta
              </Text>
            </View>
            <TouchableOpacity 
              onPress={fecharModal} 
              style={alertStyles.closeButton}
            >
              <MaterialIcons 
                name="close" 
                size={32}
                color="#666" 
              />
            </TouchableOpacity>
          </View>
          
          {alertaSelecionado && (
            <View style={alertStyles.alertaInfo}>
              <Text style={alertStyles.alertaTitulo}>
                {alertaSelecionado.classificacao}
              </Text>
              <View style={alertStyles.alertaDetalhes}>
                <Text style={alertStyles.alertaTexto}>
                  <Text style={alertStyles.alertaLabel}>
                    Prefixo:{' '}
                  </Text>
                  {alertaSelecionado.prefixo}
                </Text>
                <Text style={alertStyles.alertaTexto}>
                  <Text style={alertStyles.alertaLabel}>
                    Data:{' '}
                  </Text>
                  {alertaSelecionado.dataOcorrencia}
                </Text>
                <Text style={alertStyles.alertaTexto}>
                  <Text style={alertStyles.alertaLabel}>
                    Status:{' '}
                  </Text>
                  {alertaSelecionado.status}
                </Text>
              </View>
            </View>
          )}
          
          <ScrollView 
            style={alertStyles.historicoScrollView}
            contentContainerStyle={alertStyles.historicoContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {loadingHistorico ? (
              <View style={alertStyles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={alertStyles.loadingText}>
                  Carregando histórico...
                </Text>
              </View>
            ) : historico.length > 0 ? (
              historico.map((item, index) => renderHistoricoItem(item, index))
            ) : (
              <View style={alertStyles.emptyContainer}>
                <MaterialIcons 
                  name="history" 
                  size={48} 
                  color="#CCC" 
                />
                <Text style={alertStyles.emptyText}>
                  Nenhum histórico encontrado
                </Text>
              </View>
            )}
            
            {!mostrarFormulario && 
              (alertaSelecionado?.status === "Aguardando Resposta" || alertaSelecionado?.status === "Não Respondido") && (
              <TouchableOpacity 
                style={alertStyles.botaoJustificativa}
                onPress={() => setMostrarFormulario(true)}
              >
                <Text style={alertStyles.botaoJustificativaTexto}>Adicionar Justificativa</Text>
                <MaterialIcons name="add-comment" size={20} color="#FFF" />
              </TouchableOpacity>
            )}
            
            {mostrarFormulario && (
              <View style={alertStyles.formContainer}>
                <Text style={alertStyles.formTitle}>
                  Preencha os dados abaixo referentes à anomalia detectada
                </Text>
                
                <View style={alertStyles.formSection}>
                  <Text style={alertStyles.sectionTitle}>
                    Classificação
                  </Text>
                  <Text style={alertStyles.classificacao}>
                    {alertaSelecionado?.classificacao || 'N/A'}
                  </Text>
                </View>
                
                <View style={alertStyles.formSection}>
                  <Text style={alertStyles.sectionTitle}>
                    Ação Corretiva
                  </Text>
                  
                  <View style={alertStyles.dropdownContainer}>
                    <View style={[
                      alertStyles.pickerContainer,
                      !acaoCorretivaId && alertStyles.placeholderContainer
                    ]}>       
                      <Picker
                        selectedValue={acaoCorretivaId}
                        onValueChange={(itemValue) => setAcaoCorretivaId(itemValue)}
                        dropdownIconColor="#333"
                        style={alertStyles.picker}
                      >
                        <Picker.Item label="Selecionar ação corretiva" value="" />
                        {filteredAcoes.map((item) => (
                          <Picker.Item
                            key={item.key}
                            label={item.value}
                            value={item.key}
                          />
                        ))}                      
                      </Picker>
                    </View>
                    {loadingAcoes && (
                      <View style={alertStyles.loadingAcoesContainer}>
                        <ActivityIndicator size="small" color="#3B82F6" />
                        <Text style={alertStyles.loadingAcoesText}>Carregando ações...</Text>
                      </View>
                    )}
                    {!acaoCorretivaId && (
                      <Text style={alertStyles.erroTexto}>Selecione uma ação corretiva</Text>
                    )}                                        
                  </View>
                </View>
                
                <View style={alertStyles.formSection}>
                  <Text style={alertStyles.sectionTitle}>
                    Justificativa
                  </Text>
                  <TextInput
                    style={alertStyles.textArea}
                    value={justificativa}
                    onChangeText={(text) => setJustificativa(text)}
                    placeholder="Descreva a justificativa para esta anomalia"
                    placeholderTextColor="#6B7280"
                    multiline
                    numberOfLines={4}
                  />
                  {!justificativa.trim() && (
                    <Text style={alertStyles.erroTexto}>A justificativa é obrigatória</Text>
                  )}
                </View>
                
                <View style={alertStyles.formSection}>
                  <Text style={alertStyles.sectionTitle}>
                    Evidência Fotográfica
                  </Text>
                  
                  <TouchableOpacity 
                    style={alertStyles.anexoButton}
                    onPress={abrirModalAnexo}
                    disabled={fotos.length >= MAX_FOTOS}
                  >
                    <MaterialIcons name="camera-alt" size={20} color="#3B82F6" />
                    <Text style={alertStyles.anexoButtonText}>
                      {fotos.length > 0 ? 'Adicionar mais fotos' : 'Tirar foto'}
                    </Text>
                  </TouchableOpacity>
                  
                  {fotos.length > 0 && (
                    <View style={alertStyles.anexosContainer}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {fotos.map((anexo, index) => (
                          <View key={index} style={alertStyles.anexoItem}>
                            <Image
                              source={{ uri: anexo.uri }} 
                              style={alertStyles.fotoPreview} 
                            />
                            <TouchableOpacity 
                              style={alertStyles.removerFotoButton}
                              onPress={() => removerAnexo(index)}
                            >
                              <MaterialIcons name="close" size={16} color="#FFF" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </ScrollView>
                      <View style={alertStyles.fotoInfoContainer}>
                        <Text style={alertStyles.fotoInfo}>{fotos.length} de {MAX_FOTOS} fotos anexadas ✓</Text>
                        {fotos.length < MAX_FOTOS && (
                          <TouchableOpacity 
                            style={alertStyles.adicionarMaisButton}
                            onPress={abrirModalAnexo}
                          >
                            <MaterialIcons name="add-a-photo" size={16} color="#3B82F6" />
                            <Text style={alertStyles.adicionarMaisText}>Adicionar mais</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                </View>
                
                <View style={alertStyles.formButtons}>
                  <TouchableOpacity 
                    style={[alertStyles.formButton, alertStyles.cancelButton]}
                    onPress={() => setMostrarFormulario(false)}
                    disabled={enviando}
                  >
                    <Text style={alertStyles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[alertStyles.formButton, alertStyles.submitButton]}
                    onPress={enviarJustificativa}
                    disabled={enviando}
                  >
                    {enviando ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={alertStyles.submitButtonText}>Enviar Justificativa</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
      
      <Modal
        visible={modalAnexoVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={fecharModalAnexo}
      >
        <View style={alertStyles.modalAnexoOverlay}>
          <View style={alertStyles.modalAnexoContent}>
            <Text style={alertStyles.modalAnexoTitle}>
              Adicionar evidência fotográfica
            </Text>
            
            <Text style={alertStyles.modalAnexoSubtitle}>
              {fotos.length} de {MAX_FOTOS} fotos anexadas
            </Text>
            
            <TouchableOpacity 
              style={alertStyles.modalAnexoOption}
              onPress={tirarFoto}
              disabled={fotos.length >= MAX_FOTOS}
            >
              <MaterialIcons name="camera-alt" size={24} color="#3B82F6" />
              <Text style={alertStyles.modalAnexoOptionText}>
                Tirar foto
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={alertStyles.modalAnexoOption}
              onPress={selecionarDaGaleria}
              disabled={fotos.length >= MAX_FOTOS}
            >
              <MaterialIcons name="photo-library" size={24} color="#3B82F6" />
              <Text style={alertStyles.modalAnexoOptionText}>
                Escolher da galeria
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[alertStyles.modalAnexoOption, alertStyles.modalAnexoCancel]}
              onPress={fecharModalAnexo}
            >
              <Text style={alertStyles.modalAnexoCancelText}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}