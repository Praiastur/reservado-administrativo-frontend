import axios from "axios";

import { appConfig } from "../config/appConfig";
import { getJwtPermissions } from "../utils/jwt";
import {
  clearAuthSession,
  getStoredAuthSession,
  updateStoredAuthSession,
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

// Promise compartilhada entre requisições simultâneas: se várias chamadas
// tomarem 401 ao mesmo tempo, só uma renovação de token é disparada — as
// outras esperam essa mesma promise em vez de renovar cada uma a sua.
let refreshPromise = null;

function mapRefreshResponse(loginData) {
  return {
    accessToken: loginData.accessToken,
    refreshToken: loginData.refreshToken,
    tipoToken: loginData.tipoToken || "Bearer",
    expiraEmSegundos: loginData.expiraEmSegundos,

    expiresAt:
      Date.now() +
      loginData.expiraEmSegundos * 1000,

    permissions: getJwtPermissions(loginData.accessToken),
  };
}

async function refreshAccessToken(refreshToken) {
  // Chamada crua com axios (não a instância `api`), pra não passar por
  // este mesmo interceptor e evitar loop caso a renovação também falhe.
  const response = await axios.post(
    `${appConfig.apiUrl}/auth/refresh`,
    { refreshToken },
    { headers: { "Content-Type": "application/json" } },
  );

  return mapRefreshResponse(response.data);
}

function forceLogout() {
  clearAuthSession();

  window.dispatchEvent(
    new CustomEvent("reservado:unauthorized"),
  );
}

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url ?? "";

    const isLoginRequest = requestUrl.includes("/auth/login");
    const isRefreshRequest = requestUrl.includes("/auth/refresh");

    if (status !== 401 || isLoginRequest) {
      return Promise.reject(error);
    }

    if (isRefreshRequest) {
      // A própria renovação falhou (refresh token inválido, expirado ou
      // já usado) — não tem mais como recuperar a sessão silenciosamente.
      forceLogout();
      return Promise.reject(error);
    }

    const authSession = getStoredAuthSession();
    const storedRefreshToken = authSession?.refreshToken;

    // Sem refresh token guardado (sessão antiga, de antes dessa feature)
    // ou essa requisição já foi reenviada uma vez e voltou a falhar —
    // não tenta de novo, encerra a sessão.
    if (!storedRefreshToken || originalRequest._retry) {
      forceLogout();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken(
          storedRefreshToken,
        ).finally(() => {
          refreshPromise = null;
        });
      }

      const refreshed = await refreshPromise;

      const updatedSession = updateStoredAuthSession(refreshed);

      // AuthContext escuta esse evento pra atualizar o estado em React
      // (e, com isso, reiniciar o timer de expiração com o novo prazo) —
      // sem isso o timer antigo derrubaria a sessão mesmo com token novo.
      window.dispatchEvent(
        new CustomEvent("reservado:session-refreshed", {
          detail: updatedSession,
        }),
      );

      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization =
        `${refreshed.tipoToken} ${refreshed.accessToken}`;

      return api(originalRequest);
    } catch {
      forceLogout();
      return Promise.reject(error);
    }
  },
);
