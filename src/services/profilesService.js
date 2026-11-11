import { api } from "./api";
import { getApiErrorMessage } from "./apiError";

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

  // PUT /perfis/{id} (nome e descrição, PERFIS_EDITAR) e PUT /perfis/{id}/permissoes.
  async update(
    profileId,
    {
      nome,
      descricao,
      permissoesIds,
    },
  ) {
    const normalizedPermissionIds =
      uniqueIds(permissoesIds);

    const dataResponse = await api.put(
      `/perfis/${profileId}`,
      {
        nome: (nome ?? "").trim(),
        descricao: (descricao ?? "").trim(),
      },
    );

    let response;

    try {
      response = await api.put(
        `/perfis/${profileId}/permissoes`,
        {
          permissoesIds: normalizedPermissionIds,
        },
      );
    } catch (error) {
      const partialError = new Error(
        `O nome e a descrição foram salvos, mas as permissões não: ${getApiErrorMessage(
          error,
          "erro ao salvar as permissões.",
        )} Atualize os dados e tente de novo.`,
      );

      partialError.name = "PartialSuccessError";

      throw partialError;
    }

    const savedPermissionIds = uniqueIds(
      response.data?.permissoesIds ??
      normalizedPermissionIds,
    );

    return {
      id: normalizeId(
        response.data?.perfilId ?? profileId,
      ),
      nome: dataResponse.data?.nome ?? (nome ?? "").trim(),
      descricao:
        dataResponse.data?.descricao ?? (descricao ?? "").trim(),
      quantidadePermissoes:
        savedPermissionIds.length,
      permissoesIds: savedPermissionIds,
    };
  },

  // PUT /perfis/{id}/ativo (PERFIS_EXCLUIR)
  async setActive(profileId, ativo) {
    await api.put(`/perfis/${profileId}/ativo`, {
      ativo: Boolean(ativo),
    });
  },
};
