import { api } from "./api";

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeClientSummary(client = {}) {
  return {
    id: client.id,
    nomeRazaoSocial: client.nomeRazaoSocial ?? "",
    nomeFantasia: client.nomeFantasia ?? null,
    cpfCnpj: client.cpfCnpj ?? null,
    tipoPessoa: client.tipoPessoa ?? "",
    ativo: client.ativo !== false,
    associadoId: client.associadoId ?? null,
  };
}

function normalizeClientDetails(client = {}) {
  return {
    ...normalizeClientSummary(client),
    cpfCnpjNormalizado: client.cpfCnpjNormalizado ?? null,
    dataNascimento: client.dataNascimento ?? null,
    emailPrincipal: client.emailPrincipal ?? null,
    criadoEm: client.criadoEm ?? null,
    atualizadoEm: client.atualizadoEm ?? null,
    contatos: normalizeArray(client.contatos),
    enderecos: normalizeArray(client.enderecos),
    documentos: normalizeArray(client.documentos),
    dadosBancarios: normalizeArray(client.dadosBancarios),
    tags: normalizeArray(client.tags),
    caracteristicas: normalizeArray(client.caracteristicas),
    integracoes: normalizeArray(client.integracoes),
    vinculosComoDependente: normalizeArray(
      client.vinculosComoDependente,
    ),
    associado: client.associado ?? null,
  };
}

export const clientsService = {
  async list({
    palavraChave = "",
    numeroPagina = 1,
    tamanhoPagina = 20,
    ativo,
    tipoPessoa = "",
    cpfCnpj = "",
  } = {}) {
    const params = {
      numeroPagina,
      tamanhoPagina: Math.min(tamanhoPagina, 100),
    };

    if (palavraChave.trim()) {
      params.palavraChave = palavraChave.trim();
    }

    if (typeof ativo === "boolean") {
      params.ativo = ativo;
    }

    if (tipoPessoa.trim()) {
      params.tipoPessoa = tipoPessoa.trim();
    }

    if (cpfCnpj.trim()) {
      params.cpfCnpj = cpfCnpj.trim();
    }

    const response = await api.get("/clientes", { params });
    const payload = response.data ?? {};
    const rawItems = Array.isArray(payload)
      ? payload
      : payload.itens ?? payload.items ?? [];

    return {
      items: rawItems.map(normalizeClientSummary),
      totalRegistros: payload.totalRegistros ?? rawItems.length,
      numeroPagina: payload.numeroPagina ?? numeroPagina,
      tamanhoPagina: payload.tamanhoPagina ?? tamanhoPagina,
      totalPaginas: payload.totalPaginas ?? 1,
      temPaginaAnterior:
        payload.temPaginaAnterior ?? numeroPagina > 1,
      temProximaPagina:
        payload.temProximaPagina ??
        numeroPagina < (payload.totalPaginas ?? 1),
    };
  },

  async getById(clientId) {
    const response = await api.get(`/clientes/${clientId}`);
    const payload = response.data?.dados ?? response.data;

    return payload ? normalizeClientDetails(payload) : null;
  },

  async getByDocument(cpfCnpj) {
    const normalizedDocument = String(cpfCnpj ?? "").replace(
      /\D/g,
      "",
    );
    const response = await api.get(
      `/clientes/cpf-cnpj/${normalizedDocument}`,
    );
    const payload = response.data?.dados ?? response.data;

    return payload ? normalizeClientDetails(payload) : null;
  },
};
