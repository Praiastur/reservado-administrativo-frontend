import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  CircleDollarSign,
  FileSearch,
  FileText,
  FilterX,
  Hash,
  Layers,
  LoaderCircle,
  MessageCircle,
  ReceiptText,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";

import { ContractPicker } from "../../components/ui/ContractPicker";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { useFiltrosNaUrl } from "../../hooks/useFiltrosNaUrl";
import { useAuth } from "../../contexts/AuthContext";
import { annualitiesService } from "../../services/annualitiesService";
import { getApiErrorMessage } from "../../services/apiError";
import { contractsService } from "../../services/contractsService";

const PAGE_SIZE = 20;

// A tela nasce ancorada no ano corrente de propósito. Ela não é só uma
// listagem: é o painel de acompanhamento da campanha do ano ("quantas taxas
// já saíram"). Com a geração retroativa de vários anos, deixar o filtro
// vazio faria o total misturar 2024, 2025 e 2026 num número só, que não
// responde mais a pergunta que a pessoa foi fazer ali. Quem quiser ver tudo
// é só limpar o campo de ano.
const initialFilters = {
  anoReferencia: String(new Date().getFullYear()),
  numeroContrato: "",
  contratoId: "",
  situacao: "",
  contaReceber: "TODOS",
  whatsapp: "TODOS",
  boleto: "TODOS",
};

const initialResult = {
  items: [],
  totalRegistros: 0,
  numeroPagina: 1,
  totalPaginas: 1,
  temPaginaAnterior: false,
  temProximaPagina: false,
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function AnnualitiesPage() {
  const { hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    filters,
    setFilters,
    appliedFilters,
    setAppliedFilters,
    currentPage,
    setCurrentPage,
    listSearch,
  } = useFiltrosNaUrl(initialFilters);
  const [reloadToken, setReloadToken] = useState(0);
  const [result, setResult] = useState(initialResult);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [operationMessage, setOperationMessage] = useState("");
  const [operationErrors, setOperationErrors] = useState([]);
  const [operationAlreadyExisting, setOperationAlreadyExisting] = useState(
    [],
  );

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [generateSelectedContracts, setGenerateSelectedContracts] = useState(
    [],
  );

  const [showBoletosModal, setShowBoletosModal] = useState(false);
  const [isGeneratingBoletos, setIsGeneratingBoletos] = useState(false);
  const [boletosError, setBoletosError] = useState("");
  const [boletosSelectedContracts, setBoletosSelectedContracts] = useState(
    [],
  );
  // Contratos que geraram anuidade com sucesso na última chamada de "gerar
  // anuidades em massa" nesta aba — usado só pra sugerir o modal de
  // boletos com o que a própria pessoa acabou de gerar, sem perguntar ao
  // banco "o que foi criado recentemente" (isso misturava anuidades
  // geradas por outras pessoas usando o sistema ao mesmo tempo).
  const [lastGeneratedContracts, setLastGeneratedContracts] = useState([]);

  const [selectedAnnualityIds, setSelectedAnnualityIds] = useState([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const [showGenerateSelectedModal, setShowGenerateSelectedModal] =
    useState(false);
  const [isGeneratingSelected, setIsGeneratingSelected] = useState(false);
  const [generateSelectedError, setGenerateSelectedError] = useState("");
  const [generateSelectedProgress, setGenerateSelectedProgress] = useState({
    done: 0,
    total: 0,
  });

  // Geração de vários anos para vários contratos de uma vez. Não existe rota
  // em massa no backend pra isso — o laço é feito aqui, contrato a contrato,
  // igual ao "gerar boletos selecionados".
  const [showMultiYearMass, setShowMultiYearMass] = useState(false);
  const [multiYearMassContracts, setMultiYearMassContracts] = useState([]);
  const [multiYearMassYears, setMultiYearMassYears] = useState([]);
  const [multiYearMassDueDate, setMultiYearMassDueDate] = useState("");
  const [multiYearMassGrouped, setMultiYearMassGrouped] = useState(false);
  const [isRunningMultiYearMass, setIsRunningMultiYearMass] = useState(false);
  const [multiYearMassError, setMultiYearMassError] = useState("");
  const [multiYearMassProgress, setMultiYearMassProgress] = useState({
    done: 0,
    total: 0,
  });

  const multiYearMassOptions = useMemo(() => {
    const anoAtual = new Date().getFullYear();
    const anos = [];

    for (let ano = anoAtual - 5; ano <= anoAtual + 1; ano += 1) {
      anos.push(ano);
    }

    return anos;
  }, []);

  const canGenerateAnnualities = hasPermission("ANUIDADES_VISUALIZAR");
  const canGenerateBoletos = hasPermission("ANUIDADES_CRIAR");
  // Disparo de WhatsApp é uma ação de escrita (cria item no Bitrix e
  // registra envio) — usa a mesma permissão de "gerar boletos", não a
  // de simples visualização.
  const canSendBoletos = hasPermission("ANUIDADES_CRIAR");

  useEffect(() => {
    // Mensagem vinda de outra tela (ex.: exclusão de anuidade que redireciona
    // pra cá) — mostra uma vez só e limpa o state pra não reaparecer num F5.
    if (location.state?.flashMessage) {
      setOperationMessage(location.state.flashMessage);
      // Mantém a query string ao limpar o state — ela carrega os filtros.
      navigate(
        { pathname: location.pathname, search: location.search },
        { replace: true, state: {} },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    let active = true;

    async function loadAnnualities() {
      setIsLoading(true);
      setLoadError("");
      // A seleção se refere a linhas da página/filtro atual — ao trocar
      // qualquer um dos dois (ou recarregar), zera pra não mandar
      // WhatsApp pra uma anuidade que já saiu de vista.
      setSelectedAnnualityIds([]);
      try {
        const response = await annualitiesService.list({
          ...appliedFilters,
          numeroPagina: currentPage,
          tamanhoPagina: PAGE_SIZE,
        });
        if (active) setResult(response);
      } catch (error) {
        if (active) {
          setLoadError(
            getApiErrorMessage(
              error,
              "Não foi possível carregar as anuidades.",
            ),
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadAnnualities();
    return () => {
      active = false;
    };
  }, [appliedFilters, currentPage, reloadToken]);

  const pageStatistics = useMemo(() => {
    const withReceivable = result.items.filter(
      (annuality) => annuality.possuiContaReceber,
    ).length;
    return {
      withReceivable,
      withoutReceivable: result.items.length - withReceivable,
      pageValue: result.items.reduce(
        (total, annuality) => total + annuality.valor,
        0,
      ),
    };
  }, [result.items]);

  const hasAppliedFilters = Object.values(appliedFilters).some(
    (value) => value !== "" && value !== "TODOS",
  );
  const hasDraftFilters = Object.values(filters).some(
    (value) => value !== "" && value !== "TODOS",
  );

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setCurrentPage(1);
    setAppliedFilters({ ...filters });
  }

  function clearFilters() {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setCurrentPage(1);
  }

  function openGenerateModal() {
    setGenerateError("");
    setGenerateSelectedContracts([]);
    setShowGenerateModal(true);
  }

  function closeGenerateModal() {
    if (isGenerating) return;
    setShowGenerateModal(false);
    setGenerateError("");
  }

  async function handleGenerateEmMassa() {
    if (generateSelectedContracts.length === 0) return;

    setIsGenerating(true);
    setGenerateError("");
    setOperationMessage("");
    setOperationErrors([]);
    setOperationAlreadyExisting([]);

    try {
      const generated = await annualitiesService.gerarEmMassa(
        "",
        generateSelectedContracts.map((contract) => contract.id),
      );

      setLastGeneratedContracts(generated.contratosGerados ?? []);

      const jaExistiamCount = generated.contratosJaExistentes.length;

      setOperationMessage(
        `${generated.geradas} de ${generated.totalContratos} contratos ` +
          `ganharam anuidade nova${
            generated.erros > 0
              ? ` (${generated.erros} com erro — veja os contratos abaixo)`
              : ""
          }${
            jaExistiamCount > 0
              ? ` (${jaExistiamCount} já possuíam anuidade — veja abaixo)`
              : ""
          }.`,
      );
      setOperationErrors(generated.contratosComErro);
      setOperationAlreadyExisting(generated.contratosJaExistentes);
      setShowGenerateModal(false);
      setReloadToken((current) => current + 1);
    } catch (error) {
      setGenerateError(
        getApiErrorMessage(
          error,
          "Não foi possível gerar as anuidades em massa.",
        ),
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function openBoletosModal() {
    setBoletosError("");
    // Sugestão de comodidade: pré-seleciona os contratos que a própria
    // pessoa acabou de gerar anuidade nesta aba (guardado em
    // lastGeneratedContracts). Antes isso vinha de uma consulta genérica
    // "o que foi criado na última hora" — como o sistema é usado por
    // várias pessoas ao mesmo tempo, isso misturava anuidades geradas por
    // outra máquina na sugestão. Agora usa só o resultado da própria
    // requisição de geração, sem perguntar nada ao banco. O usuário pode
    // remover/adicionar livremente antes de confirmar.
    setBoletosSelectedContracts(lastGeneratedContracts);
    setShowBoletosModal(true);
  }

  function closeBoletosModal() {
    if (isGeneratingBoletos) return;
    setShowBoletosModal(false);
    setBoletosError("");
  }

  async function handleGenerateBoletosEmMassa() {
    if (boletosSelectedContracts.length === 0) return;

    setIsGeneratingBoletos(true);
    setBoletosError("");
    setOperationMessage("");
    setOperationErrors([]);
    setOperationAlreadyExisting([]);

    try {
      const generated = await annualitiesService.gerarBoletosEmMassa(
        boletosSelectedContracts.map((contract) => contract.id),
      );

      const jaExistiamCount = generated.contratosJaExistentes.length;

      setOperationMessage(
        `${generated.gerados} de ${generated.total} anuidades ganharam ` +
          `boleto novo${
            generated.erros > 0
              ? ` (${generated.erros} com erro — veja os contratos abaixo)`
              : ""
          }${
            jaExistiamCount > 0
              ? ` (${jaExistiamCount} já possuíam boleto — veja abaixo)`
              : ""
          }.`,
      );
      setOperationErrors(generated.contratosComErro);
      setOperationAlreadyExisting(generated.contratosJaExistentes);
      setShowBoletosModal(false);
      setReloadToken((current) => current + 1);
    } catch (error) {
      setBoletosError(
        getApiErrorMessage(
          error,
          "Não foi possível gerar os boletos em massa.",
        ),
      );
    } finally {
      setIsGeneratingBoletos(false);
    }
  }

  // A seleção aceita qualquer linha da página. O que muda é o destino: as
  // anuidades que já têm boleto seguem pro envio por WhatsApp, e as que
  // estão "Sem boleto" seguem pra geração — que antes só dava pra fazer
  // uma a uma, entrando em cada anuidade.
  const selectableIds = result.items.map((annuality) => annuality.id);
  const allSelectableSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selectedAnnualityIds.includes(id));

  const selectedAnnualities = result.items.filter((annuality) =>
    selectedAnnualityIds.includes(annuality.id),
  );
  const selectedComBoleto = selectedAnnualities.filter(
    (annuality) => annuality.boletoGerado,
  );
  const selectedSemBoleto = selectedAnnualities.filter(
    (annuality) => !annuality.boletoGerado,
  );

  function toggleAnnualitySelection(annualityId) {
    setSelectedAnnualityIds((current) =>
      current.includes(annualityId)
        ? current.filter((id) => id !== annualityId)
        : [...current, annualityId],
    );
  }

  function toggleSelectAllSelectable() {
    setSelectedAnnualityIds(allSelectableSelected ? [] : selectableIds);
  }

  function openSendModal() {
    setSendError("");
    setShowSendModal(true);
  }

  function closeSendModal() {
    if (isSending) return;
    setShowSendModal(false);
    setSendError("");
  }

  function openGenerateSelectedModal() {
    setGenerateSelectedError("");
    setGenerateSelectedProgress({ done: 0, total: selectedSemBoleto.length });
    setShowGenerateSelectedModal(true);
  }

  function closeGenerateSelectedModal() {
    if (isGeneratingSelected) return;
    setShowGenerateSelectedModal(false);
    setGenerateSelectedError("");
  }

  // Gera os boletos das anuidades "Sem boleto" uma a uma, reaproveitando a
  // mesma rota que o botão "Gerar boleto" da tela de detalhes já usa. É
  // sequencial de propósito: cada anuidade conversa com a Omie, e mandar
  // todas numa requisição só faria a chamada estourar o tempo limite do
  // navegador em lotes maiores. Uma falha não interrompe o lote — ela é
  // registrada e o restante continua.
  async function handleGerarBoletosSelecionados() {
    if (selectedSemBoleto.length === 0) return;

    setIsGeneratingSelected(true);
    setGenerateSelectedError("");
    setOperationMessage("");
    setOperationErrors([]);
    setOperationAlreadyExisting([]);
    setGenerateSelectedProgress({ done: 0, total: selectedSemBoleto.length });

    const erros = [];
    let gerados = 0;

    for (const annuality of selectedSemBoleto) {
      try {
        await annualitiesService.gerarBoleto(annuality.id);
        gerados += 1;
      } catch (error) {
        erros.push({
          contratoId: `anuidade-${annuality.id}`,
          numero: annuality.numeroContrato,
          letra: annuality.letraContrato,
          motivo: getApiErrorMessage(
            error,
            "Não foi possível gerar o boleto.",
          ),
        });
      } finally {
        setGenerateSelectedProgress((current) => ({
          ...current,
          done: current.done + 1,
        }));
      }
    }

    setOperationMessage(
      `${gerados} de ${selectedSemBoleto.length} ` +
        `${
          selectedSemBoleto.length === 1
            ? "boleto foi gerado"
            : "boletos foram gerados"
        }` +
        `${erros.length > 0 ? ` (${erros.length} com erro — veja abaixo)` : ""}.`,
    );
    setOperationErrors(erros);
    setShowGenerateSelectedModal(false);
    setSelectedAnnualityIds([]);
    setIsGeneratingSelected(false);
    setReloadToken((current) => current + 1);
  }

  function openMultiYearMass() {
    setMultiYearMassError("");
    setMultiYearMassContracts([]);
    setMultiYearMassYears([]);
    setMultiYearMassDueDate("");
    setMultiYearMassGrouped(false);
    setMultiYearMassProgress({ done: 0, total: 0 });
    setShowMultiYearMass(true);
  }

  function closeMultiYearMass() {
    if (isRunningMultiYearMass) return;

    setShowMultiYearMass(false);
    setMultiYearMassError("");
  }

  function toggleMultiYearMassYear(ano) {
    setMultiYearMassError("");
    setMultiYearMassYears((current) =>
      current.includes(ano)
        ? current.filter((item) => item !== ano)
        : [...current, ano].sort((a, b) => a - b),
    );
  }

  // Percorre os contratos um a um. Para cada um: descobre quais dos anos
  // pedidos ele AINDA não tem, gera só esses e, se a pessoa marcou, junta
  // tudo num boleto só.
  //
  // O passo de "descobrir o que já existe" não é frescura: a API grava a
  // anuidade por (contrato, ano) com upsert — mandar um ano que já existe
  // sobrescreve valor, vencimento e situação da anuidade antiga, inclusive
  // de uma que já tem boleto emitido na Omie. Aqui a gente simplesmente não
  // manda esses anos.
  //
  // Sequencial de propósito: cada contrato com boleto agrupado conversa com
  // a Omie, e disparar tudo de uma vez esbarra na proteção anti-flood dela.
  // Uma falha não interrompe o lote — vira linha no relatório e segue.
  async function handleMultiYearMass() {
    if (
      multiYearMassContracts.length === 0 ||
      multiYearMassYears.length === 0
    ) {
      return;
    }

    setIsRunningMultiYearMass(true);
    setMultiYearMassError("");
    setOperationMessage("");
    setOperationErrors([]);
    setOperationAlreadyExisting([]);
    setMultiYearMassProgress({
      done: 0,
      total: multiYearMassContracts.length,
    });

    const erros = [];
    const jaExistiam = [];
    let contratosAtendidos = 0;
    let anuidadesCriadas = 0;
    let boletosGerados = 0;
    let whatsappPendentes = 0;

    for (const [indice, contrato] of multiYearMassContracts.entries()) {
      try {
        const detalhes = await contractsService.getById(contrato.id);

        const anosExistentes = new Set(
          (detalhes?.anuidades ?? [])
            .map((anuidade) => Number(anuidade.anoReferencia))
            .filter(Boolean),
        );

        const anosFaltantes = multiYearMassYears.filter(
          (ano) => !anosExistentes.has(ano),
        );

        if (anosFaltantes.length === 0) {
          jaExistiam.push({
            contratoId: contrato.id,
            numero: contrato.numero,
            letra: contrato.letra,
            mensagem:
              "Já possui anuidade para todos os anos selecionados — nada foi alterado.",
          });
          continue;
        }

        const anosPulados = multiYearMassYears.filter((ano) =>
          anosExistentes.has(ano),
        );

        if (anosPulados.length > 0) {
          jaExistiam.push({
            contratoId: contrato.id,
            numero: contrato.numero,
            letra: contrato.letra,
            mensagem:
              `Anos ${anosPulados.join(", ")} já existiam e foram pulados. ` +
              `Gerados: ${anosFaltantes.join(", ")}.`,
          });
        }

        const gerado = await annualitiesService.gerarMultiplosAnos(
          contrato.id,
          anosFaltantes,
          multiYearMassDueDate,
        );

        contratosAtendidos += 1;
        anuidadesCriadas += gerado.anuidades.length;

        if (multiYearMassGrouped && gerado.anuidades.length > 0) {
          const boleto = await annualitiesService.gerarBoletoMultiplosAnos(
            gerado.anuidades.map((anuidade) => anuidade.anuidadeId),
          );

          boletosGerados += 1;

          // Boleto gerado, mas o WhatsApp automático falhou: não é erro da
          // geração. Vai pro relatório pra pessoa reenviar depois (botão
          // "Enviar boleto" ou envio em massa com o filtro "Não enviada").
          if (!boleto.whatsappEnviado) {
            whatsappPendentes += 1;
            erros.push({
              contratoId: `whatsapp-${contrato.id}`,
              numero: contrato.numero,
              letra: contrato.letra,
              motivo:
                `Boleto ${boleto.numeroBoleto ?? ""} gerado, mas o WhatsApp não ` +
                `foi enviado: ${boleto.erroEnvioWhatsapp ?? "motivo não informado"}. ` +
                "Reenvie em alguns minutos.",
            });
          }
        }
      } catch (error) {
        erros.push({
          contratoId: contrato.id,
          numero: contrato.numero,
          letra: contrato.letra,
          motivo: getApiErrorMessage(
            error,
            "Não foi possível processar este contrato.",
          ),
        });
      } finally {
        setMultiYearMassProgress((current) => ({
          ...current,
          done: current.done + 1,
        }));
      }

      // Respiro entre contratos quando há boleto envolvido, pra não bater na
      // proteção anti-flood da Omie.
      if (
        multiYearMassGrouped &&
        indice < multiYearMassContracts.length - 1
      ) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    setOperationMessage(
      `${contratosAtendidos} de ${multiYearMassContracts.length} contratos ` +
        `ganharam anuidade nova (${anuidadesCriadas} anuidades` +
        `${multiYearMassGrouped ? `, ${boletosGerados} boletos únicos` : ""})` +
        `${whatsappPendentes > 0 ? ` (${whatsappPendentes} com WhatsApp pendente)` : ""}` +
        `${erros.length - whatsappPendentes > 0 ? ` (${erros.length - whatsappPendentes} com erro)` : ""}` +
        `${erros.length > 0 ? " — veja abaixo" : ""}` +
        `${jaExistiam.length > 0 ? ` (${jaExistiam.length} com anos já existentes — veja abaixo)` : ""}.`,
    );
    setOperationErrors(erros);
    setOperationAlreadyExisting(jaExistiam);
    setShowMultiYearMass(false);
    setIsRunningMultiYearMass(false);
    setReloadToken((current) => current + 1);
  }

  async function handleSendBoletosEmMassa() {
    if (selectedComBoleto.length === 0) return;

    setIsSending(true);
    setSendError("");
    setOperationMessage("");
    setOperationErrors([]);
    setOperationAlreadyExisting([]);

    try {
      const sent = await annualitiesService.enviarBoletosEmMassa(
        selectedComBoleto.map((annuality) => annuality.id),
      );

      setOperationMessage(
        `${sent.totalEnviados} de ${sent.totalEncontrados} boletos foram ` +
          `enviados pelo WhatsApp${
            sent.totalIgnorados > 0
              ? ` (${sent.totalIgnorados} pulados — cliente já recebeu mensagem recentemente)`
              : ""
          }${
            sent.totalErros > 0
              ? ` (${sent.totalErros} com erro — veja abaixo)`
              : ""
          }.`,
      );
      setOperationErrors(
        sent.erros.map((mensagem, index) =>
          splitOperationMessage(mensagem, `erro-${index}`, "motivo"),
        ),
      );
      setOperationAlreadyExisting(
        sent.ignorados.map((mensagem, index) =>
          splitOperationMessage(mensagem, `ignorado-${index}`, "mensagem"),
        ),
      );
      setShowSendModal(false);
      setSelectedAnnualityIds([]);
      setReloadToken((current) => current + 1);
    } catch (error) {
      setSendError(
        getApiErrorMessage(
          error,
          "Não foi possível enviar os boletos pelo WhatsApp.",
        ),
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-5 rounded-3xl border border-[#e7e1e9] bg-white p-5 shadow-[0_8px_30px_rgba(56,32,65,0.04)] sm:p-6 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#754286]">
            Gestão financeira
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#2d2530]">
            Anuidades
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#817688]">
            Consulte valores, vencimentos e vínculos financeiros das anuidades
            associadas aos contratos.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {canGenerateBoletos && selectedSemBoleto.length > 0 && (
            <button
              type="button"
              onClick={openGenerateSelectedModal}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#432059] px-4 text-sm font-bold text-white transition hover:bg-[#341846]"
            >
              <Banknote size={18} />
              Gerar boletos selecionados ({selectedSemBoleto.length})
            </button>
          )}
          {canSendBoletos && selectedComBoleto.length > 0 && (
            <button
              type="button"
              onClick={openSendModal}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              <MessageCircle size={18} />
              Enviar boletos selecionados ({selectedComBoleto.length})
            </button>
          )}
          {canGenerateBoletos && (
            <button
              type="button"
              onClick={openBoletosModal}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dcd4df] bg-white px-4 text-sm font-bold text-[#432059] transition hover:border-[#432059] hover:bg-[#f8f4fa]"
            >
              <Banknote size={18} />
              Gerar boletos em massa
            </button>
          )}
          {canGenerateAnnualities && (
            <button
              type="button"
              onClick={openGenerateModal}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dcd4df] bg-white px-4 text-sm font-bold text-[#432059] transition hover:border-[#432059] hover:bg-[#f8f4fa]"
            >
              <CalendarPlus size={18} />
              Gerar anuidades em massa
            </button>
          )}
          {canGenerateAnnualities && (
            <button
              type="button"
              onClick={openMultiYearMass}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dcd4df] bg-white px-4 text-sm font-bold text-[#432059] transition hover:border-[#432059] hover:bg-[#f8f4fa]"
            >
              <Layers size={18} />
              Vários anos em massa
            </button>
          )}
          <button
            type="button"
            onClick={() => setReloadToken((current) => current + 1)}
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dcd4df] bg-white px-4 text-sm font-bold text-[#432059] transition hover:border-[#432059] hover:bg-[#f8f4fa] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            Atualizar dados
          </button>
        </div>
      </section>

      {operationMessage && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800"
        >
          <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Operação concluída</p>
            <p className="mt-1 text-sm leading-6">{operationMessage}</p>

            {operationErrors.length > 0 && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-amber-800">
                  Contratos com erro
                </p>
                <ul className="mt-2 space-y-1.5">
                  {operationErrors.map((error) => (
                    <li
                      key={error.contratoId}
                      className="text-sm leading-5 text-amber-900"
                    >
                      <span className="font-bold">
                        {error.numero}
                        {error.letra ? `/${error.letra}` : ""}
                      </span>
                      {error.motivo && (
                        <span className="text-amber-800"> — {error.motivo}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {operationAlreadyExisting.length > 0 && (
              <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-blue-800">
                  Contratos que já possuíam
                </p>
                <ul className="mt-2 space-y-1.5">
                  {operationAlreadyExisting.map((item) => (
                    <li
                      key={item.contratoId}
                      className="text-sm leading-5 text-blue-900"
                    >
                      <span className="font-bold">
                        {item.numero}
                        {item.letra ? `/${item.letra}` : ""}
                      </span>
                      {item.mensagem && (
                        <span className="text-blue-800"> — {item.mensagem}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setOperationMessage("");
              setOperationErrors([]);
              setOperationAlreadyExisting([]);
            }}
            className="shrink-0 rounded-lg p-1 transition hover:bg-emerald-100"
            aria-label="Fechar mensagem"
          >
            <XCircle size={18} />
          </button>
        </div>
      )}

      {loadError && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
          <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold">
              Não foi possível carregar as anuidades
            </p>
            <p className="mt-1 text-sm leading-6">{loadError}</p>
          </div>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatisticCard label="Anuidades encontradas" value={result.totalRegistros} icon={ReceiptText} iconClassName="bg-[#f0e8f3] text-[#432059]" />
        <StatisticCard label="Valor nesta página" value={currencyFormatter.format(pageStatistics.pageValue)} icon={CircleDollarSign} iconClassName="bg-emerald-50 text-emerald-700" compact />
        <StatisticCard label="Com conta a receber" value={pageStatistics.withReceivable} icon={CheckCircle2} iconClassName="bg-blue-50 text-blue-700" />
        <StatisticCard label="Sem conta a receber" value={pageStatistics.withoutReceivable} icon={XCircle} iconClassName="bg-amber-50 text-amber-700" />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e7e1e9] bg-white shadow-[0_8px_30px_rgba(56,32,65,0.04)]">
        <form onSubmit={handleSubmit} className="grid gap-3 border-b border-[#eee9f0] p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-6">
          <FilterField icon={CalendarDays}>
            <input name="anoReferencia" type="number" min="2000" max="2200" value={filters.anoReferencia} onChange={handleFilterChange} placeholder="Ano de referência" className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-[#aaa1ae]" />
          </FilterField>
          <FilterField icon={FileText}>
            <input name="numeroContrato" value={filters.numeroContrato} onChange={handleFilterChange} placeholder="Número do contrato" className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-[#aaa1ae]" />
          </FilterField>
          <FilterField icon={Hash}>
            <input name="contratoId" type="number" min="1" value={filters.contratoId} onChange={handleFilterChange} placeholder="Código do contrato" className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-[#aaa1ae]" />
          </FilterField>
          <FilterField icon={Search}>
            <input name="situacao" value={filters.situacao} onChange={handleFilterChange} placeholder="Situação" className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-[#aaa1ae]" />
          </FilterField>
          <select name="contaReceber" value={filters.contaReceber} onChange={handleFilterChange} className="h-12 rounded-xl border border-[#ded8e2] bg-white px-3 text-sm font-semibold text-[#5d5361] outline-none transition focus:border-[#432059] focus:ring-4 focus:ring-[#432059]/10">
            <option value="TODOS">Todas as contas</option>
            <option value="COM_CONTA">Com conta a receber</option>
            <option value="SEM_CONTA">Sem conta a receber</option>
          </select>
          <select name="whatsapp" value={filters.whatsapp} onChange={handleFilterChange} className="h-12 rounded-xl border border-[#ded8e2] bg-white px-3 text-sm font-semibold text-[#5d5361] outline-none transition focus:border-[#432059] focus:ring-4 focus:ring-[#432059]/10">
            <option value="TODOS">Todos os WhatsApp</option>
            <option value="ENVIADA">Já enviada</option>
            <option value="NAO_ENVIADA">Não enviada</option>
          </select>
          <select name="boleto" value={filters.boleto} onChange={handleFilterChange} className="h-12 rounded-xl border border-[#ded8e2] bg-white px-3 text-sm font-semibold text-[#5d5361] outline-none transition focus:border-[#432059] focus:ring-4 focus:ring-[#432059]/10">
            <option value="TODOS">Todos os boletos</option>
            <option value="COM_BOLETO">Com boleto</option>
            <option value="SEM_BOLETO">Sem boleto</option>
          </select>
          <div className="flex gap-2 md:col-span-2 xl:col-span-6 xl:justify-end">
            <button type="submit" className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#432059] px-5 text-sm font-bold text-white transition hover:bg-[#341366] xl:flex-none">
              <Search size={18} />
              Buscar anuidades
            </button>
            {(hasAppliedFilters || hasDraftFilters) && (
              <button type="button" onClick={clearFilters} className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#ded8e2] text-[#766c7a] transition hover:border-[#432059] hover:bg-[#f8f4fa] hover:text-[#432059]" aria-label="Limpar filtros">
                <FilterX size={19} />
              </button>
            )}
          </div>
        </form>

        {isLoading ? (
          <LoadingState />
        ) : result.items.length === 0 ? (
          <EmptyState hasFilters={hasAppliedFilters} onClear={clearFilters} />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full border-collapse">
                <thead className="bg-[#faf8fb]">
                  <tr>
                    {(canSendBoletos || canGenerateBoletos) && (
                      <TableHeading>
                        <input
                          type="checkbox"
                          checked={allSelectableSelected}
                          onChange={toggleSelectAllSelectable}
                          disabled={selectableIds.length === 0}
                          aria-label="Selecionar todas as anuidades da página"
                          className="h-4 w-4 rounded border-[#ded8e2] accent-[#432059]"
                        />
                      </TableHeading>
                    )}
                    <TableHeading>Contrato</TableHeading>
                    <TableHeading>Ano</TableHeading>
                    <TableHeading>Valor</TableHeading>
                    <TableHeading>Vencimento</TableHeading>
                    <TableHeading>Situação</TableHeading>
                    <TableHeading>Conta a receber</TableHeading>
                    <TableHeading>WhatsApp</TableHeading>
                    <TableHeading>Gerada em</TableHeading>
                    <TableHeading align="right">Ações</TableHeading>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0ecf2]">
                  {result.items.map((annuality) => (
                    <tr key={annuality.id} className="transition hover:bg-[#fcfafc]">
                      {(canSendBoletos || canGenerateBoletos) && (
                        <td className="px-5 py-4">
                          <input
                            type="checkbox"
                            checked={selectedAnnualityIds.includes(annuality.id)}
                            onChange={() => toggleAnnualitySelection(annuality.id)}
                            aria-label={`Selecionar anuidade ${annuality.id}`}
                            className="h-4 w-4 rounded border-[#ded8e2] accent-[#432059]"
                          />
                        </td>
                      )}
                      <td className="px-5 py-4"><AnnualityIdentity annuality={annuality} /></td>
                      <td className="px-5 py-4 text-sm font-semibold text-[#615766]">{annuality.anoReferencia ?? "Não informado"}</td>
                      <td className="px-5 py-4 text-sm font-bold text-[#342b37]">{currencyFormatter.format(annuality.valor)}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-[#615766]">{formatDate(annuality.dataVencimento)}</td>
                      <td className="px-5 py-4"><SituationBadge value={annuality.situacao} /></td>
                      <td className="px-5 py-4"><ReceivableBadge linked={annuality.possuiContaReceber} /></td>
                      <td className="px-5 py-4">
                        <MessageStatusBadge
                          sent={annuality.mensagemEnviada}
                          hasBoleto={annuality.boletoGerado}
                        />
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-[#615766]">{formatDateTime(annuality.criadoEm)}</td>
                      <td className="px-5 py-4 text-right"><AnnualityDetailsLink annualityId={annuality.id} backSearch={listSearch} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-[#f0ecf2] lg:hidden">
              {result.items.map((annuality) => (
                <article key={annuality.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {(canSendBoletos || canGenerateBoletos) && (
                        <input
                          type="checkbox"
                          checked={selectedAnnualityIds.includes(annuality.id)}
                          onChange={() => toggleAnnualitySelection(annuality.id)}
                          aria-label={`Selecionar anuidade ${annuality.id}`}
                          className="h-4 w-4 shrink-0 rounded border-[#ded8e2] accent-[#432059]"
                        />
                      )}
                      <AnnualityIdentity annuality={annuality} />
                    </div>
                    <ReceivableBadge linked={annuality.possuiContaReceber} />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Information label="Ano" value={annuality.anoReferencia ?? "Não informado"} />
                    <Information label="Valor" value={currencyFormatter.format(annuality.valor)} />
                    <Information label="Vencimento" value={formatDate(annuality.dataVencimento)} />
                    <Information label="Situação" value={annuality.situacao || "Não informada"} />
                    <Information label="Gerada em" value={formatDateTime(annuality.criadoEm)} />
                  </div>
                  <div className="mt-3">
                    <MessageStatusBadge
                      sent={annuality.mensagemEnviada}
                      hasBoleto={annuality.boletoGerado}
                    />
                  </div>
                  <AnnualityDetailsLink annualityId={annuality.id} mobile backSearch={listSearch} />
                </article>
              ))}
            </div>
            <Pagination
              currentPage={result.numeroPagina ?? currentPage}
              totalPages={Math.max(result.totalPaginas ?? 1, 1)}
              totalRecords={result.totalRegistros}
              canGoBack={result.temPaginaAnterior}
              canGoForward={result.temProximaPagina}
              onPrevious={() => setCurrentPage((page) => Math.max(1, page - 1))}
              onNext={() => setCurrentPage((page) => page + 1)}
              onPageChange={setCurrentPage}
              itemLabelSingular={
                appliedFilters.anoReferencia
                  ? `anuidade de ${appliedFilters.anoReferencia}`
                  : "anuidade encontrada (todos os anos)"
              }
              itemLabelPlural={
                appliedFilters.anoReferencia
                  ? `anuidades de ${appliedFilters.anoReferencia}`
                  : "anuidades encontradas (todos os anos)"
              }
            />
          </>
        )}
      </section>

      <Modal
        open={showMultiYearMass}
        onClose={closeMultiYearMass}
        title="Vários anos em massa"
        description="Gera as anuidades dos anos escolhidos para vários contratos de uma vez."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5 px-5 py-6 sm:px-6">
          <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <AlertTriangle size={22} className="mt-0.5 shrink-0" />
            <p className="text-sm leading-6 text-amber-800">
              Anos que o contrato <strong>já possui</strong> são pulados — nada
              existente é sobrescrito. Contratos sem titular único ou sem regra
              de cobrança são contados como erro, sem travar o resto.
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#988e9c]">
              Contratos selecionados
            </p>
            <ContractPicker
              selected={multiYearMassContracts}
              onChange={setMultiYearMassContracts}
            />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#988e9c]">
              Anos a cobrar
            </p>
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
              {multiYearMassOptions.map((ano) => {
                const selecionado = multiYearMassYears.includes(ano);

                return (
                  <button
                    key={ano}
                    type="button"
                    onClick={() => toggleMultiYearMassYear(ano)}
                    disabled={isRunningMultiYearMass}
                    className={`h-12 rounded-xl border text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      selecionado
                        ? "border-[#432059] bg-[#432059] text-white"
                        : "border-[#dad3dd] bg-white text-[#554b59] hover:border-[#bfaec6] hover:bg-[#f8f4fa]"
                    }`}
                  >
                    {ano}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              htmlFor="multi-year-mass-due-date"
              className="text-xs font-bold uppercase tracking-[0.12em] text-[#988e9c]"
            >
              Vencimento (opcional)
            </label>
            <input
              id="multi-year-mass-due-date"
              type="date"
              value={multiYearMassDueDate}
              onChange={(event) => setMultiYearMassDueDate(event.target.value)}
              disabled={isRunningMultiYearMass}
              className="mt-2 h-11 w-full rounded-xl border border-[#dad3dd] bg-white px-3 text-sm text-[#625766] outline-none transition focus:border-[#432059] disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e7e1e9] bg-white p-4">
            <input
              type="checkbox"
              checked={multiYearMassGrouped}
              onChange={(event) =>
                setMultiYearMassGrouped(event.target.checked)
              }
              disabled={isRunningMultiYearMass}
              className="mt-1 h-4 w-4 shrink-0 accent-[#432059]"
            />
            <span>
              <span className="block font-bold text-[#3d3340]">
                Gerar um boleto único por contrato
              </span>
              <span className="mt-1 block text-sm leading-6 text-[#8a808e]">
                Soma os anos de cada contrato num boleto só. Isso conversa com
                a Omie contrato a contrato, então o lote fica mais lento — sem
                marcar, só as anuidades são criadas e os boletos ficam pra
                depois.
              </span>
            </span>
          </label>

          {isRunningMultiYearMass && (
            <div className="rounded-xl border border-[#e7e1e9] bg-[#faf8fb] p-4">
              <p className="text-sm font-semibold text-[#554b59]">
                Processando {multiYearMassProgress.done} de{" "}
                {multiYearMassProgress.total} contratos…
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eee9f0]">
                <div
                  className="h-full rounded-full bg-[#432059] transition-all"
                  style={{
                    width: `${
                      multiYearMassProgress.total === 0
                        ? 0
                        : (multiYearMassProgress.done /
                            multiYearMassProgress.total) *
                          100
                    }%`,
                  }}
                />
              </div>
            </div>
          )}

          {multiYearMassError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
            >
              <XCircle size={19} className="mt-0.5 shrink-0" />
              <p className="text-sm leading-6">{multiYearMassError}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#eee9f0] bg-[#fcfafc] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={closeMultiYearMass}
            disabled={isRunningMultiYearMass}
            className="h-11 rounded-xl border border-[#dad3dd] px-5 text-sm font-bold text-[#675d6b] transition hover:border-[#bfaec6] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleMultiYearMass}
            disabled={
              isRunningMultiYearMass ||
              multiYearMassContracts.length === 0 ||
              multiYearMassYears.length === 0
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#432059] px-5 text-sm font-bold text-white transition hover:bg-[#341366] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRunningMultiYearMass ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Layers size={17} />
                {`Gerar em ${multiYearMassContracts.length} contrato(s)`}
              </>
            )}
          </button>
        </div>
      </Modal>

      <Modal
        open={showGenerateModal}
        onClose={closeGenerateModal}
        title="Gerar anuidades em massa"
        description="Escolha os contratos e gere anuidade pra todos de uma vez, com vencimento padrão calculado pela API."
        maxWidth="max-w-lg"
      >
        <div className="space-y-5 px-5 py-6 sm:px-6">
          <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <AlertTriangle size={22} className="mt-0.5 shrink-0" />
            <p className="text-sm leading-6 text-amber-800">
              Contratos que não existirem ou não satisfizerem as regras de
              cobrança são pulados e contados como erro, sem travar o resto.
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#988e9c]">
              Contratos selecionados
            </p>
            <ContractPicker
              selected={generateSelectedContracts}
              onChange={setGenerateSelectedContracts}
            />
          </div>

          {generateError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
            >
              <XCircle size={19} className="mt-0.5 shrink-0" />
              <p className="text-sm leading-6">{generateError}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#eee9f0] bg-[#fcfafc] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={closeGenerateModal}
            disabled={isGenerating}
            className="h-11 rounded-xl border border-[#dad3dd] px-5 text-sm font-bold text-[#675d6b] transition hover:border-[#bfaec6] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleGenerateEmMassa}
            disabled={isGenerating || generateSelectedContracts.length === 0}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#432059] px-5 text-sm font-bold text-white transition hover:bg-[#341366] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <CalendarPlus size={17} />
                Gerar anuidades
              </>
            )}
          </button>
        </div>
      </Modal>

      <Modal
        open={showBoletosModal}
        onClose={closeBoletosModal}
        title="Gerar boletos em massa"
        description="Escolha os contratos e gere boleto pra suas anuidades aprovadas do ano corrente que ainda não têm conta a receber."
        maxWidth="max-w-lg"
      >
        <div className="space-y-5 px-5 py-6 sm:px-6">
          <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <AlertTriangle size={22} className="mt-0.5 shrink-0" />
            <p className="text-sm leading-6 text-amber-800">
              Isso fala com a Omie pra cada contrato selecionado. Contratos
              que não satisfizerem as regras são pulados e contados como
              erro.
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#988e9c]">
              Contratos selecionados
            </p>
            <ContractPicker
              selected={boletosSelectedContracts}
              onChange={setBoletosSelectedContracts}
            />
            <p className="mt-2 text-xs leading-5 text-[#918794]">
              Sugerido com base nos contratos que você gerou anuidade agora
              há pouco nesta aba — remova ou adicione à vontade antes de
              confirmar.
            </p>
          </div>

          {boletosError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
            >
              <XCircle size={19} className="mt-0.5 shrink-0" />
              <p className="text-sm leading-6">{boletosError}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#eee9f0] bg-[#fcfafc] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={closeBoletosModal}
            disabled={isGeneratingBoletos}
            className="h-11 rounded-xl border border-[#dad3dd] px-5 text-sm font-bold text-[#675d6b] transition hover:border-[#bfaec6] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleGenerateBoletosEmMassa}
            disabled={
              isGeneratingBoletos || boletosSelectedContracts.length === 0
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#432059] px-5 text-sm font-bold text-white transition hover:bg-[#341366] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGeneratingBoletos ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Banknote size={17} />
                Gerar boletos
              </>
            )}
          </button>
        </div>
      </Modal>

      <Modal
        open={showGenerateSelectedModal}
        onClose={closeGenerateSelectedModal}
        title="Gerar boletos das anuidades selecionadas"
        description="Gera o boleto na Omie de cada anuidade selecionada que ainda não tem um. Ao final da geração, o boleto já sai pelo WhatsApp."
        maxWidth="max-w-lg"
      >
        <div className="space-y-5 px-5 py-6 sm:px-6">
          <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <AlertTriangle size={22} className="mt-0.5 shrink-0" />
            <p className="text-sm leading-6 text-amber-800">
              As anuidades são processadas uma de cada vez, porque cada uma
              conversa com a Omie. Se alguma falhar, o restante continua e o
              erro dela aparece no resumo no fim. Não feche a página durante
              o processo.
            </p>
          </div>

          <p className="text-sm leading-6 text-[#615766]">
            <span className="font-bold text-[#342b37]">
              {selectedSemBoleto.length}
            </span>{" "}
            {selectedSemBoleto.length === 1
              ? "anuidade sem boleto selecionada"
              : "anuidades sem boleto selecionadas"}
            .
          </p>

          {isGeneratingSelected && generateSelectedProgress.total > 0 && (
            <div>
              <div className="flex items-center justify-between text-sm font-semibold text-[#615766]">
                <span>Gerando boletos...</span>
                <span>
                  {generateSelectedProgress.done} de{" "}
                  {generateSelectedProgress.total}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#efe9f2]">
                <div
                  className="h-full rounded-full bg-[#432059] transition-all"
                  style={{
                    width: `${Math.round(
                      (generateSelectedProgress.done /
                        generateSelectedProgress.total) *
                        100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {generateSelectedError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
            >
              <XCircle size={19} className="mt-0.5 shrink-0" />
              <p className="text-sm leading-6">{generateSelectedError}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#eee9f0] bg-[#fcfafc] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={closeGenerateSelectedModal}
            disabled={isGeneratingSelected}
            className="h-11 rounded-xl border border-[#dad3dd] px-5 text-sm font-bold text-[#675d6b] transition hover:border-[#bfaec6] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleGerarBoletosSelecionados}
            disabled={isGeneratingSelected || selectedSemBoleto.length === 0}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#432059] px-5 text-sm font-bold text-white transition hover:bg-[#341846] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGeneratingSelected ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Banknote size={17} />
                Gerar boletos
              </>
            )}
          </button>
        </div>
      </Modal>

      <Modal
        open={showSendModal}
        onClose={closeSendModal}
        title="Enviar boletos pelo WhatsApp"
        description="Confirma o envio das anuidades selecionadas? Isso cria um card no Bitrix pra cada uma, que dispara a mensagem de WhatsApp pelo pagador."
        maxWidth="max-w-lg"
      >
        <div className="space-y-5 px-5 py-6 sm:px-6">
          <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <AlertTriangle size={22} className="mt-0.5 shrink-0" />
            <p className="text-sm leading-6 text-amber-800">
              Clientes que já receberam uma mensagem nos últimos 30 minutos
              são pulados automaticamente (sem duplicar envio). Isso conta
              como "ignorado", não como erro.
            </p>
          </div>

          <p className="text-sm leading-6 text-[#615766]">
            <span className="font-bold text-[#342b37]">
              {selectedComBoleto.length}
            </span>{" "}
            {selectedComBoleto.length === 1
              ? "anuidade com boleto selecionada"
              : "anuidades com boleto selecionadas"}
            .
          </p>

          {sendError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
            >
              <XCircle size={19} className="mt-0.5 shrink-0" />
              <p className="text-sm leading-6">{sendError}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#eee9f0] bg-[#fcfafc] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={closeSendModal}
            disabled={isSending}
            className="h-11 rounded-xl border border-[#dad3dd] px-5 text-sm font-bold text-[#675d6b] transition hover:border-[#bfaec6] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleSendBoletosEmMassa}
            disabled={isSending || selectedComBoleto.length === 0}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSending ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <MessageCircle size={17} />
                Enviar pelo WhatsApp
              </>
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
}

// As mensagens de erro/ignorado do envio em massa vêm como "Anuidade 123:
// detalhe" — separa isso pra reaproveitar o mesmo bloco visual usado nos
// resultados de "gerar em massa" (que espera numero/letra + motivo).
function splitOperationMessage(mensagem, key, detailField) {
  const separatorIndex = mensagem.indexOf(": ");
  const label =
    separatorIndex === -1 ? "" : mensagem.slice(0, separatorIndex);
  const detail =
    separatorIndex === -1
      ? mensagem
      : mensagem.slice(separatorIndex + 2);

  return {
    contratoId: key,
    numero: label,
    letra: null,
    [detailField]: detail,
  };
}

function formatDate(value) {
  if (!value) return "Não informado";
  return dateFormatter.format(new Date(`${value}T00:00:00Z`));
}

function formatDateTime(value) {
  if (!value) return "Não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function AnnualityDetailsLink({ annualityId, mobile = false, backSearch = "" }) {
  return (
    // Leva os filtros atuais junto, pra que o "Voltar para anuidades" da
    // tela de detalhes devolva a listagem exatamente como estava.
    <Link to={`/anuidades/${annualityId}`} state={{ listSearch: backSearch }} className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#ddd5e0] px-4 text-xs font-bold text-[#5d276d] transition hover:border-[#432059] hover:bg-[#f8f4fa] ${mobile ? "mt-4 w-full" : ""}`}>
      <ReceiptText size={16} />
      Detalhes
    </Link>
  );
}

function FilterField({ icon: Icon, children }) {
  return <div className="flex h-12 items-center rounded-xl border border-[#ded8e2] bg-white text-[#8b818f] transition focus-within:border-[#432059] focus-within:ring-4 focus-within:ring-[#432059]/10"><Icon size={18} className="ml-4 shrink-0" />{children}</div>;
}

function StatisticCard({ label, value, icon: Icon, iconClassName, compact = false }) {
  return <article className="rounded-2xl border border-[#e7e1e9] bg-white p-5 shadow-[0_8px_30px_rgba(56,32,65,0.04)]"><div className="flex items-center justify-between gap-4"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}><Icon size={21} /></div><p className={`${compact ? "text-xl" : "text-3xl"} text-right font-bold tracking-[-0.04em] text-[#302733]`}>{value}</p></div><p className="mt-4 text-sm font-semibold text-[#817688]">{label}</p></article>;
}

function TableHeading({ children, align = "left" }) {
  return <th className={`whitespace-nowrap px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.13em] text-[#8d8391] ${align === "right" ? "text-right" : "text-left"}`}>{children}</th>;
}

// function AnnualityIdentity({ annuality }) {
//   const contract = [annuality.numeroContrato, annuality.letraContrato].filter(Boolean).join(" / ");
//   return <div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ede4f1] text-[#5d276d]"><ReceiptText size={19} /></div><div className="min-w-0"><p className="truncate text-sm font-bold text-[#342b37]">{contract || "Contrato não informado"}</p><p className="mt-1 truncate text-xs text-[#928895]">Anuidade {annuality.id}</p></div></div>;
// }

// Anuidades cobradas num boleto único de vários anos ganham um selo com os
// anos juntos — sem ele, a linha de 2026 parece uma cobrança avulsa de
// R$ 244 quando o cliente na verdade recebeu um boleto só com 2025 + 2026.
function AnnualityIdentity({ annuality }) {
  const contract = [annuality.numeroContrato, annuality.letraContrato].filter(Boolean).join(" / ");
  const anosAgrupados = annuality.anosCobrancaAgrupada ?? [];

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ede4f1] text-[#5d276d]">
        {anosAgrupados.length > 0 ? <Layers size={19} /> : <ReceiptText size={19} />}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-[#342b37]">{contract || "Contrato não informado"}</p>
        <p className="mt-1 truncate text-xs text-[#928895]">Anuidade {annuality.id}</p>
        {anosAgrupados.length > 0 && (
          <span
            title="Esta anuidade é cobrada num boleto único junto com os anos indicados."
            className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-[#d4c0dc] bg-[#f6f0f9] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-[#5d276d]"
          >
            <Layers size={11} />
            Boleto agrupado · {anosAgrupados.join(" + ")}
          </span>
        )}
      </div>
    </div>
  );
}

function SituationBadge({ value }) {
  return <span className="inline-flex rounded-full border border-[#ded4e2] bg-[#f7f3f8] px-2.5 py-1 text-xs font-bold text-[#684974]">{value || "Não informada"}</span>;
}

function ReceivableBadge({ linked }) {
  return <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-bold ${linked ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>{linked ? <CheckCircle2 size={13} /> : <XCircle size={13} />}{linked ? "Vinculada" : "Não vinculada"}</span>;
}

function MessageStatusBadge({ sent, hasBoleto }) {
  if (!hasBoleto) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-[#e7e1e9] bg-[#faf8fb] px-2.5 py-1 text-xs font-bold text-[#a79cab]">
        Sem boleto
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-bold ${
        sent
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-[#ded4e2] bg-[#f7f3f8] text-[#684974]"
      }`}
    >
      {sent ? <CheckCircle2 size={13} /> : <MessageCircle size={13} />}
      {sent ? "Já enviada" : "Não enviada"}
    </span>
  );
}

function Information({ label, value }) {
  return <div className="rounded-xl bg-[#faf8fb] p-3"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#988e9c]">{label}</p><p className="mt-1.5 text-xs font-semibold text-[#554b59]">{value}</p></div>;
}

function LoadingState() {
  return <div className="space-y-3 p-5" aria-label="Carregando anuidades">{[1, 2, 3, 4].map((item) => <div key={item} className="h-16 animate-pulse rounded-2xl bg-[#f3eff4]" />)}</div>;
}

function EmptyState({ hasFilters, onClear }) {
  return <div className="flex min-h-72 flex-col items-center justify-center px-5 py-12 text-center"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f0e8f3] text-[#432059]"><FileSearch size={28} /></div><h3 className="mt-5 text-lg font-bold text-[#342b37]">Nenhuma anuidade encontrada</h3><p className="mt-2 max-w-md text-sm leading-6 text-[#817688]">{hasFilters ? "Revise os filtros utilizados ou faça uma nova pesquisa." : "A API ainda não retornou anuidades para esta consulta."}</p>{hasFilters && <button type="button" onClick={onClear} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl border border-[#dcd4df] px-4 text-sm font-bold text-[#432059] transition hover:border-[#432059] hover:bg-[#f8f4fa]"><FilterX size={18} />Limpar filtros</button>}</div>;
}
