import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { allPermissions } from "../data/permissions";

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
    readStoredData(USERS_STORAGE_KEY, initialUsers),
  );

  const [profiles, setProfiles] = useState(() =>
    readStoredData(PROFILES_STORAGE_KEY, initialProfiles),
  );

  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  }, [profiles]);

  function createUser({ nome, email, perfisIds }) {
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

    setUsers((currentUsers) => [newUser, ...currentUsers]);

    return newUser;
  }

  function createProfile({
    codigo,
    nome,
    descricao,
    permissoesIds,
  }) {
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

  function updateUserProfiles(userId, perfisIds) {
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
  }

  function getProfileUserCount(profileId) {
    return users.filter((user) =>
      user.perfisIds.includes(profileId),
    ).length;
  }

  return (
    <AccessManagementContext.Provider
      value={{
        users,
        profiles,
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