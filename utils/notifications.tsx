import axios, { AxiosRequestConfig } from 'axios';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import moment from 'moment';
import { useEffect } from 'react';
import { Alert, Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,    // mostra banner na tela
    shouldShowList: true,      // mostra na lista de notificações (Android)
    shouldPlaySound: true,
    shouldSetBadge: false
  }),
});

if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {  
  if (!Device.isDevice) {
    Alert.alert('Erro', 'Você precisa usar um dispositivo físico para notificações push.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert('Permissão não concedida para notificações!');
    return null;
  }

  const token = (await Notifications.getDevicePushTokenAsync()).data;
  return token;
}

export async function saveTokenDevice(authToken: string, expoPushToken: string) {  
  const body = {
    token: expoPushToken,
    lastLogin: moment().format('YYYY-MM-DD HH:mm:ss'),
  };

  const config: AxiosRequestConfig = {
    method: 'POST',
    url: 'https://eprod.equatorialenergia.com.br/mipiapi/api/v1/dispositivos',
    headers: {
      Authorization: 'Bearer ' + authToken,
      'Content-Type': 'application/json',
    },
    data: JSON.stringify(body),
  };

  try {
    await axios(config);
  } catch (error: any) {
    if (error.response) {
      Alert.alert('Erro', error.response.data.errors?.[0] || 'Erro desconhecido');
    } else if (error.request) {
      console.error('Erro de requisição:', error.request);
    } else {
      console.error('Erro', error.message);
    }
  }
}

export function usePushNotificationListeners() {
  const router = useRouter();

  useEffect(() => {
    const subscriptionReceived = Notifications.addNotificationReceivedListener((notification) => {
      //console.log('Notificação recebida:', notification);
    });

    const subscriptionResponse = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;

      // Exemplo: navegar para tela "AlertDetail" com parâmetro alertId
      if (data?.screen === "AlertDetail") {
        router.push('/(tabs)/alertas');
      }
    });

    return () => {
      subscriptionReceived.remove();
      subscriptionResponse.remove();
    };
  }, []);
}

export async function sendLocalNotification(title: string, body: string, data?: any) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null,
  });
}