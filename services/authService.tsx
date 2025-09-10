import * as SecureStore from 'expo-secure-store';
import { UserData } from "../types/UserData";
import { api, eprodapi } from "./api";

export async function loginUser(username: string, password: string): Promise<UserData> {
  
  const response = await api.post('/entrar', {
    username,
    password
  });

  username = 'admin';
  password = 'admin123';

  const eprodLogin = await eprodapi.post('/auth/login', {
    username,
    password
  });

  const { accessToken } = response.data;
  const { id, nome, tipoUsuario } = response.data.userToken;

  SecureStore.setItemAsync('eprod-token', eprodLogin.data.token);
  
  //console.log(response.data);
  
  //saveTokenDevice(response.data.userToken);

  return {
    id,
    accessToken,
    nome,
    tipoUsuario
  };
}
