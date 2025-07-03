import axios from "axios";

const BASE_URL = "http://localhost:9960";

export const axios_instance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});
