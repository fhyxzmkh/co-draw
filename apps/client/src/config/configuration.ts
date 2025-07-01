import axios from "axios";

const BASE_URL = "https://sunyongan.top:12001";

export const axios_instance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});
