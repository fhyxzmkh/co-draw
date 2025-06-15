import axios from "axios";

const BASE_URL = "http://localhost:6789";

axios.defaults.baseURL = BASE_URL;

export const axios_login_instance = axios.create({
  baseURL: BASE_URL,
});
