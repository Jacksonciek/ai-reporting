import axios from "axios";

export const api = axios.create({
  baseURL: "/api"
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("ai-reporting-auth");
    }
    return Promise.reject(error);
  }
);
