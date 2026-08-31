import { api } from "./api";

function normalizeContratoPendente(item = {}) {
  return {
    contrato: item.contrato ?? "",
    letra: item.letra ?? null,
    titular: item.titular ?? "",
    status: item.status ?? null,
  };
}

export const integracoesService = {
  async listarContratosNaoCadastrados() {
    const response = await api.get(
      "/contas-receber/contratos-ativos-gota-nao-cadastrados",
    );
    const payload = response.data ?? {};
    const rawItems = Array.isArray(payload)
      ? payload
      : (payload.itens ?? payload.items ?? []);

    return {
      total: payload.total ?? rawItems.length,
      itens: rawItems.map(normalizeContratoPendente),
    };
  },
};
