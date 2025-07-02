import axios from "axios";

const BASE_URL = "https://makehan.top:12000";

export const axios_instance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});
