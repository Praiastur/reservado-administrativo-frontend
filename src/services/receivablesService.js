import { api } from "./api";

function normalizeReceivable(receivable = {}) {
  return {
    id: receivable.id,
    anuidadeId: receivable.anuidadeId ?? null,
    contratoId: receivable.contratoId,
    pagadorClienteId: receivable.pagadorClienteId,
    numeroDocumento: receivable.numeroDocumento ?? null,
    numeroParcela: receivable.numeroParcela ?? null,
    valorOriginal: Number(receivable.valorOriginal ?? 0),
    valorAberto: Number(receivable.valorAberto ?? 0),
    dataVencimento: receivable.dataVencimento ?? null,
    situacao: receivable.situacao ?? "",
    boletoGerado: receivable.boletoGerado === true,
    pago: receivable.pago === true,
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

function normalizeAnnuality(annuality) {
  if (!annuality) return null;

  return {
    id: annuality.id,
    anoReferencia: annuality.anoReferencia ?? null,
    valor: Number(annuality.valor ?? 0),
    dataVencimento: annuality.dataVencimento ?? null,
    dataPagamento: annuality.dataPagamento ?? null,
    situacao: annuality.situacao ?? "",
  };
}

function normalizeBoleto(boleto = {}) {
  return {
    id: boleto.id,
    codigoExterno: boleto.codigoExterno ?? null,
    numeroBancario: boleto.numeroBancario ?? null,
    numeroBoleto: boleto.numeroBoleto ?? null,
    codigoBarras: boleto.codigoBarras ?? null,
    linhaDigitavel: boleto.linhaDigitavel ?? null,
    urlBoleto: boleto.urlBoleto ?? null,
    percentualJuros: Number(boleto.percentualJuros ?? 0),
    percentualMulta: Number(boleto.percentualMulta ?? 0),
    dataEmissao: boleto.dataEmissao ?? null,
    dataVencimento: boleto.dataVencimento ?? null,
    dataCancelamento: boleto.dataCancelamento ?? null,
    situacao: boleto.situacao ?? "",
  };
}

function normalizePayment(payment = {}) {
  return {
    id: payment.id,
    sistema: payment.sistema ?? null,
    codigoExterno: payment.codigoExterno ?? null,
    valorPrincipal: Number(payment.valorPrincipal ?? 0),
    valorJuros: Number(payment.valorJuros ?? 0),
    valorMulta: Number(payment.valorMulta ?? 0),
    valorDesconto: Number(payment.valorDesconto ?? 0),
    valorTotal: Number(payment.valorTotal ?? 0),
    dataPagamento: payment.dataPagamento ?? null,
    dataCredito: payment.dataCredito ?? null,
    formaPagamento: payment.formaPagamento ?? null,
    observacao: payment.observacao ?? null,
  };
}

function normalizeIntegration(integration = {}) {
  return {
    id: integration.id,
    sistema: integration.sistema ?? "",
    codigoIntegracao: integration.codigoIntegracao ?? "",
    codigoExterno: integration.codigoExterno ?? null,
    statusExterno: integration.statusExterno ?? null,
    sincronizadoEm: integration.sincronizadoEm ?? null,
  };
}

function normalizeReceivableDetails(receivable = {}) {
  return {
    ...normalizeReceivable(receivable),
    dataEmissao: receivable.dataEmissao ?? null,
    dataRegistro: receivable.dataRegistro ?? null,
    dataPrevisao: receivable.dataPrevisao ?? null,
    codigoCategoria: receivable.codigoCategoria ?? null,
    codigoProjetoExterno: receivable.codigoProjetoExterno ?? null,
    codigoTipoDocumento: receivable.codigoTipoDocumento ?? null,
    codigoContaCorrenteExterno:
      receivable.codigoContaCorrenteExterno ?? null,
    observacao: receivable.observacao ?? null,
    criadoEm: receivable.criadoEm ?? null,
    atualizadoEm: receivable.atualizadoEm ?? null,
    contrato: normalizeContract(receivable.contrato),
    anuidade: normalizeAnnuality(receivable.anuidade),
    boletos: (receivable.boletos ?? []).map(normalizeBoleto),
    pagamentos: (receivable.pagamentos ?? []).map(normalizePayment),
    integracoes: (receivable.integracoes ?? []).map(normalizeIntegration),
  };
}

export const receivablesService = {
  async list({
    contratoId = "",
    anuidadeId = "",
    pagadorClienteId = "",
    numeroDocumento = "",
    situacao = "",
    vencimentoInicial = "",
    vencimentoFinal = "",
    boleto = "TODOS",
    pagamento = "TODOS",
    numeroPagina = 1,
    tamanhoPagina = 20,
  } = {}) {
    const params = {
      numeroPagina,
      tamanhoPagina: Math.min(tamanhoPagina, 100),
    };

    if (contratoId !== "") params.contratoId = Number(contratoId);
    if (anuidadeId !== "") params.anuidadeId = Number(anuidadeId);
    if (pagadorClienteId !== "") {
      params.pagadorClienteId = Number(pagadorClienteId);
    }
    if (numeroDocumento.trim()) {
      params.numeroDocumento = numeroDocumento.trim();
    }
    if (situacao.trim()) params.situacao = situacao.trim();
    if (vencimentoInicial) params.vencimentoInicial = vencimentoInicial;
    if (vencimentoFinal) params.vencimentoFinal = vencimentoFinal;
    if (boleto === "GERADO") params.boletoGerado = true;
    if (boleto === "NAO_GERADO") params.boletoGerado = false;
    if (pagamento === "PAGO") params.pago = true;
    if (pagamento === "EM_ABERTO") params.pago = false;

    const response = await api.get("/contas-receber", { params });
    const payload = response.data ?? {};
    const rawItems = Array.isArray(payload)
      ? payload
      : payload.itens ?? payload.items ?? [];

    return {
      items: rawItems.map(normalizeReceivable),
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

  async getById(receivableId) {
    const response = await api.get(`/contas-receber/${receivableId}`);
    const payload = response.data?.dados ?? response.data ?? {};

    return normalizeReceivableDetails(payload);
  },
};
