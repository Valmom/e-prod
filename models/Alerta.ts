export interface Alerta {
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
