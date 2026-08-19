import { appConfig } from "../config/appConfig";
import { allPermissions } from "../data/permissions";
import { getJwtPermissions } from "../utils/jwt";
import { api } from "./api";

function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

async function mockLogin({ email }) {
  await wait(700);

  return {
    accessToken: null,
    tipoToken: "Bearer",
    expiraEmSegundos: 8 * 60 * 60,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,

    usuario: {
      id: 1,
      clienteId: null,
      nome: "Administrador de demonstração",
      email: email.trim().toLowerCase(),
    },

    permissions: allPermissions.map(
      (permission) => permission.codigo,
    ),

    // permissions: [
    //   "USUARIOS_VISUALIZAR",
    // ],

    mode: "mock",
  };
}

function mapLoginData(loginData) {
  return {
    accessToken: loginData.accessToken,
    refreshToken: loginData.refreshToken,
    tipoToken: loginData.tipoToken || "Bearer",
    expiraEmSegundos: loginData.expiraEmSegundos,

    expiresAt:
      Date.now() +
      loginData.expiraEmSegundos * 1000,

    usuario: loginData.usuario,

    permissions: getJwtPermissions(
      loginData.accessToken,
    ),

    mode: "api",
  };
}

async function realLogin({ email, senha }) {
  const response = await api.post("/auth/login", {
    email: email.trim(),
    senha,
  });

  return mapLoginData(response.data);
}

function getErrorMessage(error) {
  const backendMessage =
    error.response?.data?.detail ||
    error.response?.data?.title ||
    error.response?.data?.message;

  if (backendMessage) {
    return backendMessage;
  }

  if (error.code === "ECONNABORTED") {
    return "A comunicação com o servidor demorou mais que o esperado.";
  }

  if (!error.response) {
    return "Não foi possível conectar ao servidor.";
  }

  return "Não foi possível realizar o login.";
}

export const authService = {
  async login(credentials) {
    try {
      if (appConfig.useMockApi) {
        return await mockLogin(credentials);
      }

      return await realLogin(credentials);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  // Usado fora do fluxo automático de renovação (que fica em api.js,
  // pra evitar dependência circular com este arquivo) — disponível caso
  // alguma tela precise disparar uma renovação manualmente.
  async refresh(refreshToken) {
    const response = await api.post("/auth/refresh", {
      refreshToken,
    });

    return mapLoginData(response.data);
  },
};