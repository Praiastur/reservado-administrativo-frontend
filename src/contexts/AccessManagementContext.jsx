import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { appConfig } from "../config/appConfig";
import { allPermissions } from "../data/permissions";
import { getApiErrorMessage } from "../services/apiError";
import { profilesService } from "../services/profilesService";
import { usersService } from "../services/usersService";

const USERS_STORAGE_KEY = "reservado_admin_users_v1";
const PROFILES_STORAGE_KEY = "reservado_admin_profiles_v1";

const initialProfiles = [
  {
    id: 1,
    codigo: "ADMINISTRADOR",
    nome: "Administrador",
    descricao:
      "Acesso completo às áreas e configurações do Reservado Administrativo.",
    ativo: true,
    permissoesIds: allPermissions.map((permission) => permission.id),
  },
  {
    id: 2,
    codigo: "ADMINISTRATIVO",
    nome: "Administrativo",
    descricao:
      "Acesso às principais rotinas administrativas e consultas internas.",
    ativo: true,
    permissoesIds: [1, 2, 3, 5, 9, 13, 21, 22],
  },
  {
    id: 3,
    codigo: "OPERACIONAL",
    nome: "Operacional",
    descricao:
      "Perfil destinado às rotinas operacionais e consulta de clientes.",
    ativo: true,
    permissoesIds: [9, 13],
  },
  {
    id: 4,
    codigo: "FINANCEIRO",
    nome: "Financeiro",
    descricao:
      "Acesso aos clientes e às rotinas financeiras da empresa.",
    ativo: true,
    permissoesIds: [9, 17, 18],
  },
  {
    id: 5,
    codigo: "COMERCIAL",
    nome: "Comercial",
    descricao:
      "Acesso aos vendedores, clientes e informações da operação comercial.",
    ativo: true,
    permissoesIds: [9, 10, 11, 13, 14, 15],
  },
  {
    id: 6,
    codigo: "JURIDICO",
    nome: "Jurídico",
    descricao:
      "Acesso aos clientes e às informações necessárias para as rotinas jurídicas.",
    ativo: true,
    permissoesIds: [9, 11, 22],
  },
  {
    id: 7,
    codigo: "ATENDIMENTO",
    nome: "Atendimento",
    descricao:
      "Acesso aos cadastros necessários para atendimento aos clientes.",
    ativo: true,
    permissoesIds: [9, 10, 11],
  },
  {
    id: 8,
    codigo: "PERFIL_ANTIGO",
    nome: "Perfil antigo",
    descricao:
      "Perfil mantido apenas para consulta de registros anteriores.",
    ativo: false,
    permissoesIds: [9],
  },
];

const initialUsers = [
  {
    id: 1,
    nome: "Lucas Medeiros",
    email: "lucas@reservado.com.br",
    perfisIds: [1],
    ativo: true,
    bloqueado: false,
    ultimoLoginEm: "2026-07-16T14:32:00",
    criadoEm: "2026-07-01T09:15:00",
  },
  {
    id: 2,
    nome: "Giovana Souza",
    email: "giovana@reservado.com.br",
    perfisIds: [2],
    ativo: true,
    bloqueado: false,
    ultimoLoginEm: "2026-07-16T10:21:00",
    criadoEm: "2026-07-02T11:00:00",
  },
  {
    id: 3,
    nome: "Pablo Oliveira",
    email: "pablo@reservado.com.br",
    perfisIds: [3],
    ativo: true,
    bloqueado: false,
    ultimoLoginEm: "2026-07-15T16:40:00",
    criadoEm: "2026-07-03T14:20:00",
  },
  {
    id: 4,
    nome: "Mariana Costa",
    email: "mariana@reservado.com.br",
    perfisIds: [4],
    ativo: false,
    bloqueado: false,
    ultimoLoginEm: "2026-07-10T08:45:00",
    criadoEm: "2026-07-04T13:30:00",
  },
  {
    id: 5,
    nome: "Rafael Martins",
    email: "rafael@reservado.com.br",
    perfisIds: [5],
    ativo: true,
    bloqueado: true,
    ultimoLoginEm: null,
    criadoEm: "2026-07-05T10:10:00",
  },
  {
    id: 6,
    nome: "Isabella Rocha",
    email: "isabella@reservado.com.br",
    perfisIds: [6],
    ativo: true,
    bloqueado: false,
    ultimoLoginEm: "2026-07-15T11:22:00",
    criadoEm: "2026-07-06T15:15:00",
  },
  {
    id: 7,
    nome: "Ton Oliveira",
    email: "ton@reservado.com.br",
    perfisIds: [7],
    ativo: true,
    bloqueado: false,
    ultimoLoginEm: "2026-07-14T17:05:00",
    criadoEm: "2026-07-07T16:40:00",
  },
];

const AccessManagementContext = createContext(null);

function readStoredData(key, fallbackData) {
  try {
    const storedData = localStorage.getItem(key);

    return storedData ? JSON.parse(storedData) : fallbackData;
  } catch {
    return fallbackData;
  }
}

export function AccessManagementProvider({ children }) {
  const [users, setUsers] = useState(() =>
    appConfig.useMockApi
      ? readStoredData(
        USERS_STORAGE_KEY,
        initialUsers,
      )
      : [],
  );

  const [profiles, setProfiles] = useState(() =>
    appConfig.useMockApi
      ? readStoredData(
        PROFILES_STORAGE_KEY,
        initialProfiles,
      )
      : [],
  );

  const [isLoading, setIsLoading] = useState(
    !appConfig.useMockApi,
  );

  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    if (!appConfig.useMockApi) {
      return;
    }

    localStorage.setItem(
      USERS_STORAGE_KEY,
      JSON.stringify(users),
    );
  }, [users]);

  useEffect(() => {
    if (!appConfig.useMockApi) {
      return;
    }

    localStorage.setItem(
      PROFILES_STORAGE_KEY,
      JSON.stringify(profiles),
    );
  }, [profiles]);

  useEffect(() => {
    if (appConfig.useMockApi) {
      return undefined;
    }

    let ignoreResult = false;

    async function loadAccessData() {
      setIsLoading(true);
      setLoadError("");

      try {
        const [
          usersResult,
          profilesResult,
        ] = await Promise.all([
          usersService.list({
            pagina: 1,
            tamanhoPagina: 100,
          }),

          profilesService.list(),
        ]);

        if (ignoreResult) {
          return;
        }

        setUsers(usersResult.items);
        setProfiles(profilesResult.items);
      } catch (error) {
        if (!ignoreResult) {
          setLoadError(
            getApiErrorMessage(
              error,
              "Não foi possível carregar usuários e perfis.",
            ),
          );
        }
      } finally {
        if (!ignoreResult) {
          setIsLoading(false);
        }
      }
    }

    loadAccessData();

    return () => {
      ignoreResult = true;
    };
  }, []);
  async function createUser({
    nome,
    email,
    senha,
    perfisIds,
  }) {
    setIsSaving(true);

    try {
      if (appConfig.useMockApi) {
        const newUser = {
          id: Date.now(),
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          perfisIds,
          ativo: true,
          bloqueado: false,
          ultimoLoginEm: null,
          criadoEm: new Date().toISOString(),
        };

        setUsers((currentUsers) => [
          newUser,
          ...currentUsers,
        ]);

        return newUser;
      }

      const createdUser =
        await usersService.create({
          nome,
          email,
          senha,
        });

      let finalUser = {
        ...createdUser,
        perfisIds: [],
      };

      setUsers((currentUsers) => [
        finalUser,
        ...currentUsers,
      ]);

      if (perfisIds.length > 0) {
        try {
          await usersService.updateProfiles(
            createdUser.id,
            perfisIds,
          );

          finalUser = {
            ...finalUser,
            perfisIds,
          };

          setUsers((currentUsers) =>
            currentUsers.map((user) =>
              user.id === createdUser.id
                ? finalUser
                : user,
            ),
          );
        } catch {
          const partialError = new Error(
            "O usuário foi criado, mas não foi possível vincular os perfis. Abra os detalhes do usuário e tente novamente.",
          );

          partialError.name =
            "PartialSuccessError";

          throw partialError;
        }
      }

      return finalUser;
    } catch (error) {
      throw new Error(
        getApiErrorMessage(
          error,
          "Não foi possível criar o usuário.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function createProfile({
    codigo,
    nome,
    descricao,
    permissoesIds,
  }) {
    setIsSaving(true);

    try {
      if (appConfig.useMockApi) {
        const newProfile = {
          id: Date.now(),
          codigo: codigo.trim(),
          nome: nome.trim(),
          descricao: descricao.trim(),
          ativo: true,
          permissoesIds,
        };

        setProfiles((currentProfiles) => [
          newProfile,
          ...currentProfiles,
        ]);

        return newProfile;
      }

      const newProfile =
        await profilesService.create({
          codigo,
          nome,
          descricao,
          permissoesIds,
        });

      setProfiles((currentProfiles) => [
        newProfile,
        ...currentProfiles,
      ]);

      return newProfile;
    } catch (error) {
      throw new Error(
        getApiErrorMessage(
          error,
          "Não foi possível criar o perfil.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }
  async function updateUserProfiles(
    userId,
    perfisIds,
  ) {
    setIsSaving(true);

    try {
      if (!appConfig.useMockApi) {
        await usersService.updateProfiles(
          userId,
          perfisIds,
        );
      }

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === userId
            ? {
              ...user,
              perfisIds,
            }
            : user,
        ),
      );
    } catch (error) {
      throw new Error(
        getApiErrorMessage(
          error,
          "Não foi possível atualizar os perfis do usuário.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }
  function getProfileUserCount(profileId) {
    return users.filter((user) =>
      Array.isArray(user.perfisIds)
        ? user.perfisIds.includes(profileId)
        : false,
    ).length;
  }

  return (
    <AccessManagementContext.Provider
      value={{
        users,
        profiles,

        isLoading,
        isSaving,
        loadError,

        useMockApi: appConfig.useMockApi,

        createUser,
        createProfile,
        updateUserProfiles,
        getProfileUserCount,
      }}
    >
      {children}
    </AccessManagementContext.Provider>
  );
}

export function useAccessManagement() {
  const context = useContext(AccessManagementContext);

  if (!context) {
    throw new Error(
      "useAccessManagement deve ser utilizado dentro de AccessManagementProvider.",
    );
  }

  return context;
}