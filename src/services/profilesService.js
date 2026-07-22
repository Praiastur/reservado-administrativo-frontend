import { api } from "./api";

function normalizeId(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue)
    ? numericValue
    : value;
}

function uniqueIds(ids = []) {
  const uniqueValues = new Map();

  ids.forEach((id) => {
    const normalizedId = normalizeId(id);

    if (normalizedId === null) {
      return;
    }

    uniqueValues.set(String(normalizedId), normalizedId);
  });

  return Array.from(uniqueValues.values());
}

function normalizeProfile(profile = {}) {
  const permissionsFromObjects = Array.isArray(
    profile.permissoes,
  )
    ? profile.permissoes
        .map((permission) =>
          normalizeId(
            permission?.id ??
            permission?.permissaoId,
          ),
        )
        .filter((permissionId) => permissionId !== null)
    : [];

  const permissionsFromPayload = Array.isArray(
    profile.permissoesIds,
  )
    ? profile.permissoesIds
    : [];

  const permissoesIds = uniqueIds([
    ...permissionsFromPayload,
    ...permissionsFromObjects,
  ]);

  return {
    id: normalizeId(profile.id),
    codigo: profile.codigo ?? "",
    nome: profile.nome ?? "",
    descricao: profile.descricao ?? "",
    ativo: profile.ativo !== false,
    criadoEm: profile.criadoEm ?? null,

    quantidadePermissoes:
      profile.quantidadePermissoes ??
      permissoesIds.length,

    permissoesIds,
  };
}

function endpointUnavailable(operation) {
  const error = new Error(
    `A operação de ${operation} ainda aguarda um endpoint correspondente no backend.`,
  );

  error.name = "EndpointUnavailableError";

  throw error;
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
    const normalizedPermissionIds =
      uniqueIds(permissoesIds);

    const response = await api.post("/perfis", {
      codigo: codigo.trim(),
      nome: nome.trim(),
      descricao: descricao.trim(),
      permissoesIds: normalizedPermissionIds,
    });

    return normalizeProfile({
      ...response.data,
      descricao:
        response.data?.descricao ?? descricao.trim(),
      ativo: response.data?.ativo ?? true,
      permissoesIds:
        response.data?.permissoesIds ??
        normalizedPermissionIds,
      quantidadePermissoes:
        response.data?.quantidadePermissoes ??
        normalizedPermissionIds.length,
    });
  },

  async update(
    profileId,
    {
      permissoesIds,
    },
  ) {
    const normalizedPermissionIds =
      uniqueIds(permissoesIds);

    const response = await api.put(
      `/perfis/${profileId}/permissoes`,
      {
        permissoesIds: normalizedPermissionIds,
      },
    );

    const savedPermissionIds = uniqueIds(
      response.data?.permissoesIds ??
      normalizedPermissionIds,
    );

    return {
      id: normalizeId(
        response.data?.perfilId ?? profileId,
      ),
      quantidadePermissoes:
        savedPermissionIds.length,
      permissoesIds: savedPermissionIds,
    };
  },

  async setActive() {
    endpointUnavailable(
      "ativação ou inativação de perfil",
    );
  },
};
