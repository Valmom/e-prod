import { UserData } from "../types/UserData";
import { api } from "./api";

export async function loginUser(username: string, password: string): Promise<UserData> {
  const response = await api.post('/entrar', {
    username,
    password
  });

  const {  accessToken } = response.data;
  const { id, nome, tipoUsuario } = response.data.userToken;

  return {
    id,
    accessToken,
    nome,
    tipoUsuario
  };
}
