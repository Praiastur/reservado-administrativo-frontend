import { api } from "./api";

function normalizeUser(user = {}) {
  const profilesFromObjects = Array.isArray(user.perfis)
    ? user.perfis
        .map((profile) => profile?.id)
        .filter(
          (profileId) =>
            profileId !== undefined && profileId !== null,
        )
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

    perfisIds: Array.isArray(user.perfisIds)
      ? user.perfisIds
      : profilesFromObjects,
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
    await api.put(`/usuarios/${usuarioId}/perfis`, {
      perfisIds,
    });

    return perfisIds;
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