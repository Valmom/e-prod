import axios from "axios";

export const api = axios.create({
  baseURL: "https://mipi.equatorialenergia.com.br/mipiapi/api/v1",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});