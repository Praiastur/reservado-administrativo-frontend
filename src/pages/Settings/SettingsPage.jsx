import {
  useEffect,
  useState,
} from "react";
import {
  AlertTriangle,
  Braces,
  CheckCircle2,
  Clock3,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  MonitorCog,
  RefreshCcw,
  Save,
  Server,
  ShieldCheck,
  SlidersHorizontal,
  UserRoundCheck,
  X,
} from "lucide-react";

import { Modal } from "../../components/ui/Modal";
import { appConfig } from "../../config/appConfig";
import { useSystemSettings } from "../../contexts/SystemSettingsContext";

const securityPolicies = [
  {
    id: "failed-attempts",
    label: "Tentativas de login",
    value: "5 tentativas",
    description:
      "Quantidade de falhas permitidas antes do bloqueio temporário.",
    icon: KeyRound,
  },
  {
    id: "block-duration",
    label: "Duração do bloqueio",
    value: "15 minutos",
    description:
      "Tempo de bloqueio após múltiplas tentativas inválidas.",
    icon: Clock3,
  },
  {
    id: "token-duration",
    label: "Expiração do token",
    value: "15 minutos",
    description:
      "Validade atual do token de autenticação emitido pelo backend.",
    icon: ShieldCheck,
  },
  {
    id: "authentication",
    label: "Autenticação",
    value: "JWT Bearer",
    description:
      "Modelo utilizado para autorizar requisições protegidas.",
    icon: UserRoundCheck,
  },
];

const initialErrors = {
  systemName: "",
  organizationName: "",
  supportEmail: "",
  environmentLabel: "",
  submit: "",
};

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email,
  );
}

function getEnvironmentModeLabel() {
  const mode = import.meta.env.MODE;

  if (mode === "production") {
    return "Produção";
  }

  if (mode === "test") {
    return "Testes";
  }

  return "Desenvolvimento";
}

export function SettingsPage() {
  const {
    settings,
    isSavingSettings,
    saveSettings,
    restoreDefaultSettings,
  } = useSystemSettings();

  const [form, setForm] = useState(settings);
  const [errors, setErrors] =
    useState(initialErrors);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [
    restoreModalOpen,
    setRestoreModalOpen,
  ] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  function handleFormChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: "",
      submit: "",
    }));

    setSuccessMessage("");
  }

  function validateForm() {
    const validationErrors = {
      ...initialErrors,
    };

    if (!form.systemName.trim()) {
      validationErrors.systemName =
        "Informe o nome do sistema.";
    } else if (
      form.systemName.trim().length < 3
    ) {
      validationErrors.systemName =
        "O nome deve possuir pelo menos 3 caracteres.";
    }

    if (!form.organizationName.trim()) {
      validationErrors.organizationName =
        "Informe o nome da organização.";
    }

    if (!form.supportEmail.trim()) {
      validationErrors.supportEmail =
        "Informe o e-mail de suporte.";
    } else if (
      !validateEmail(
        form.supportEmail.trim(),
      )
    ) {
      validationErrors.supportEmail =
        "Informe um e-mail válido.";
    }

    if (!form.environmentLabel.trim()) {
      validationErrors.environmentLabel =
        "Informe a identificação do ambiente.";
    }

    setErrors(validationErrors);

    return Object.values(
      validationErrors,
    ).every((error) => !error);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const savedSettings =
        await saveSettings(form);

      setForm(savedSettings);

      setSuccessMessage(
        "As configurações foram salvas com sucesso.",
      );
    } catch (error) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        submit:
          error.message ||
          "Não foi possível salvar as configurações.",
      }));
    }
  }

  async function handleRestoreDefaults() {
    try {
      const restoredSettings =
        await restoreDefaultSettings();

      setForm(restoredSettings);
      setErrors(initialErrors);
      setRestoreModalOpen(false);

      setSuccessMessage(
        "As configurações padrão foram restauradas.",
      );
    } catch (error) {
      setRestoreModalOpen(false);

      setErrors((currentErrors) => ({
        ...currentErrors,
        submit:
          error.message ||
          "Não foi possível restaurar as configurações.",
      }));
    }
  }

  const hasChanges =
    JSON.stringify(form) !==
    JSON.stringify(settings);

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">
          <div className="flex items-start gap-3">
            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="text-sm font-bold">
                Configurações atualizadas
              </p>

              <p className="mt-1 text-sm text-emerald-700">
                {successMessage}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setSuccessMessage("")
            }
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition hover:bg-emerald-100"
            aria-label="Fechar mensagem"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {errors.submit && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={20}
              className="mt-0.5 shrink-0 text-red-700"
            />

            <div>
              <p className="text-sm font-bold text-red-700">
                Não foi possível salvar
              </p>

              <p className="mt-1 text-sm leading-6 text-red-600">
                {errors.submit}
              </p>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-3xl border border-[#e7e1e9] bg-white p-5 shadow-[0_8px_30px_rgba(56,32,65,0.04)] sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#754286]">
          Administração do ambiente
        </p>

        <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#2d2530]">
          Configurações do sistema
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#817688]">
          Gerencie a identificação do ambiente,
          preferências administrativas e consulte as
          políticas de segurança aplicadas pelo backend.
        </p>
      </section>

      <section className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
        <div className="flex items-start gap-3">
          <MonitorCog
            size={20}
            className="mt-0.5 shrink-0 text-blue-700"
          />

          <div>
            <p className="text-sm font-bold text-blue-800">
              Configurações locais
            </p>

            <p className="mt-1 text-sm leading-6 text-blue-700">
              As configurações editáveis ainda são
              armazenadas neste navegador. As políticas de
              segurança abaixo são somente informativas e
              seguem as regras atuais do backend.
            </p>
          </div>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6"
      >
        <section className="overflow-hidden rounded-2xl border border-[#e7e1e9] bg-white shadow-[0_8px_30px_rgba(56,32,65,0.04)]">
          <header className="border-b border-[#eee9f0] px-5 py-5 sm:px-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0e8f3] text-[#5d276d]">
                <SlidersHorizontal size={20} />
              </div>

              <div>
                <h3 className="font-bold text-[#332a36]">
                  Identificação do sistema
                </h3>

                <p className="mt-1 text-sm leading-6 text-[#887e8c]">
                  Informações utilizadas para identificar
                  o ambiente administrativo.
                </p>
              </div>
            </div>
          </header>

          <div className="grid gap-5 px-5 py-6 sm:grid-cols-2 sm:px-6">
            <FormField
              id="systemName"
              name="systemName"
              label="Nome do sistema"
              value={form.systemName}
              onChange={handleFormChange}
              placeholder="Reservado Administrativo"
              error={errors.systemName}
            />

            <FormField
              id="organizationName"
              name="organizationName"
              label="Organização"
              value={form.organizationName}
              onChange={handleFormChange}
              placeholder="Praiastur / Reservado"
              error={errors.organizationName}
            />

            <FormField
              id="supportEmail"
              name="supportEmail"
              type="email"
              label="E-mail de suporte"
              value={form.supportEmail}
              onChange={handleFormChange}
              placeholder="suporte@reservado.com.br"
              error={errors.supportEmail}
              icon={Mail}
            />

            <FormField
              id="environmentLabel"
              name="environmentLabel"
              label="Nome do ambiente"
              value={form.environmentLabel}
              onChange={handleFormChange}
              placeholder="Desenvolvimento"
              error={errors.environmentLabel}
              icon={Server}
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#e7e1e9] bg-white shadow-[0_8px_30px_rgba(56,32,65,0.04)]">
          <header className="border-b border-[#eee9f0] px-5 py-5 sm:px-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <MonitorCog size={20} />
              </div>

              <div>
                <h3 className="font-bold text-[#332a36]">
                  Preferências de interface e sessão
                </h3>

                <p className="mt-1 text-sm leading-6 text-[#887e8c]">
                  Comportamentos que poderão ser utilizados
                  pelas telas administrativas.
                </p>
              </div>
            </div>
          </header>

          <div className="space-y-4 px-5 py-6 sm:px-6">
            <ToggleField
              name="showEnvironmentBadge"
              checked={
                form.showEnvironmentBadge
              }
              onChange={handleFormChange}
              icon={
                form.showEnvironmentBadge
                  ? Eye
                  : EyeOff
              }
              title="Mostrar identificação do ambiente"
              description="Exibe o nome do ambiente, como Desenvolvimento ou Produção, na interface administrativa."
            />

            <ToggleField
              name="allowRememberSession"
              checked={
                form.allowRememberSession
              }
              onChange={handleFormChange}
              icon={Clock3}
              title="Permitir manter sessão conectada"
              description="Controla se o login poderá oferecer a opção de manter a sessão salva no navegador."
            />
          </div>
        </section>

        <section className="rounded-2xl border border-[#e7e1e9] bg-white p-5 shadow-[0_8px_30px_rgba(56,32,65,0.04)] sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-bold text-[#332a36]">
                Alterações pendentes
              </h3>

              <p className="mt-1 text-sm leading-6 text-[#887e8c]">
                {hasChanges
                  ? "Existem alterações que ainda não foram salvas."
                  : "Todas as configurações estão salvas."}
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  setRestoreModalOpen(true)
                }
                disabled={isSavingSettings}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#d8d0db] px-4 text-sm font-bold text-[#675d6b] transition hover:border-[#bfaec6] hover:bg-[#faf8fb] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCcw size={17} />
                Restaurar padrão
              </button>

              <button
                type="submit"
                disabled={
                  isSavingSettings ||
                  !hasChanges
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#432059] px-5 text-sm font-bold text-white transition hover:bg-[#341366] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSavingSettings ? (
                  "Salvando..."
                ) : (
                  <>
                    <Save size={18} />
                    Salvar configurações
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      </form>

      <section>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-[#302733]">
            Políticas de segurança
          </h3>

          <p className="mt-1 text-sm text-[#8b818f]">
            Regras atualmente aplicadas pelo serviço de
            autenticação.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {securityPolicies.map((policy) => {
            const Icon = policy.icon;

            return (
              <article
                key={policy.id}
                className="rounded-2xl border border-[#e7e1e9] bg-white p-5 shadow-[0_8px_30px_rgba(56,32,65,0.04)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f1eaf4] text-[#5d276d]">
                  <Icon size={21} />
                </div>

                <p className="mt-4 text-sm font-semibold text-[#7e7483]">
                  {policy.label}
                </p>

                <p className="mt-1 text-xl font-bold text-[#302733]">
                  {policy.value}
                </p>

                <p className="mt-2 text-xs leading-5 text-[#918795]">
                  {policy.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e7e1e9] bg-white shadow-[0_8px_30px_rgba(56,32,65,0.04)]">
        <header className="border-b border-[#eee9f0] px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Database size={20} />
            </div>

            <div>
              <h3 className="font-bold text-[#332a36]">
                Ambiente e integração
              </h3>

              <p className="mt-1 text-sm leading-6 text-[#887e8c]">
                Informações técnicas utilizadas pelo
                frontend durante a execução.
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-px bg-[#eee9f0] sm:grid-cols-2">
          <EnvironmentInformation
            icon={Server}
            label="Modo do Vite"
            value={getEnvironmentModeLabel()}
          />

          <EnvironmentInformation
            icon={Database}
            label="Origem dos dados"
            value={
              appConfig.useMockApi
                ? "Dados simulados"
                : "API real"
            }
            status={
              appConfig.useMockApi
                ? "ATENCAO"
                : "SUCESSO"
            }
          />

          <EnvironmentInformation
            icon={Braces}
            label="Endereço da API"
            value={appConfig.apiUrl}
            monospace
          />

          <EnvironmentInformation
            icon={ShieldCheck}
            label="Autenticação"
            value="JWT Bearer"
            status="SUCESSO"
          />
        </div>
      </section>

      <Modal
        open={restoreModalOpen}
        onClose={() =>
          setRestoreModalOpen(false)
        }
        title="Restaurar configurações"
        description="Confirme a restauração das configurações administrativas."
        maxWidth="max-w-lg"
      >
        <div className="px-5 py-6 sm:px-6">
          <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle
              size={22}
              className="mt-0.5 shrink-0 text-amber-700"
            />

            <div>
              <p className="font-bold text-amber-800">
                Restaurar valores padrão?
              </p>

              <p className="mt-2 text-sm leading-6 text-amber-700">
                O nome do sistema, organização, e-mail,
                ambiente e preferências retornarão aos
                valores iniciais.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#eee9f0] bg-[#fcfafc] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={() =>
              setRestoreModalOpen(false)
            }
            disabled={isSavingSettings}
            className="h-11 rounded-xl border border-[#dad3dd] px-5 text-sm font-bold text-[#675d6b] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleRestoreDefaults}
            disabled={isSavingSettings}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 text-sm font-bold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCcw size={18} />

            {isSavingSettings
              ? "Restaurando..."
              : "Restaurar padrão"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function FormField({
  id,
  label,
  error,
  icon: Icon,
  ...inputProps
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-bold text-[#3b323e]"
      >
        {label}
      </label>

      <div
        className={[
          "flex h-12 items-center rounded-xl border bg-white transition",
          "focus-within:border-[#432059] focus-within:ring-4 focus-within:ring-[#432059]/10",
          error
            ? "border-red-400"
            : "border-[#ded8e2]",
        ].join(" ")}
      >
        {Icon && (
          <div className="flex h-full items-center pl-4 text-[#8b818f]">
            <Icon size={18} />
          </div>
        )}

        <input
          id={id}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-[#2f2732] outline-none placeholder:text-[#aaa1ae]"
          aria-invalid={Boolean(error)}
          {...inputProps}
        />
      </div>

      {error && (
        <p className="mt-1.5 text-xs font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function ToggleField({
  name,
  checked,
  onChange,
  icon: Icon,
  title,
  description,
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-5 rounded-2xl border border-[#e6dfe8] bg-[#fcfafc] p-4 transition hover:border-[#cdbfd3]">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#633274] shadow-sm">
          <Icon size={19} />
        </div>

        <div>
          <p className="text-sm font-bold text-[#3d3341]">
            {title}
          </p>

          <p className="mt-1 text-xs leading-5 text-[#8b818f]">
            {description}
          </p>
        </div>
      </div>

      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />

      <span className="relative mt-1 h-6 w-11 shrink-0 rounded-full bg-[#d8d1da] transition peer-checked:bg-[#432059] peer-focus-visible:ring-4 peer-focus-visible:ring-[#432059]/15">
        <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function EnvironmentInformation({
  icon: Icon,
  label,
  value,
  status,
  monospace = false,
}) {
  return (
    <div className="bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3eef5] text-[#633274]">
          <Icon size={19} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8c8290]">
              {label}
            </p>

            {status && (
              <span
                className={[
                  "rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em]",
                  status === "SUCESSO"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700",
                ].join(" ")}
              >
                {status === "SUCESSO"
                  ? "Conectado"
                  : "Simulado"}
              </span>
            )}
          </div>

          <p
            className={[
              "mt-2 break-all text-sm font-bold text-[#3d3440]",
              monospace ? "font-mono" : "",
            ].join(" ")}
          >
            {value || "Não informado"}
          </p>
        </div>
      </div>
    </div>
  );
}