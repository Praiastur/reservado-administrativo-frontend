import { api } from "./api";

function normalizeProfile(profile = {}) {
  const permissionsFromObjects = Array.isArray(
    profile.permissoes,
  )
    ? profile.permissoes
        .map((permission) => permission?.id)
        .filter(
          (permissionId) =>
            permissionId !== undefined,
        )
    : [];

  return {
    id: profile.id,
    codigo: profile.codigo ?? "",
    nome: profile.nome ?? "",
    descricao: profile.descricao ?? "",
    ativo: profile.ativo !== false,
    criadoEm: profile.criadoEm ?? null,

    quantidadePermissoes:
      profile.quantidadePermissoes ??
      permissionsFromObjects.length,

    permissoesIds: Array.isArray(
      profile.permissoesIds,
    )
      ? profile.permissoesIds
      : permissionsFromObjects,
  };
}

export const profilesService = {
  async list({
    busca = "",
    ativo,
  } = {}) {
    const params = {};

    if (busca.trim()) {
      params.busca = busca.trim();
    }

    if (typeof ativo === "boolean") {
      params.ativo = ativo;
    }

    const response = await api.get("/perfis", {
      params,
    });

    const payload = response.data ?? {};

    const rawProfiles = Array.isArray(payload)
      ? payload
      : payload.perfis ?? payload.items ?? [];

    return {
      items: rawProfiles.map(normalizeProfile),
      totalRegistros:
        payload.totalRegistros ?? rawProfiles.length,
    };
  },

  async create({
    codigo,
    nome,
    descricao,
    permissoesIds,
  }) {
    const response = await api.post("/perfis", {
      codigo: codigo.trim(),
      nome: nome.trim(),
      descricao: descricao.trim(),
      permissoesIds,
    });

    return {
      ...normalizeProfile(response.data),
      permissoesIds,
    };
  },
};