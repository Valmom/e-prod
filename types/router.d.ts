import { Alerta } from "@/models/Alerta";

export type RootStackParamList = {
  index: undefined; 
  justificativa: { alerta: Alerta };
  detalhes: { id: string };
};