import axios from "axios";

const BASE_URL = "https://co-draw-server.vercel.app";

export const axios_instance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});
