import { useAuth } from "@/context/AuthContext";
import axios from "axios";

  const { user } = useAuth();
  

console.log(user?.accessToken);
export const api = axios.create({
  baseURL: "https://mipi.equatorialenergia.com.br/mipiapi/api/v1",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user?.accessToken || ""}`,
  },

});