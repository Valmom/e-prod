import { File } from 'expo-file-system';

interface JustificationRequest {
  acaoCorretivaId?: string;
  classificacaoId?: string;
  alertaId?: string;
  justificativa?: string;
  tipoAlerta?: string;
  usuarioId: string;
  prefixoId: string;
}

interface SendJustificationParams {
  requestDTO: JustificationRequest;
  photos: string[];
  authToken: string;
  cookies?: string;
  timeout?: number;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: any;
}

export const alertService = {
  sendJustification: async ({
    requestDTO,
    photos,
    authToken
  }: SendJustificationParams): Promise<ApiResponse> => {
    try {
      for (const photo of photos) {
        const file = new File(photo);
        if (!(await file.exists)) {
          throw new Error(`Arquivo não encontrado: ${photo}`);
        }
      }

      const formData = new FormData();
      formData.append('requestDTOJson', JSON.stringify(requestDTO));

      for (const photoUri of photos) {
        const file = new File(photoUri);
        if (!(await file.exists)) {
          throw new Error(`Arquivo não encontrado: ${photoUri}`);
        }

        const filename = photoUri.split('/').pop() || 'photo.png';

        formData.append('fotos', {
          uri: photoUri,
          name: filename,
          type: 'image/jpeg', // ajuste se necessário
        } as any);
      }

      const response = await fetch(
        'https://eprod.equatorialenergia.com.br/eprodapi/v1/alert/save-justification',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json',
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return {
          success: false,
          message: 'Erro ao enviar justificativa',
          data: errorData,
        };
      }

      return {
        success: true,
        data: await response.json().catch(() => null),
      };
    } catch (error: any) {
      if (error.message.includes('Network request failed')) {
        console.log('🔍 Possível problema de SSL/Certificado');
        console.log('🔍 Tente testar com: npx expo start --clear');
      }

      return {
        success: false,
        message: error.message,
        error,
      };
    }
  }
};