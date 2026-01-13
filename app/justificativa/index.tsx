import ScreenLayout from "@/components/ScreenLayout";
import { Alerta } from "@/models/Alerta";
import { api, eprodapi } from "@/services/api";
import { alertService } from "@/services/api/sendJustification";
import { RootState } from '@/store';
import { alertStyles } from "@/styles/alert/style";
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Button,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";
import { showMessage } from "react-native-flash-message";
import {
  GestureViewer,
  useGestureViewerController
} from 'react-native-gesture-image-viewer';
import RNPickerSelect from 'react-native-picker-select';
import { useDispatch, useSelector } from "react-redux";

interface HistoricoItem {
  time: string;
  title: string;
  description: string;
  circleColor: string;
  justificativaId?: string;
  photos?: { uri: string; id: string }[];
}

interface AcaoCorretivaAPI {
  id: string;
  codigo: string;
  value?: string;
  descricao?: string;
  nome?: string;
  titulo?: string;
  classificacao?: string;
}

interface Classificacao {
  key: string;
  value: string;
}

interface FotoComLoading {
  uri: string;
  type: string;
  name: string;
  id: string;
  loading?: boolean;
}

export default function JustificativaScreen() {
  const theme = useColorScheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const dispatch = useDispatch();

  const alertaRedux = useSelector((state: RootState) => state.alerta?.alertaSelecionado);
  const [alertaSelecionado, setAlertaSelecionado] = useState<Alerta | null>(null);

  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(true);
  const [justificativa, setJustificativa] = useState("");
  const [acaoCorretivaId, setAcaoCorretivaId] = useState("");
  const [fotos, setFotos] = useState<FotoComLoading[]>([]);
  const [fotosHistorico, setFotosHistorico] = useState<string[]>([]);
  const [galeriaAberta, setGaleriaAberta] = useState(false);
  const [fotoInicialIndex, setFotoInicialIndex] = useState(0);
  const [classificacoes, setClassificacoes] = useState<Classificacao[]>([]);
  const [classificacao, setClassificacao] = useState<Classificacao | undefined>(undefined);
  const [acoesCorretivasAPI, setAcoesCorretivasAPI] = useState<AcaoCorretivaAPI[]>([]);
  const [loadingAcoes, setLoadingAcoes] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dadosCarregados, setDadosCarregados] = useState(false);
  const [processandoFoto, setProcessandoFoto] = useState(false);

  const { goToIndex, goToPrevious, goToNext, currentIndex, totalCount } = useGestureViewerController();

  const MAX_FOTOS = 5;

  // Verifica se há fotos carregando
  const fotosCarregando = fotos.some(foto => foto.loading) || processandoFoto;

  const pickerSelectStyles = {
    inputIOS: { 
      fontSize: 16, 
      padding: 12, 
      borderWidth: 1, 
      borderColor: '#D1D5DB', 
      borderRadius: 8, 
      color: '#374151', 
      backgroundColor: 'white',
      marginTop: 4,
    },
    inputAndroid: { 
      fontSize: 16, 
      padding: 8, 
      borderWidth: 1, 
      borderColor: '#D1D5DB', 
      borderRadius: 8, 
      color: '#374151', 
      backgroundColor: 'white',
      marginTop: 4,
    },
    placeholder: { color: '#6B7280' },
    iconContainer: { top: 15, right: 12 },
  };

  const voltarParaAlertas = useCallback(() => {
    router.push('/alertas');
  }, [router]);

  useEffect(() => {    
    if (alertaRedux) {
      setAlertaSelecionado(alertaRedux);
      setLoading(false);
    } else {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [alertaRedux]);

  const fetchClassificacoes = useCallback(async () => {
    try {
      const response = await api.get('/classificacoes');
      setClassificacoes(response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar classificações:', error);
      showMessage({ 
        message: "Erro", 
        description: 'Não foi possível carregar as classificações', 
        type: "danger" 
      });
      return [];
    }
  }, []);

  const extrairValorAcao = (acao: AcaoCorretivaAPI) => {
    return acao.value || acao.descricao || acao.nome || acao.titulo || acao.classificacao || "Ação sem descrição";
  };

  const fetchAcoesCorretivas = useCallback(async (classificacaoId: string) => {
    if (!classificacaoId) {
      console.warn('ID da classificação não fornecido');
      return;
    }
    setLoadingAcoes(true);
    try {
      const response = await api.get(`/acoes-corretivas/${classificacaoId}`);
      setAcoesCorretivasAPI(response.data);
    } catch (error) {
      console.error('Erro ao buscar ações corretivas:', error);
      showMessage({ 
        message: "Erro",
        description: 'Não foi possível carregar as ações corretivas', 
        type: "danger" 
      });
    } finally { 
      setLoadingAcoes(false); 
    }
  }, []);

  const carregarHistorico = useCallback(async (alertaId: string) => {
    if (!alertaId) {
      console.error('ID do alerta não fornecido');
      return;
    }
    setLoadingHistorico(true);
    try {
      const tokenEprod = await SecureStore.getItemAsync("eprod-token");
      if (!tokenEprod) {
        throw new Error("Token eprod não encontrado");
      }
      const response = await eprodapi.get('/v1/alert/timeline', { 
        params: { alertId: alertaId }, 
        headers: { Authorization: `Bearer ${tokenEprod}` } 
      });
      const list: HistoricoItem[] = response.data.map((item: any) => ({
        time: item.DATA,
        title: item.STATUS,
        description: item.JUSTIFICATIVA || item.CLASSIFICACAO || '',
        circleColor: item.STATUS === "Aberto" ? "red" : "green",
        justificativaId: item.ID,
        photos: (item.photos || []).map((uri: string, idx: number) => ({ 
          uri, 
          id: `${item.ID ?? 'item'}_${idx}` 
        }))
      }));
      setHistorico(list);
      setFotosHistorico(list.flatMap(i => (i.photos || []).map(p => p.uri)));
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      showMessage({ 
        message: "Erro", 
        description: 'Não foi possível carregar o histórico', 
        type: "danger" 
      });
    } finally { 
      setLoadingHistorico(false); 
    }
  }, []);

  useEffect(() => {
    const carregarDados = async () => {
      if (!alertaSelecionado || dadosCarregados) return;
      try {
        const classificacoesData = await fetchClassificacoes();
        const classificacaoEncontrada = classificacoesData.find(
          (c: Classificacao) => c.value === alertaSelecionado.classificacao
        );
        if (classificacaoEncontrada) {
          setClassificacao(classificacaoEncontrada);
          await fetchAcoesCorretivas(classificacaoEncontrada.key);
        } else {
          console.warn('Classificação não encontrada para:', alertaSelecionado.classificacao);
          if (alertaSelecionado.classificacaoId) {
            await fetchAcoesCorretivas(alertaSelecionado.classificacaoId);
          }
        }
        await carregarHistorico(alertaSelecionado.id);
        setDadosCarregados(true);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showMessage({
          message: "Erro",
          description: "Falha ao carregar dados do alerta",
          type: "danger"
        });
      }
    };
    carregarDados();
  }, [alertaSelecionado, dadosCarregados, fetchClassificacoes, fetchAcoesCorretivas, carregarHistorico]);

  useEffect(() => {
    if (alertaSelecionado) {
      setDadosCarregados(false);
    }
  }, [alertaSelecionado?.id]);

  const renderHistoricoItem = (item: HistoricoItem, index: number) => (
    <View key={index} style={alertStyles.historicoItem}>
      <View style={alertStyles.historicoTimeline}>
        <View style={[alertStyles.historicoCircle, { backgroundColor: item.circleColor }]} />
        {index < historico.length - 1 && <View style={alertStyles.historicoLine} />}
      </View>
      <View style={alertStyles.historicoContent}>
        <Text style={alertStyles.historicoTime}>{item.time}</Text>
        <Text style={alertStyles.historicoTitle}>{item.title}</Text>
        {item.description && (
          <Text style={alertStyles.historicoDescription}>{item.description}</Text>
        )}
        {item.photos && item.photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {item.photos.map((foto, idx) => (
              <TouchableOpacity
                key={foto.id}
                onPress={() => {
                  const indexGlobal = fotosHistorico.findIndex(uri => uri === foto.uri);
                  const startIndex = indexGlobal >= 0 ? indexGlobal : 0;
                  setFotoInicialIndex(startIndex);
                  setGaleriaAberta(true);
                }}
                style={{ marginRight: 8 }}
              >
                <Image
                  source={{ uri: foto.uri }}
                  style={{ width: 80, height: 80, borderRadius: 8 }}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );

  // Ref para controlar o timeout de loading da foto
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const abrirCamera = async () => {
    if (fotos.length >= MAX_FOTOS) {
      showMessage({ 
        message: "Limite atingido", 
        description: `Máximo de ${MAX_FOTOS} fotos permitidas`, 
        type: "warning" 
      });
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      showMessage({ 
        message: "Permissão necessária", 
        description: 'É necessário permitir o acesso à câmera', 
        type: "warning" 
      });
      return;
    }
    setProcessandoFoto(true);
    try {
      const result = await ImagePicker.launchCameraAsync({ 
        mediaTypes: 'images', 
        quality: 0.8,
        allowsEditing: false
      });
      if (!result.canceled && result.assets?.length > 0) {
        const novaFoto: FotoComLoading = { 
          uri: result.assets[0].uri, 
          type: "image/jpeg", 
          name: `foto_${Date.now()}.jpg`,
          id: `foto_${Date.now()}`,
          loading: true
        };
        setFotos(prev => [...prev, novaFoto]);
        timeoutRef.current = setTimeout(() => {
          setFotos(prev => 
            prev.map(foto => 
              foto.id === novaFoto.id 
                ? { ...foto, loading: false }
                : foto
            )
          );
        }, 1500);
      }
    } catch (error) {
      console.error('Erro ao capturar foto:', error);
      showMessage({
        message: "Erro",
        description: "Falha ao capturar a foto",
        type: "danger"
      });
    } finally {
      setProcessandoFoto(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Remover foto por id
  const removerAnexo = (id: string) => {
    setFotos(prev => prev.filter(foto => foto.id !== id));
  };

  async function enviarJustificativa() {
    if (!alertaSelecionado) {
      showMessage({ 
        message: "Erro", 
        description: "Nenhum alerta selecionado", 
        type: "danger" 
      });
      return;
    }
    if (!acaoCorretivaId) {
      showMessage({ 
        message: "Campo obrigatório", 
        description: "Selecione uma ação corretiva", 
        type: "warning" 
      });
      return;
    }
    if (!justificativa.trim()) {
      showMessage({ 
        message: "Campo obrigatório", 
        description: "Digite uma justificativa", 
        type: "warning" 
      });
      return;
    }
    if (fotosCarregando) {
      showMessage({ 
        message: "Aguarde", 
        description: "Aguarde o carregamento das fotos para enviar a justificativa", 
        type: "warning" 
      });
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
        classificacaoId: classificacao?.key || alertaSelecionado.classificacaoId,
        prefixoId: alertaSelecionado.prefixoId,
        justificativa,
        tipoAlerta: classificacao?.value || alertaSelecionado.classificacao,
        usuarioId: userData.id,
      };
      const photosUris = fotos.map(image => image.uri);
      const result = await alertService.sendJustification({
        requestDTO,
        photos: photosUris,
        authToken: tokenEprod,
      });
      if (result.success) {
        showMessage({ 
          message: "Sucesso", 
          description: "Justificativa enviada com sucesso, retornando para alertas", 
          type: "success",
          onHide: () => {
            router.push('/alertas');
          }    
        });
      } else {
        throw new Error(result.message || "Erro ao enviar justificativa");
      }
    } catch (error: any) {
      let mensagemErro = "Erro ao enviar justificativa";
      if (error.message?.includes('Timeout')) {
        mensagemErro = "Tempo de conexão excedido";
      } else if (error.message?.includes('Network request failed')) {
        mensagemErro = "Sem resposta do servidor. Verifique a rede/SSL.";
      } else if (error.message?.includes('Erro HTTP')) {
        mensagemErro = error.message;
      } else {
        mensagemErro = error.message || "Erro de configuração";
      }
      showMessage({ 
        message: "Erro", 
        description: mensagemErro, 
        type: "danger" 
      });
    } finally {
      setEnviando(false);
    }
  }

  useEffect(() => { 
    if (galeriaAberta) {
      setTimeout(() => goToIndex(fotoInicialIndex), 100);
    }
  }, [galeriaAberta, fotoInicialIndex, goToIndex]);

  if (loading) {
    return (
      <ScreenLayout title="Justificativa">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={{ marginTop: 16, color: '#6B7280' }}>Carregando alerta...</Text>
        </View>
      </ScreenLayout>
    );
  }

  if (!alertaSelecionado) {
    return (
      <ScreenLayout title="Justificativa">
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: 20,
          backgroundColor: isDark ? '#1F2937' : '#F9FAFB'
        }}>
          <MaterialIcons name="error-outline" size={64} color="#6B7280" />
          <Text style={{ 
            fontSize: 18, 
            fontWeight: 'bold', 
            marginTop: 16, 
            textAlign: 'center',
            color: isDark ? '#E5E7EB' : '#374151'
          }}>
            Nenhum alerta selecionado
          </Text>
          <Text style={{ 
            marginTop: 8, 
            textAlign: 'center', 
            color: '#6B7280',
            lineHeight: 20
          }}>
            Volte para a lista de alertas e selecione um item para visualizar as informações.
          </Text>
          <TouchableOpacity
            onPress={voltarParaAlertas}
            style={{ 
              backgroundColor: '#3B82F6', 
              paddingHorizontal: 24, 
              paddingVertical: 12, 
              borderRadius: 8,
              marginTop: 24
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
              Voltar para Alertas
            </Text>
          </TouchableOpacity>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout title="Justificativa">
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Header com informações do alerta */}
        <View style={{ 
          marginBottom: 20, 
          padding: 16, 
          backgroundColor: isDark ? '#374151' : '#F3F4F6', 
          borderRadius: 8,
          borderLeftWidth: 4,
          borderLeftColor: '#3B82F6'
        }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: 'bold', 
            marginBottom: 8,
            color: isDark ? '#F9FAFB' : '#111827'
          }}>
            {alertaSelecionado.classificacao}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="tag" size={16} color="#6B7280" />
              <Text style={{ marginLeft: 4, color: '#6B7280' }}>
                {alertaSelecionado.prefixo}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="calendar-today" size={16} color="#6B7280" />
              <Text style={{ marginLeft: 4, color: '#6B7280' }}>
                {alertaSelecionado.dataOcorrencia}
              </Text>
            </View>
            <View style={{ 
              backgroundColor: alertaSelecionado.status === 'Recusado' ? '#FEE2E2' : 
                             alertaSelecionado.status === 'Não Respondido' ? '#FEF3C7' :
                             alertaSelecionado.status === 'Aguardando Resposta' ? '#DBEAFE' : '#E5E7EB',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 4
            }}>
              <Text style={{ 
                color: alertaSelecionado.status === 'Recusado' ? '#DC2626' : 
                       alertaSelecionado.status === 'Não Respondido' ? '#D97706' :
                       alertaSelecionado.status === 'Aguardando Resposta' ? '#2563EB' : '#6B7280',
                fontSize: 12,
                fontWeight: '500'
              }}>
                {alertaSelecionado.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Seção de Histórico */}
        <Text style={{ 
          fontSize: 18, 
          fontWeight: 'bold', 
          marginBottom: 12,
          color: isDark ? '#F9FAFB' : '#111827'
        }}>
          Histórico do Alerta
        </Text>
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

        {/* Formulário de Justificativa */}
        <Text style={{ 
          fontWeight: 'bold', 
          marginTop: 24, 
          marginBottom: 8,
          color: isDark ? '#F9FAFB' : '#111827'
        }}>
          Ação Corretiva *
        </Text>
        {loadingAcoes ? (
          <View style={{ alignItems: 'center', padding: 8 }}>
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text style={{ marginTop: 4, color: '#6B7280', fontSize: 12 }}>
              Carregando ações corretivas...
            </Text>
          </View>
        ) : (
          <RNPickerSelect
            onValueChange={setAcaoCorretivaId}
            items={acoesCorretivasAPI.map(a => ({ 
              label: extrairValorAcao(a), 
              value: a.codigo
            }))}
            placeholder={{ label: "Selecione uma ação corretiva", value: null }}
            style={pickerSelectStyles}
            value={acaoCorretivaId}
          />
        )}

        <Text style={{ 
          fontWeight: 'bold',
          marginTop: 16, 
          marginBottom: 8,
          color: isDark ? '#F9FAFB' : '#111827'
        }}>
          Justificativa *
        </Text>
        <TextInput
          value={justificativa}
          onChangeText={setJustificativa}
          placeholder="Digite a justificativa..."
          placeholderTextColor="#6B7280"
          multiline
          numberOfLines={4}
          style={{ 
            borderWidth: 1, 
            borderColor: '#D1D5DB', 
            borderRadius: 8, 
            padding: 12, 
            textAlignVertical: 'top',
            minHeight: 100,
            backgroundColor: 'white',
            color: '#374151'
          }}
        />

        {/* Seção de Fotos */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginTop: 20,
          marginBottom: 8 
        }}>
          <Text style={{ 
            fontWeight: 'bold',
            color: isDark ? '#F9FAFB' : '#111827'
          }}>
            Fotos ({fotos.length}/{MAX_FOTOS})
          </Text>
          <Text style={{ color: '#6B7280', fontSize: 12 }}>
            {fotos.length < MAX_FOTOS ? 
              `Restam ${MAX_FOTOS - fotos.length}` : 'Máximo atingido'}
          </Text>
        </View>
        {fotosCarregando && (
          <View style={{ 
            backgroundColor: isDark ? '#1F2937' : '#FEF3C7', 
            padding: 8, 
            borderRadius: 4, 
            marginBottom: 8,
            borderLeftWidth: 4,
            borderLeftColor: '#F59E0B'
          }}>
            <Text style={{ 
              color: isDark ? '#FEF3C7' : '#92400E', 
              fontSize: 12,
              textAlign: 'center'
            }}>
              ⚠️ Aguarde o carregamento das fotos para enviar a justificativa
            </Text>
          </View>
        )}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={{ marginBottom: 8 }}
        >
          {fotos.map((f) => (
            <View key={f.id} style={{ marginRight: 12, position: 'relative' }}>
              {f.loading ? (
                <View 
                  style={{ 
                    width: 100, 
                    height: 100, 
                    backgroundColor: isDark ? '#374151' : '#F3F4F6', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#D1D5DB'
                  }}
                >
                  <ActivityIndicator size="small" color="#3B82F6" />
                  <Text style={{ marginTop: 8, fontSize: 10, color: '#6B7280', textAlign: 'center' }}>
                    Carregando...
                  </Text>
                </View>
              ) : (
                <>
                  <Image 
                    source={{ uri: f.uri }} 
                    style={{ width: 100, height: 100, borderRadius: 8 }} 
                  />
                  <TouchableOpacity
                    onPress={() => removerAnexo(f.id)}
                    style={{ 
                      position: "absolute", 
                      top: 4, 
                      right: 4, 
                      backgroundColor: "rgba(0,0,0,0.7)", 
                      borderRadius: 12, 
                      width: 24, 
                      height: 24, 
                      justifyContent: 'center', 
                      alignItems: 'center' 
                    }}
                  >
                    <MaterialIcons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          ))}
          {fotos.length < MAX_FOTOS && (
            <TouchableOpacity
              onPress={abrirCamera}
              disabled={processandoFoto || fotosCarregando}
              style={{ 
                width: 100, 
                height: 100, 
                backgroundColor: isDark ? '#374151' : "#F3F4F6", 
                justifyContent: "center", 
                alignItems: "center", 
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderStyle: 'dashed',
                opacity: (processandoFoto || fotosCarregando) ? 0.5 : 1
              }}
            >
              {processandoFoto ? (
                <ActivityIndicator size="small" color="#9CA3AF" />
              ) : (
                <>
                  <MaterialIcons name="camera-alt" size={32} color="#9CA3AF" />
                  <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                    Adicionar
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={voltarParaAlertas}
            disabled={enviando || fotosCarregando}
            style={{ 
              flex: 1,
              backgroundColor: 'transparent', 
              padding: 16, 
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#D1D5DB',
              opacity: (enviando || fotosCarregando) ? 0.5 : 1
            }}
          >
            <Text style={{ 
              color: isDark ? '#F9FAFB' : '#374151', 
              textAlign: 'center', 
              fontWeight: 'bold', 
              fontSize: 16 
            }}>
              Voltar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={enviarJustificativa}
            disabled={enviando || !acaoCorretivaId || !justificativa.trim() || fotosCarregando}
            style={{ 
              flex: 2,
              backgroundColor: (enviando || !acaoCorretivaId || !justificativa.trim() || fotosCarregando) ? '#9CA3AF' : '#3B82F6', 
              padding: 16, 
              borderRadius: 8, 
              opacity: (enviando || !acaoCorretivaId || !justificativa.trim() || fotosCarregando) ? 0.7 : 1
            }}
          >
            {enviando ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={{ 
                color: '#FFF', 
                textAlign: 'center', 
                fontWeight: 'bold', 
                fontSize: 16 
              }}>
                {fotosCarregando ? 'Aguarde...' : 'Enviar Justificativa'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      {/* Modal Galeria */}
      <Modal 
        visible={galeriaAberta} 
        transparent 
        animationType="fade"
        statusBarTranslucent
      >
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          <GestureViewer
            data={fotosHistorico}
            initialIndex={fotoInicialIndex}
            renderItem={(uri: string) => (
              <Image 
                source={{ uri }} 
                style={{ width: '100%', height: '100%', resizeMode: 'contain' }} 
              />
            )}
            ListComponent={ScrollView}
          />
          <View style={{ 
            position: 'absolute', 
            top: 60, 
            right: 20, 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            borderRadius: 20, 
            paddingHorizontal: 12, 
            paddingVertical: 6 
          }}>
            <Text style={{ color: '#fff', fontWeight: '500' }}>
              {`${currentIndex + 1} / ${totalCount}`}
            </Text>
          </View>
          <View style={{ 
            position: 'absolute', 
            bottom: 40, 
            left: 20, 
            right: 20, 
            flexDirection: 'row', 
            justifyContent: 'space-between' 
          }}>
            <Button title="Anterior" onPress={goToPrevious} />
            <Button title="Próxima" onPress={goToNext} />
            <Button title="Fechar" onPress={() => setGaleriaAberta(false)} />
          </View>
        </View>
      </Modal>
    </ScreenLayout>
  );
}