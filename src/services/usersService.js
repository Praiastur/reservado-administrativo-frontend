import { api } from "./api";

function normalizeProfileReference(profile = {}) {
  return {
    id: profile.id,
    codigo: profile.codigo ?? "",
    nome: profile.nome ?? "",
    descricao: profile.descricao ?? "",
    ativo: profile.ativo !== false,
  };
}

function uniqueIds(ids = []) {
  const uniqueValues = new Map();

  ids.forEach((id) => {
    if (id === undefined || id === null || id === "") {
      return;
    }

    uniqueValues.set(String(id), id);
  });

  return Array.from(uniqueValues.values());
}

function normalizeUser(user = {}) {
  const profiles = Array.isArray(user.perfis)
    ? user.perfis
        .filter((profile) => profile?.id !== undefined && profile?.id !== null)
        .map(normalizeProfileReference)
    : [];

  const profileIdsFromObjects = profiles.map((profile) => profile.id);
  const profileIdsFromPayload = Array.isArray(user.perfisIds)
    ? user.perfisIds
    : [];

  return {
    id: user.id,
    clienteId: user.clienteId ?? null,
    nome: user.nome ?? "",
    email: user.email ?? "",
    login: user.login ?? null,
    emailConfirmado: Boolean(user.emailConfirmado),
    ativo: user.ativo !== false,
    bloqueado: Boolean(user.bloqueado),
    ultimoLoginEm: user.ultimoLoginEm ?? null,
    criadoEm: user.criadoEm ?? null,

    perfis: profiles,
    perfisIds: uniqueIds([
      ...profileIdsFromPayload,
      ...profileIdsFromObjects,
    ]),
  };
}

function endpointUnavailable(operation) {
  const error = new Error(
    `A operação de ${operation} ainda aguarda um endpoint correspondente no backend.`,
  );

  error.name = "EndpointUnavailableError";

  throw error;
}

export const usersService = {
  async list({
    pagina = 1,
    tamanhoPagina = 100,
    busca = "",
    ativo,
  } = {}) {
    const params = {
      pagina,
      tamanhoPagina,
    };

    if (busca.trim()) {
      params.busca = busca.trim();
    }

    if (typeof ativo === "boolean") {
      params.ativo = ativo;
    }

    const response = await api.get("/usuarios", {
      params,
    });

    const payload = response.data ?? {};

    const rawUsers = Array.isArray(payload)
      ? payload
      : payload.usuarios ?? payload.items ?? [];

    return {
      items: rawUsers.map(normalizeUser),
      pagina: payload.pagina ?? pagina,
      tamanhoPagina:
        payload.tamanhoPagina ?? tamanhoPagina,
      totalRegistros:
        payload.totalRegistros ?? rawUsers.length,
      totalPaginas: payload.totalPaginas ?? 1,
    };
  },

  async create({
    nome,
    email,
    senha,
    clienteId = null,
  }) {
    const response = await api.post("/usuarios", {
      clienteId,
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      senha,
    });

    return normalizeUser(response.data);
  },

  async updateProfiles(usuarioId, perfisIds) {
    const response = await api.put(
      `/usuarios/${usuarioId}/perfis`,
      {
        perfisIds,
      },
    );

    const savedProfileIds = Array.isArray(
      response.data?.perfisIds,
    )
      ? response.data.perfisIds
      : perfisIds;

    return uniqueIds(savedProfileIds);
  },

  async update() {
    endpointUnavailable("edição de usuário");
  },

  async setActive() {
    endpointUnavailable(
      "ativação ou inativação de usuário",
    );
  },

  async setBlocked() {
    endpointUnavailable(
      "bloqueio ou desbloqueio de usuário",
    );
  },

  async resetPassword() {
    endpointUnavailable("redefinição de senha");
  },
};
