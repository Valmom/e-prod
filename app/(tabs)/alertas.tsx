import ScreenLayout from "@/components/ScreenLayout";
import { api } from "@/services/api";
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";
const { width, height } = Dimensions.get('window');

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
  dataOcorrencia: string;
  icone?: string;
  classificacaoId?: string;
}

interface HistoricoItem {
  time: string;
  title: string;
  description: string;
  circleColor: string;
}

// Interface para as classificações
interface Classificacao {
  key: string;
  value: string;
}

// Interface para as ações corretivas
interface AcaoCorretivaAPI {
  id: string;
  tipoAlerta: string;
  prefixoId: string;
  prefixo: string;
  dataOcorrencia: string;
  status: string;
  statusCor: string;
  classificacaoId: string;
  classificacao: string;
  // Adicionando campos que podem conter o valor/descrição da ação
  value?: string;
  descricao?: string;
  nome?: string;
  titulo?: string;
}

// Opções padrão para ações corretivas (caso a API falhe)
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
  const router = useRouter();
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [alertaSelecionado, setAlertaSelecionado] = useState<Alerta | null>(null);
  const [alerta, setAlerta] = useState<Alerta | null>(null);
  // Estado para o formulário de justificativa - MODIFICADO
  const [infoEnvio, setInfoEnvio] = useState({
    acaoCorretiva: "",
    acaoCorretivaId: "", // Adicionado para armazenar o ID da ação
    justificativa: "",
    anexoEvidencia: false
  });
  
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  // Estados para o modal de anexos
  const [modalAnexoVisible, setModalAnexoVisible] = useState(false);
  const [anexos, setAnexos] = useState<{uri: string, type: string, name: string}[]>([]);
  const [erroAnexo, setErroAnexo] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  
  // Estado para controle de refresh
  const [refreshing, setRefreshing] = useState(false);
  
  // Constante para limite de fotos
  const MAX_FOTOS = 5;
  
  // Novos estados para o seletor de ação corretiva
  const [showAcoesDropdown, setShowAcoesDropdown] = useState(false);
  const [searchAcaoText, setSearchAcaoText] = useState("");
  const [filteredAcoes, setFilteredAcoes] = useState<Classificacao[]>([]);
  
  // Estados para as APIs
  const [classificacoes, setClassificacoes] = useState<Classificacao[]>([]);
  const [acoesCorretivasAPI, setAcoesCorretivasAPI] = useState<AcaoCorretivaAPI[]>([]);
  const [loadingAcoes, setLoadingAcoes] = useState(false);
  
  // Função para buscar alertas
  const fetchAlertas = async () => {
    try {
      const response = await api.get('/alertas/table-alerta');
      setAlertas(response.data);
    } catch (error) {
      console.error("Erro ao buscar alertas:", error);
      Alert.alert("Erro", "Não foi possível carregar os alertas");
    }
  };
  
  // Função para buscar classificações
  const fetchClassificacoes = async () => {
    try {
      const response = await api.get('/classificacoes');
      setClassificacoes(response.data);
    } catch (error) {
      console.error("Erro ao buscar classificações:", error);
      Alert.alert("Erro", "Não foi possível carregar as classificações");
    }
  };
  
  // Função para extrair o valor/descrição da ação corretiva
  const extrairValorAcao = (acao: AcaoCorretivaAPI): string => {
    // Tentar obter o valor de diferentes campos possíveis
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
  
  // Função para buscar ações corretivas com base na classificação
  const fetchAcoesCorretivas = async (classificacaoId: string) => {
    setLoadingAcoes(true);
    try {
      console.log("Buscando ações corretivas para a classificação ID:", classificacaoId);
      const response = await api.get(`/acoes-corretivas/${classificacaoId}`);
      console.log("Resposta da API de ações corretivas:", response.data);
      setAcoesCorretivasAPI(response.data);
      
      // Extrair os valores das ações corretivas para o dropdown
      const acoes = response.data.map((acao: AcaoCorretivaAPI) => ({
        key: acao.id,
        value: extrairValorAcao(acao)
      }));
      
      console.log("Ações extraídas:", acoes);
      setFilteredAcoes(acoes);
    } catch (error) {
      console.error("Erro ao buscar ações corretivas:", error);
      Alert.alert("Erro", "Não foi possível carregar as ações corretivas");
      // Fallback para as ações padrão
      setFilteredAcoes(acoesCorretivasPadrao);
    } finally {
      setLoadingAcoes(false);
    }
  };
  
  useEffect(() => {
    fetchAlertas();
    fetchClassificacoes();
  }, []);
  
  useEffect(() => {
    // Solicitar permissão da câmera
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setCameraPermission(status === 'granted');
    })();
  }, []);
  
  // Função para filtrar ações corretivas
  useEffect(() => {
    if (searchAcaoText.trim() === "") {
      // Se não houver texto de busca, mostrar todas as ações
      setFilteredAcoes(acoesCorretivasAPI.map(acao => ({
        key: acao.id,
        value: extrairValorAcao(acao)
      })));
    } else {
      // Filtrar ações com base no texto de busca
      const filtered = acoesCorretivasAPI
        .map(acao => ({
          key: acao.id,
          value: extrairValorAcao(acao)
        }))
        .filter(item => item.value.toLowerCase().includes(searchAcaoText.toLowerCase()));
      
      setFilteredAcoes(filtered);
    }
  }, [searchAcaoText, acoesCorretivasAPI]);
  
  // Função para selecionar ação corretiva - MODIFICADA
  const handleSelectAcao = (acao: Classificacao) => {
    setInfoEnvio({
      ...infoEnvio, 
      acaoCorretiva: acao.value,
      acaoCorretivaId: acao.key // Armazenando o ID da ação
    });
    setSearchAcaoText("");
    setShowAcoesDropdown(false);
  };
  
  // Função para recarregar os dados quando o usuário puxa a lista
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlertas();
    await fetchClassificacoes();
    setRefreshing(false);
  };
  
  const carregarHistorico = async (alertaId: string, alerta: Alerta) => {
    setLoadingHistorico(true);
    setAlertaSelecionado(alerta);
    setInfoEnvio({
      acaoCorretiva: "",
      acaoCorretivaId: "",
      justificativa: "",
      anexoEvidencia: false
    });
    setMostrarFormulario(false);
    setAnexos([]);
    setErroAnexo(false);
    setSearchAcaoText("");
    setShowAcoesDropdown(false);
    
    try {
      // Buscar o histórico
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
      
      // Buscar as ações corretivas para este alerta
      // Se as classificações ainda não foram carregadas, buscar primeiro
      if (classificacoes.length === 0) {
        await fetchClassificacoes();
      }
      
      // Encontrar a classificação correspondente pelo value (classificação do alerta)
      const classificacaoEncontrada = classificacoes.find(
        c => c.value === alerta.classificacao
      );
      
      console.log("Classificação do alerta:", alerta.classificacao);
      console.log("Classificação encontrada:", classificacaoEncontrada);
      
      if (classificacaoEncontrada) {
        // Usar a key encontrada para buscar as ações corretivas
        await fetchAcoesCorretivas(classificacaoEncontrada.key);
      } else {
        console.log("Classificação não encontrada para:", alerta.classificacao);
        // Se não encontrar, usar as ações padrão
        setFilteredAcoes(acoesCorretivasPadrao);
        setAcoesCorretivasAPI([]);
      }
      
      setModalVisible(true);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
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
    setAnexos([]);
    setErroAnexo(false);
    setSearchAcaoText("");
    setShowAcoesDropdown(false);
    setAcoesCorretivasAPI([]);
  };
  
  // FUNÇÃO PARA TIRAR FOTO - MODIFICADA PARA PERMITIR MÚLTIPLAS FOTOS
  const tirarFoto = async () => {
    try {
      if (cameraPermission === false) {
        Alert.alert(
          "Permissão necessária",
          "É necessário permitir o acesso à câmera para tirar fotos",
          [
            {
              text: "Cancelar",
              style: "cancel"
            },
            {
              text: "Configurações",
              onPress: () => Linking.openSettings()
            }
          ]
        );
        return;
      }
      
      // Verificar se já atingimos o limite de fotos
      if (anexos.length >= MAX_FOTOS) {
        Alert.alert("Limite atingido", `Você só pode anexar até ${MAX_FOTOS} fotos`);
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets[0]) {
        const photo = result.assets[0];
        
        const novoAnexo = {
          uri: photo.uri,
          type: 'image/jpeg',
          name: `evidencia_${Date.now()}.jpg`
        };
        
        // Adiciona a nova foto ao array existente
        setAnexos(prevAnexos => [...prevAnexos, novoAnexo]);
        setErroAnexo(false);
        setModalAnexoVisible(false);
      }
    } catch (error) {
      console.error("Erro ao tirar foto:", error);
      Alert.alert("Erro", "Não foi possível abrir a câmera");
    }
  };
  
  // FUNÇÃO AUXILIAR PARA PEGAR TOKEN
  const getToken = async (): Promise<string> => {
    try {
      const stored = await SecureStore.getItemAsync("mipi-user-data");
      if (stored) {
        const userData = JSON.parse(stored);
        return userData?.accessToken || '';
      }
      return '';
    } catch (error) {
      console.error("Erro ao pegar token:", error);
      return '';
    }
  };
  
  // FUNÇÃO PARA CONVERTER IMAGEM PARA BASE64
  const converterImagemParaBase64 = async (uri: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Erro ao converter imagem para base64:", error);
      throw error;
    }
  };
  //   async function saveJustification() {

  //   const formData: FormData = new FormData();
  //   const json = {
  //     'id': alerta?.id,
  //     'acaoCorretivaId': alerta.,
  //     'justificativa': justification
  //   };

  //   if (imageUri !== '') {
  //     formData.append('ImagemUpload', blob);
  //   }

  //   formData.append('command', JSON.stringify(json));

  //   const config: AxiosRequestConfig = {
  //     method: 'POST',
  //     url: 'https://mipi.equatorialenergia.com.br/mipiapi/api/v1/alertas',
  //     data: formData,
  //     headers: {
  //       'Authorization': 'Bearer ' + token,
  //       'Content-Type': 'multipart/form-data'
  //     }
  //   };

  //   await axios(config).then((response) => {
  //     navigation.goBack();
  //   }).catch(function (error)  {
  //     if (error.response) {
  //       // A requisição foi feita e o servidor respondeu com um código de status
  //       // que sai do alcance de 2xx
  //       Alert.alert('Erro', error.response.data.errors[0]);
  //     } else if (error.request) {
  //       // A requisição foi feita mas nenhuma resposta foi recebida
  //       // `error.request` é uma instância do XMLHttpRequest no navegador e uma instância de
  //       // http.ClientRequest no node.js
  //       console.error(error.request);
  //     } else {
  //       // Alguma coisa acontenceu ao configurar a requisição que acionou este erro.
  //       console.error('Error', error.message);
  //     }
  //     setIsLoading(false);
  //   });      
  // }

  // FUNÇÃO CORRIGIDA PARA ENVIAR JUSTIFICATIVA
  const handleEnviarJustificativa = async () => {
    if (!infoEnvio.acaoCorretiva || !infoEnvio.justificativa) {
      Alert.alert("Atenção", "Preencha todos os campos obrigatórios");
      return;
    }
    if (anexos.length === 0) {
      setErroAnexo(true);
      return;
    }
    
    try {
      // Converter imagens para base64
      const imagensBase64: string[] = [];
      for (const anexo of anexos) {
        const base64 = await converterImagemParaBase64(anexo.uri);
        imagensBase64.push(base64);
      }
      
      // Montar objeto de envio conforme estrutura da API
      const dadosEnvio = {
        id: alertaSelecionado?.id || "",
        acaoCorretivaId: infoEnvio.acaoCorretivaId,
        justificativa: infoEnvio.justificativa,
        imagemUpload: imagensBase64
      };
      
      console.log("Enviando dados:", dadosEnvio);
      
      const token = await getToken();
      
      // Verificar se o token foi obtido corretamente
      if (!token) {
        throw new Error("Token de autenticação não encontrado");
      }
      
      // Enviar para API - URL corrigida (removendo barra dupla)
      const response = await fetch('https://eprod.equatorialenergia.com.br/mipiapi/api/v1/alertas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosEnvio),
      });
      
      // Verificar o status da resposta
      console.log("Status da resposta:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Resposta da API:", data);
        Alert.alert("Sucesso", "Justificativa enviada com sucesso!");
        
        // Resetar estados
        setMostrarFormulario(false);
        setInfoEnvio({
          acaoCorretiva: "",
          acaoCorretivaId: "",
          justificativa: "",
          anexoEvidencia: false
        });
        setAnexos([]);
        setErroAnexo(false);
        setSearchAcaoText("");
        setShowAcoesDropdown(false);
        setAcoesCorretivasAPI([]);
        
        // Recarregar histórico
        if (alertaSelecionado) {
          carregarHistorico(alertaSelecionado.id, alertaSelecionado);
        }
      } else {
        // Tentar obter mais informações sobre o erro
        let errorMessage = `Erro ${response.status}`;
        try {
          const errorData = await response.text();
          errorMessage += `: ${errorData}`;
          console.error("Resposta do servidor:", errorData);
        } catch (e) {
          console.error("Não foi possível ler a resposta do erro");
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("Erro ao enviar justificativa:", error);
      Alert.alert("Erro", error.message || "Não foi possível enviar a justificativa");
    }
  };
  
  const toggleAnexoEvidencia = () => {
    setInfoEnvio({
      ...infoEnvio,
      anexoEvidencia: !infoEnvio.anexoEvidencia
    });
  };
  
  // Funções para o modal de anexos
  const abrirModalAnexo = () => {
    setModalAnexoVisible(true);
  };
  
  const fecharModalAnexo = () => {
    setModalAnexoVisible(false);
  };
  
  // MODIFICADA PARA REMOVER APENAS UMA FOTO ESPECÍFICA
  const removerAnexo = (index: number) => {
    setAnexos(prevAnexos => {
      const novosAnexos = [...prevAnexos];
      novosAnexos.splice(index, 1);
      return novosAnexos;
    });
    
    // Se não restar nenhuma foto, setamos o erro
    if (anexos.length <= 1) {
      setErroAnexo(true);
    }
  };
  
  const renderItem = ({ item }: { item: Alerta }) => {
    const themeStyle = getCardTheme(item.status);
    setAlerta(item);
    console.log("Renderizando alerta:", item);
    return (
      <View style={[
        styles.card, 
        { 
          backgroundColor: themeStyle.backgroundColor,
          borderColor: themeStyle.borderColor,
        }
      ]}>
        <View style={styles.cardHeader}>
          <MaterialIcons 
            name={item.icone as any || "warning"} 
            size={24} 
            color={themeStyle.iconColor} 
            style={styles.icon}
          />
          <View style={[styles.badge, { backgroundColor: themeStyle.buttonColor }]}>
            <Text style={styles.badgeText}>
              {item.status}
            </Text>
          </View>
        </View>
        
        <Text style={[styles.descricao, { color: themeStyle.textColor }]}>
          {item.classificacao}
        </Text>
        
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <MaterialIcons name="tag" size={16} color={themeStyle.textColor} />
            <Text style={[styles.infoText, { color: themeStyle.textColor }]}>
              {item.prefixo}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="calendar-today" size={16} color={themeStyle.textColor} />
            <Text style={[styles.infoText, { color: themeStyle.textColor }]}>
              {item.dataOcorrencia}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.botao, { backgroundColor: themeStyle.buttonColor }]}
          onPress={() => carregarHistorico(item.id, item)}
        >
          <Text style={styles.botaoTexto}>Visualizar</Text>
          <MaterialIcons name="history" size={20} color={themeStyle.buttonTextColor} />
        </TouchableOpacity>
      </View>
    );
  };
  
  const renderHistoricoItem = (item: HistoricoItem, index: number) => (
    <View key={index} style={styles.historicoItem}>
      <View style={styles.historicoTimeline}>
        <View style={[styles.historicoCircle, { backgroundColor: item.circleColor }]} />
        {index < historico.length - 1 && <View style={styles.historicoLine} />}
      </View>
      
      <View style={styles.historicoContent}>
        <Text style={styles.historicoTime}>
          {item.time}
        </Text>
        
        <Text style={styles.historicoTitle}>
          {item.title}
        </Text>
        
        {item.description && (
          <Text style={styles.historicoDescription}>
            {item.description}
          </Text>
        )}
      </View>
    </View>
  );
  
  return (
    <ScreenLayout title="Alertas">
      <FlatList
        data={alertas}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        // Adicionando o controle de refresh
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']} // Cor do indicador de refresh
            tintColor={'#3B82F6'} // Cor do indicador de refresh para iOS
          />
        }
        // Adicionando mensagem quando não há alertas
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons 
              name="warning" 
              size={48} 
              color={isDark ? "#666" : "#CCC"} 
            />
            <Text style={[
              styles.emptyText,
              isDark && styles.emptyTextDark
            ]}>
              Nenhum alerta encontrado
            </Text>
            <Text style={[
              styles.emptySubText,
              isDark && styles.emptySubTextDark
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
        <View style={styles.modalFullScreenContainer}>
          
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>
                Histórico do Alerta
              </Text>
            </View>
            <TouchableOpacity 
              onPress={fecharModal} 
              style={styles.closeButton}
            >
              <MaterialIcons 
                name="close" 
                size={32}
                color="#666" 
              />
            </TouchableOpacity>
          </View>
          
          {alertaSelecionado && (
            <View style={styles.alertaInfo}>
              <Text style={styles.alertaTitulo}>
                {alertaSelecionado.classificacao}
              </Text>
              <View style={styles.alertaDetalhes}>
                <Text style={styles.alertaTexto}>
                  <Text style={styles.alertaLabel}>
                    Prefixo:{' '}
                  </Text>
                  {alertaSelecionado.prefixo}
                </Text>
                <Text style={styles.alertaTexto}>
                  <Text style={styles.alertaLabel}>
                    Data:{' '}
                  </Text>
                  {alertaSelecionado.dataOcorrencia}
                </Text>
                <Text style={styles.alertaTexto}>
                  <Text style={styles.alertaLabel}>
                    Status:{' '}
                  </Text>
                  {alertaSelecionado.status}
                </Text>
              </View>
            </View>
          )}
          
          <ScrollView 
            style={styles.historicoScrollView}
            contentContainerStyle={styles.historicoContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {loadingHistorico ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>
                  Carregando histórico...
                </Text>
              </View>
            ) : historico.length > 0 ? (
              historico.map((item, index) => renderHistoricoItem(item, index))
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialIcons 
                  name="history" 
                  size={48} 
                  color="#CCC" 
                />
                <Text style={styles.emptyText}>
                  Nenhum histórico encontrado
                </Text>
              </View>
            )}
            
            {!mostrarFormulario && (
              <TouchableOpacity 
                style={styles.botaoJustificativa}
                onPress={() => setMostrarFormulario(true)}
              >
                <Text style={styles.botaoJustificativaTexto}>Adicionar Justificativa</Text>
                <MaterialIcons name="add-comment" size={20} color="#FFF" />
              </TouchableOpacity>
            )}
            
            {mostrarFormulario && (
              <View style={styles.formContainer}>
                <Text style={styles.formTitle}>
                  Preencha os dados abaixo referentes à Anomalia selecionada
                </Text>
                
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>
                    Classificação
                  </Text>
                  <Text style={styles.classificacao}>
                    {alertaSelecionado?.classificacao || 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>
                    Ação Corretiva
                  </Text>
                  
                  {/* Campo de busca com dropdown */}
                  <View style={styles.dropdownContainer}>
                    <TextInput
                      style={styles.dropdownInput}
                      value={searchAcaoText}
                      onChangeText={setSearchAcaoText}
                      placeholder="Buscar ou selecionar ação corretiva"
                      placeholderTextColor="#6B7280"
                      onFocus={() => setShowAcoesDropdown(true)}
                      editable={!loadingAcoes}
                    />
                    
                    {loadingAcoes && (
                      <View style={styles.loadingAcoesContainer}>
                        <ActivityIndicator size="small" color="#3B82F6" />
                        <Text style={styles.loadingAcoesText}>Carregando ações...</Text>
                      </View>
                    )}
                    
                    {showAcoesDropdown && !loadingAcoes && (
                      <>
                        <TouchableOpacity 
                          style={styles.dropdownOverlay}
                          onPress={() => setShowAcoesDropdown(false)}
                        />
                        <View style={styles.dropdownList}>
                          <ScrollView keyboardShouldPersistTaps="handled">
                            {filteredAcoes.length > 0 ? (
                              filteredAcoes.map((acao, index) => (
                                <TouchableOpacity
                                  key={index}
                                  style={[
                                    styles.dropdownItem,
                                    infoEnvio.acaoCorretiva === acao.value && styles.dropdownItemSelected
                                  ]}
                                  onPress={() => handleSelectAcao(acao)}
                                >
                                  <Text style={[
                                    styles.dropdownItemText,
                                    infoEnvio.acaoCorretiva === acao.value && styles.dropdownItemTextSelected
                                  ]}>
                                    {acao.value}
                                  </Text>
                                </TouchableOpacity>
                              ))
                            ) : (
                              <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => {
                                  // Criar uma nova ação com base no texto digitado
                                  const novaAcao = {
                                    key: "custom",
                                    value: searchAcaoText
                                  };
                                  handleSelectAcao(novaAcao);
                                }}
                              >
                                <Text style={styles.dropdownItemText}>
                                  Adicionar: "{searchAcaoText}"
                                </Text>
                              </TouchableOpacity>
                            )}
                          </ScrollView>
                        </View>
                      </>
                    )}
                  </View>
                  
                  {/* Exibe a ação selecionada */}
                  {infoEnvio.acaoCorretiva ? (
                    <View style={styles.selectedAcaoContainer}>
                      <Text style={styles.selectedAcaoLabel}>Ação selecionada:</Text>
                      <Text style={styles.selectedAcaoText}>{infoEnvio.acaoCorretiva}</Text>
                    </View>
                  ) : null}
                </View>
                
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>
                    Justificativa
                  </Text>
                  <TextInput
                    style={styles.textArea}
                    value={infoEnvio.justificativa}
                    onChangeText={(text) => setInfoEnvio({...infoEnvio, justificativa: text})}
                    placeholder="Descreva a justificativa para esta anomalia"
                    placeholderTextColor="#6B7280"
                    multiline
                    numberOfLines={4}
                  />
                </View>
                
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>
                    Evidência Fotográfica
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.anexoButton}
                    onPress={abrirModalAnexo}
                    disabled={anexos.length >= MAX_FOTOS}
                  >
                    <MaterialIcons name="camera-alt" size={20} color="#3B82F6" />
                    <Text style={styles.anexoButtonText}>
                      {anexos.length > 0 ? 'Adicionar mais fotos' : 'Tirar foto'}
                    </Text>
                  </TouchableOpacity>
                  
                  {anexos.length > 0 && (
                    <View style={styles.anexosContainer}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {anexos.map((anexo, index) => (
                          <View key={index} style={styles.anexoItem}>
                            <Image 
                              source={{ uri: anexo.uri }} 
                              style={styles.fotoPreview} 
                            />
                            <TouchableOpacity 
                              style={styles.removerFotoButton}
                              onPress={() => removerAnexo(index)}
                            >
                              <MaterialIcons name="close" size={16} color="#FFF" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </ScrollView>
                      <View style={styles.fotoInfoContainer}>
                        <Text style={styles.fotoInfo}>{anexos.length} de {MAX_FOTOS} fotos anexadas ✓</Text>
                        {anexos.length < MAX_FOTOS && (
                          <TouchableOpacity 
                            style={styles.adicionarMaisButton}
                            onPress={abrirModalAnexo}
                          >
                            <MaterialIcons name="add-a-photo" size={16} color="#3B82F6" />
                            <Text style={styles.adicionarMaisText}>Adicionar mais</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                  
                  {erroAnexo && (
                    <View style={styles.erroContainer}>
                      <MaterialIcons name="error" size={16} color="#EF4444" />
                      <Text style={styles.erroTexto}>
                        É necessário anexar pelo menos uma foto como evidência
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.formButtons}>
                  <TouchableOpacity 
                    style={[styles.formButton, styles.cancelButton]}
                    onPress={() => setMostrarFormulario(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.formButton, styles.submitButton]}
                    onPress={handleEnviarJustificativa}
                  >
                    <Text style={styles.submitButtonText}>Enviar Justificativa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
      
      {/* Modal para tirar foto */}
      <Modal
        visible={modalAnexoVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={fecharModalAnexo}
      >
        <View style={styles.modalAnexoOverlay}>
          <View style={styles.modalAnexoContent}>
            <Text style={styles.modalAnexoTitle}>
              Adicionar evidência
            </Text>
            
            <TouchableOpacity 
              style={styles.modalAnexoOption}
              onPress={tirarFoto}
            >
              <MaterialIcons name="camera-alt" size={24} color="#3B82F6" />
              <Text style={styles.modalAnexoOptionText}>
                📸 Tirar foto
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalAnexoOption, styles.modalAnexoCancel]}
              onPress={fecharModalAnexo}
            >
              <Text style={styles.modalAnexoCancelText}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}

// ESTILOS
const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    marginRight: 8,
  },
  badge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  descricao: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    lineHeight: 22,
  },
  infoContainer: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
  },
  botao: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
  },
  botaoTexto: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  separator: {
    height: 12,
  },
  modalFullScreenContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 44,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertaInfo: {
    backgroundColor: '#F8F9FA',
    margin: 20,
    marginBottom: 15,
    borderRadius: 12,
    padding: 16,
  },
  alertaTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  alertaDetalhes: {
    gap: 6,
  },
  alertaTexto: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  alertaLabel: {
    fontWeight: '500',
    color: '#374151',
  },
  historicoScrollView: {
    flex: 1,
  },
  historicoContentContainer: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  historicoItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  historicoTimeline: {
    alignItems: 'center',
    marginRight: 15,
  },
  historicoCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
  },
  historicoLine: {
    width: 2,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginTop: 5,
  },
  historicoContent: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  historicoTime: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  historicoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  historicoDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyTextDark: {
    color: '#6B7280',
  },
  emptySubText: {
    marginTop: 8,
    color: '#9CA3AF',
    textAlign: 'center',
    fontSize: 14,
  },
  emptySubTextDark: {
    color: '#6B7280',
  },
  botaoJustificativa: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
    marginBottom: 10,
  },
  botaoJustificativaTexto: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
    marginRight: 8,
  },
  formContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 30,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  classificacao: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    backgroundColor: '#E5E7EB',
    padding: 12,
    borderRadius: 8,
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 10,
    marginBottom: 8,
  },
  dropdownInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFF',
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 200,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 2,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemSelected: {
    backgroundColor: '#EBF5FF',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#374151',
  },
  dropdownItemTextSelected: {
    fontWeight: '600',
    color: '#1D4ED8',
  },
  selectedAcaoContainer: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#F0F9FF',
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  selectedAcaoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  selectedAcaoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E40AF',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFF',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  formButton: {
    borderRadius: 8,
    padding: 12,
    minWidth: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E5E7EB',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  anexoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  anexoButtonText: {
    color: '#3B82F6',
    fontWeight: '500',
    marginLeft: 8,
  },
  anexosContainer: {
    marginTop: 12,
    alignItems: 'flex-start',
    // Garantir que o conteúdo não seja cortado
    overflow: 'visible',
    // Adicionar espaçamento extra
    paddingBottom: 8,
  },
  anexoItem: {
    position: 'relative',
    marginRight: 20, // Aumentar significativamente o espaço entre as fotos
    marginBottom: 20, // Aumentar significativamente o espaço vertical
    // Adicionar padding para garantir espaço para o botão
    paddingTop: 12,
    paddingRight: 12,
    // Garantir que o conteúdo não seja cortado
    overflow: 'visible',
  },
  fotoPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removerFotoButton: {
    position: 'absolute',
    top: -8, // Mover mais para cima
    right: -8, // Mover mais para a direita
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    // Adicionar borda para melhor visibilidade
    borderWidth: 2,
    borderColor: '#FFF',
    // Adicionar sombra para melhor destaque
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
    // Garantir que o botão esteja acima de tudo
    zIndex: 10,
    margin: 8,
  },
  fotoInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12, // Aumentar o espaçamento superior
  },
  fotoInfo: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  adicionarMaisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
  },
  adicionarMaisText: {
    color: '#3B82F6',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  erroContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 6,
  },
  erroTexto: {
    color: '#B91C1C',
    fontSize: 12,
    marginLeft: 6,
  },
  modalAnexoOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalAnexoContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: width * 0.8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalAnexoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalAnexoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
  },
  modalAnexoOptionText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 16,
  },
  modalAnexoCancel: {
    backgroundColor: '#E5E7EB',
    marginTop: 8,
  },
  modalAnexoCancelText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  loadingAcoesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    borderRadius: 8,
  },
  loadingAcoesText: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
  },
});