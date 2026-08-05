import { api } from "./api";

function normalizeContract(contract = {}) {
  return {
    id: contract.id,
    numero: contract.numero ?? "",
    letra: contract.letra ?? null,
    ano: contract.ano ?? null,
    situacao: contract.situacao ?? "",
    ativo: contract.ativo !== false,
    anoReferenciaConsultado:
      contract.anoReferenciaConsultado ?? null,
    possuiAnuidade: contract.possuiAnuidade === true,
  };
}

function normalizeAnnuality(annuality = {}) {
  return {
    id: annuality.id,
    anoReferencia: annuality.anoReferencia ?? null,
    valor: Number(annuality.valor ?? 0),
    dataVencimento: annuality.dataVencimento ?? null,
    dataPagamento: annuality.dataPagamento ?? null,
    situacao: annuality.situacao ?? "",
    possuiContaReceber: annuality.possuiContaReceber === true,
  };
}

function normalizeContractDetails(contract = {}) {
  return {
    ...normalizeContract(contract),
    criadoEm: contract.criadoEm ?? null,
    atualizadoEm: contract.atualizadoEm ?? null,
    anuidades: Array.isArray(contract.anuidades)
      ? contract.anuidades.map(normalizeAnnuality)
      : [],
  };
}

export const contractsService = {
  async list({
    numero = "",
    letra = "",
    anoContrato = "",
    anoReferencia = "",
    situacao = "",
    ativo,
    possuiAnuidade,
    numeroPagina = 1,
    tamanhoPagina = 20,
  } = {}) {
    const params = {
      numeroPagina,
      tamanhoPagina: Math.min(tamanhoPagina, 100),
    };

    if (numero.trim()) params.numero = numero.trim();
    if (letra.trim()) params.letra = letra.trim();
    if (anoContrato !== "") params.anoContrato = Number(anoContrato);
    if (anoReferencia !== "") {
      params.anoReferencia = Number(anoReferencia);
    }
    if (situacao.trim()) params.situacao = situacao.trim();
    if (typeof ativo === "boolean") params.ativo = ativo;
    if (typeof possuiAnuidade === "boolean") {
      params.possuiAnuidade = possuiAnuidade;
    }

    const response = await api.get("/contratos", { params });
    const payload = response.data ?? {};
    const rawItems = Array.isArray(payload)
      ? payload
      : payload.itens ?? payload.items ?? [];

    return {
      items: rawItems.map(normalizeContract),
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

  async getById(contractId) {
    const response = await api.get(`/contratos/${contractId}`);
    const payload = response.data?.dados ?? response.data;

    return payload ? normalizeContractDetails(payload) : null;
  },
};
