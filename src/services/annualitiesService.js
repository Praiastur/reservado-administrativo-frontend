import { api } from "./api";

function normalizeAnnuality(annuality = {}) {
  return {
    id: annuality.id,
    contratoId: annuality.contratoId,
    numeroContrato: annuality.numeroContrato ?? "",
    letraContrato: annuality.letraContrato ?? null,
    anoReferencia: annuality.anoReferencia ?? null,
    valor: Number(annuality.valor ?? 0),
    dataVencimento: annuality.dataVencimento ?? null,
    situacao: annuality.situacao ?? "",
    possuiContaReceber: annuality.possuiContaReceber === true,
  };
}

function normalizeContract(contract = {}) {
  return {
    id: contract.id,
    numero: contract.numero ?? "",
    letra: contract.letra ?? null,
    ano: contract.ano ?? null,
    situacao: contract.situacao ?? "",
    ativo: contract.ativo === true,
  };
}

function normalizeReceivable(receivable = {}) {
  return {
    id: receivable.id,
    pagadorClienteId: receivable.pagadorClienteId,
    numeroDocumento: receivable.numeroDocumento ?? null,
    numeroParcela: receivable.numeroParcela ?? null,
    valorOriginal: Number(receivable.valorOriginal ?? 0),
    valorAberto: Number(receivable.valorAberto ?? 0),
    dataEmissao: receivable.dataEmissao ?? null,
    dataVencimento: receivable.dataVencimento ?? null,
    situacao: receivable.situacao ?? "",
    boletoGerado: receivable.boletoGerado === true,
    pago: receivable.pago === true,
  };
}

function normalizeAnnualityDetails(annuality = {}) {
  return {
    id: annuality.id,
    contratoId: annuality.contratoId,
    anoReferencia: annuality.anoReferencia ?? null,
    valor: Number(annuality.valor ?? 0),
    dataVencimento: annuality.dataVencimento ?? null,
    dataPagamento: annuality.dataPagamento ?? null,
    situacao: annuality.situacao ?? "",
    criadoEm: annuality.criadoEm ?? null,
    atualizadoEm: annuality.atualizadoEm ?? null,
    contrato: normalizeContract(annuality.contrato),
    contasReceber: (annuality.contasReceber ?? []).map(normalizeReceivable),
  };
}

export const annualitiesService = {
  async list({
    anoReferencia = "",
    contratoId = "",
    numeroContrato = "",
    situacao = "",
    contaReceber = "TODOS",
    numeroPagina = 1,
    tamanhoPagina = 20,
  } = {}) {
    const params = {
      numeroPagina,
      tamanhoPagina: Math.min(tamanhoPagina, 200),
    };

    if (anoReferencia !== "") {
      params.anoReferencia = Number(anoReferencia);
    }
    if (contratoId !== "") params.contratoId = Number(contratoId);
    if (numeroContrato.trim()) {
      params.numeroContrato = numeroContrato.trim();
    }
    if (situacao.trim()) params.situacao = situacao.trim();
    if (contaReceber === "COM_CONTA") params.possuiContaReceber = true;
    if (contaReceber === "SEM_CONTA") params.possuiContaReceber = false;

    const response = await api.get("/anuidades", { params });
    const payload = response.data ?? {};
    const rawItems = Array.isArray(payload)
      ? payload
      : payload.itens ?? payload.items ?? [];

    return {
      items: rawItems.map(normalizeAnnuality),
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

  async getById(annualityId) {
    const response = await api.get(`/anuidades/${annualityId}`);
    const payload = response.data?.dados ?? response.data ?? {};

    return normalizeAnnualityDetails(payload);
  },

  async gerarPorContrato(contratoId, dataVencimento = "") {
    const params = {};
    if (dataVencimento) params.dataVencimento = dataVencimento;

    const response = await api.post(
      `/anuidades/contratos/${contratoId}/gerar`,
      null,
      { params },
    );
    const payload = response.data?.dados ?? response.data ?? {};

    return {
      anuidadeId: payload.anuidadeId,
      contratoId: payload.contratoId ?? Number(contratoId),
      anoReferencia: payload.anoReferencia ?? null,
      valor: Number(payload.valor ?? 0),
      dataVencimento: payload.dataVencimento ?? null,
      situacao: payload.situacao ?? "",
    };
  },

  async gerarEmMassa(dataVencimento = "", contratoIds = []) {
    const body = { contratoIds };
    if (dataVencimento) body.dataVencimento = dataVencimento;

    const response = await api.post("/anuidades/gerar-em-massa", body);
    const payload = response.data?.dados ?? response.data ?? {};

    return {
      totalContratos: payload.totalContratos ?? 0,
      geradas: payload.geradas ?? 0,
      erros: payload.erros ?? 0,
    };
  },

  async gerarBoleto(anuidadeId) {
    const response = await api.post(`/anuidades/${anuidadeId}/gerar-boleto`);
    const payload = response.data?.dados ?? response.data ?? {};

    return {
      anuidadeId: payload.anuidadeId ?? Number(anuidadeId),
      contaReceberId: payload.contaReceberId ?? null,
      codigoLancamentoOmie: payload.codigoLancamentoOmie ?? null,
      numeroBoleto: payload.numeroBoleto ?? null,
    };
  },

  async gerarBoletosEmMassa(contratoIds = []) {
    const response = await api.post("/anuidades/gerar-boletos-em-massa", {
      contratoIds,
    });
    const payload = response.data?.dados ?? response.data ?? {};

    return {
      total: payload.total ?? 0,
      gerados: payload.gerados ?? 0,
      erros: payload.erros ?? 0,
    };
  },
};
