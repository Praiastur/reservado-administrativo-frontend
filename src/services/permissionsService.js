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

function normalizePermission(permission = {}) {
  return {
    id: normalizeId(permission.id),
    codigo: permission.codigo ?? "",
    nome: permission.nome ?? "",
    descricao: permission.descricao ?? "",
    modulo: permission.modulo ?? "",
    ativo: permission.ativo !== false,
    criadoEm: permission.criadoEm ?? null,
  };
}

export const permissionsService = {
  async list({
    busca = "",
    modulo = "",
    ativo = true,
  } = {}) {
    const params = {};

    if (busca.trim()) {
      params.busca = busca.trim();
    }

    if (modulo.trim()) {
      params.modulo = modulo.trim();
    }

    if (typeof ativo === "boolean") {
      params.ativo = ativo;
    }

    const response = await api.get("/permissoes", {
      params,
    });

    const payload = response.data ?? {};

    const rawPermissions = Array.isArray(payload)
      ? payload
      : payload.permissoes ?? payload.items ?? [];

    return {
      items: rawPermissions
        .map(normalizePermission)
        .filter((permission) => permission.id !== null),
      totalRegistros:
        payload.totalRegistros ?? rawPermissions.length,
    };
  },
};
