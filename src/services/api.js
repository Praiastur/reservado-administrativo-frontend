import axios from "axios";

import { appConfig } from "../config/appConfig";
import {
  clearAuthSession,
  getStoredAuthSession,
} from "./authStorage";

export const api = axios.create({
  baseURL: appConfig.apiUrl,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const authSession = getStoredAuthSession();

  if (authSession?.accessToken) {
    const tokenType = authSession.tipoToken || "Bearer";

    config.headers.Authorization =
      `${tokenType} ${authSession.accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const isUnauthorized =
      error.response?.status === 401;

    const isLoginRequest =
      error.config?.url?.includes("/auth/login");

    if (isUnauthorized && !isLoginRequest) {
      clearAuthSession();

      window.dispatchEvent(
        new CustomEvent("reservado:unauthorized"),
      );
    }

    return Promise.reject(error);
  },
);