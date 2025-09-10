import * as FileSystem from 'expo-file-system';

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
        const fileInfo = await FileSystem.getInfoAsync(photo);
        if (!fileInfo.exists) {
          throw new Error(`Arquivo não encontrado: ${photo}`);
        }
      }

      const formData = new FormData();

      formData.append('requestDTOJson', JSON.stringify(requestDTO));

      for (const photoUri of photos) {
        const fileInfo = await FileSystem.getInfoAsync(photoUri);
        if (!fileInfo.exists) {
          throw new Error(`Arquivo não encontrado: ${photoUri}`);
        }

        const filename = photoUri.split('/').pop() || 'photo.png';
        
        formData.append('fotos', {
          uri: photoUri,
          name: filename,
          type: 'image/jpeg', 
        } as any);
      }

      const response = await fetch(
        'https://eprod.equatorialenergia.com.br/eprodapi/v1/alert/save-justification',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Accept': 'application/json',
          },
          body: formData,
        }
      );

      return {
        success: true
      };

    } catch (error: any) {     
      if (error.message.includes('Network request failed')) {
        console.log('🔍 Possível problema de SSL/Certificado');
        console.log('🔍 Tente testar com: npx expo start --clear');
      }
      
      return {
        success: false
      };
    }
  },

  // Teste específico para Expo
  testExpoConnection: async (): Promise<boolean> => {
    try {
      // Testa diferentes endpoints para diagnosticar
      const tests = [
        fetch('https://www.google.com', { method: 'HEAD' }),
        fetch('https://eprod.equatorialenergia.com.br', { method: 'HEAD' }),
        fetch('https://eprod.equatorialenergia.com.br/eprodapi/v1/health', { method: 'HEAD' })
      ];

      const results = await Promise.allSettled(tests);
      
      results.forEach((result, index) => {
        const urls = ['Google', 'Domínio Equatorial', 'API Health'];
        if (result.status === 'fulfilled') {
          console.log(`✅ ${urls[index]}: ${result.value.status}`);
        } else {
          console.log(`❌ ${urls[index]}: ${result.reason.message}`);
        }
      });

      return results.some(result => result.status === 'fulfilled');
    } catch (error) {
      console.warn('Expo - Teste de conexão falhou:', error);
      return false;
    }
  }
};