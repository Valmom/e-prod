import * as SecureStore from 'expo-secure-store';
import { UserData } from "../types/UserData";
import { registerForPushNotificationsAsync, saveTokenDevice } from '../utils/notifications';
import { api, eprodapi } from "./api";

export async function loginUser(username: string, password: string): Promise<UserData> {  
  const expoPushToken = await registerForPushNotificationsAsync();

  const response = await api.post('/entrar', {
    username,
    password
  });
  
  const { accessToken } = response.data;


  if (expoPushToken) {
    await saveTokenDevice(accessToken, expoPushToken);
  }

  username = 'admin';
  password = 'admin123';
  

  const eprodLogin = await eprodapi.post('/auth/login', {
    username,
    password
  });


  const { id, nome, tipoUsuario, base, estado, regional, prefixo, userName } = response.data.userToken;

  SecureStore.setItemAsync('eprod-token', eprodLogin.data.token);
   
  return {
    id,
    accessToken,
    nome,
    tipoUsuario,
    base, 
    estado, 
    regional, 
    prefixo,
    userName
  };
}
