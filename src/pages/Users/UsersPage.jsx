import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Eye,
  Filter,
  LockKeyhole,
  Mail,
  Search,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { ProfileSelector } from "../../components/access/ProfileSelector";
import { Modal } from "../../components/ui/Modal";
import { useAccessManagement } from "../../contexts/AccessManagementContext";

const USERS_PER_PAGE = 5;

const initialForm = {
  nome: "",
  email: "",
  senha: "",
  confirmarSenha: "",
  perfisIds: [],
};

function getUserStatus(user) {
  if (user.bloqueado) {
    return {
      value: "BLOQUEADO",
      label: "Bloqueado",
      className: "border-red-200 bg-red-50 text-red-700",
      dotClassName: "bg-red-500",
    };
  }

  if (!user.ativo) {
    return {
      value: "INATIVO",
      label: "Inativo",
      className: "border-slate-200 bg-slate-50 text-slate-600",
      dotClassName: "bg-slate-400",
    };
  }

  return {
    value: "ATIVO",
    label: "Ativo",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dotClassName: "bg-emerald-500",
  };
}

function formatDate(dateValue, emptyText = "Nunca acessou") {
  if (!dateValue) {
    return emptyText;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
}

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function StatusBadge({ user }) {
  const status = getUserStatus(user);

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1",
        "text-xs font-bold",
        status.className,
      ].join(" ")}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${status.dotClassName}`}
      />

      {status.label}
    </span>
  );
}

function FormField({
  id,
  label,
  error,
  icon: Icon,
  className = "",
  ...inputProps
}) {
  return (
    <div className={className}>
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
          error ? "border-red-400" : "border-[#ded8e2]",
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

export function UsersPage() {
  const {
    users,
    profiles,
    createUser,
    updateUserProfiles,
  } = useAccessManagement();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [currentPage, setCurrentPage] = useState(1);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1);

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [profileUserId, setProfileUserId] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});

  const [managedProfileIds, setManagedProfileIds] = useState([]);
  const [managedProfilesError, setManagedProfilesError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const selectedUser =
    users.find((user) => user.id === selectedUserId) ?? null;

  const profileUser =
    users.find((user) => user.id === profileUserId) ?? null;

  const activeProfiles = profiles.filter((profile) => profile.ativo);

  const manageableProfiles = profileUser
    ? profiles.filter(
        (profile) =>
          profile.ativo ||
          profileUser.perfisIds.includes(profile.id),
      )
    : activeProfiles;

  const statistics = useMemo(() => {
    return {
      total: users.length,
      ativos: users.filter(
        (user) => user.ativo && !user.bloqueado,
      ).length,
      bloqueados: users.filter((user) => user.bloqueado).length,
      inativos: users.filter((user) => !user.ativo).length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((user) => {
      const status = getUserStatus(user).value;

      const matchesSearch =
        !normalizedSearch ||
        user.nome.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "TODOS" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, users]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / USERS_PER_PAGE),
  );

  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE,
  );

  function getProfilesFromUser(user) {
    return user.perfisIds
      .map((profileId) =>
        profiles.find((profile) => profile.id === profileId),
      )
      .filter(Boolean);
  }

  function handleSearchChange(event) {
    setSearch(event.target.value);
    setCurrentPage(1);
  }

  function handleStatusChange(event) {
    setStatusFilter(event.target.value);
    setCurrentPage(1);
  }

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setFormErrors((currentErrors) => ({
      ...currentErrors,
      [name]: "",
    }));
  }

  function handleCreateProfileToggle(profileId) {
    setForm((currentForm) => {
      const selected =
        currentForm.perfisIds.includes(profileId);

      return {
        ...currentForm,
        perfisIds: selected
          ? currentForm.perfisIds.filter(
              (currentId) => currentId !== profileId,
            )
          : [...currentForm.perfisIds, profileId],
      };
    });

    setFormErrors((currentErrors) => ({
      ...currentErrors,
      perfisIds: "",
    }));
  }

  function validateUserData() {
    const errors = {};
    const normalizedName = form.nome.trim();
    const normalizedEmail = form.email.trim().toLowerCase();

    if (!normalizedName) {
      errors.nome = "Informe o nome do usuário.";
    } else if (normalizedName.length < 3) {
      errors.nome =
        "O nome deve possuir pelo menos 3 caracteres.";
    }

    if (!normalizedEmail) {
      errors.email = "Informe o e-mail.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      errors.email = "Informe um e-mail válido.";
    } else if (
      users.some(
        (user) =>
          user.email.toLowerCase() === normalizedEmail,
      )
    ) {
      errors.email =
        "Já existe um usuário com este e-mail.";
    }

    if (!form.senha) {
      errors.senha = "Informe uma senha.";
    } else if (form.senha.length < 8) {
      errors.senha =
        "A senha deve possuir pelo menos 8 caracteres.";
    }

    if (!form.confirmarSenha) {
      errors.confirmarSenha = "Confirme a senha.";
    } else if (form.confirmarSenha !== form.senha) {
      errors.confirmarSenha = "As senhas não são iguais.";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  }

  function validateProfiles() {
    if (form.perfisIds.length === 0) {
      setFormErrors((currentErrors) => ({
        ...currentErrors,
        perfisIds:
          "Selecione pelo menos um perfil de acesso.",
      }));

      return false;
    }

    return true;
  }

  function handleCreateFlowSubmit(event) {
    event.preventDefault();

    if (createStep === 1) {
      if (validateUserData()) {
        setCreateStep(2);
      }

      return;
    }

    if (!validateProfiles()) {
      return;
    }

    const newUser = createUser({
      nome: form.nome,
      email: form.email,
      perfisIds: form.perfisIds,
    });

    setSuccessMessage(
      `O acesso de ${newUser.nome} foi criado e os perfis foram definidos.`,
    );

    setSearch("");
    setStatusFilter("TODOS");
    setCurrentPage(1);

    closeCreateModal();
  }

  function closeCreateModal() {
    setCreateModalOpen(false);
    setCreateStep(1);
    setForm(initialForm);
    setFormErrors({});
  }

  function openManageProfiles(user) {
    setSelectedUserId(null);
    setProfileUserId(user.id);
    setManagedProfileIds(user.perfisIds);
    setManagedProfilesError("");
  }

  function handleManagedProfileToggle(profileId) {
    setManagedProfileIds((currentIds) =>
      currentIds.includes(profileId)
        ? currentIds.filter(
            (currentId) => currentId !== profileId,
          )
        : [...currentIds, profileId],
    );

    setManagedProfilesError("");
  }

  function handleSaveManagedProfiles() {
    if (!profileUser) {
      return;
    }

    if (managedProfileIds.length === 0) {
      setManagedProfilesError(
        "Selecione pelo menos um perfil de acesso.",
      );

      return;
    }

    updateUserProfiles(profileUser.id, managedProfileIds);

    setSuccessMessage(
      `Os perfis de ${profileUser.nome} foram atualizados com sucesso.`,
    );

    setProfileUserId(null);
    setManagedProfileIds([]);
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("TODOS");
    setCurrentPage(1);
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-800 sm:px-5">
          <div className="flex items-start gap-3">
            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="text-sm font-bold">
                Alteração concluída
              </p>

              <p className="mt-1 text-sm text-emerald-700">
                {successMessage}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition hover:bg-emerald-100"
            aria-label="Fechar mensagem"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <section className="flex flex-col justify-between gap-5 rounded-3xl border border-[#e7e1e9] bg-white p-5 shadow-[0_8px_30px_rgba(56,32,65,0.04)] sm:p-6 lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#754286]">
            Controle de acessos
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#2d2530]">
            Gerenciamento de usuários
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#817688]">
            Cadastre colaboradores, defina seus perfis e acompanhe
            a situação de cada acesso.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#432059] px-5 text-sm font-bold text-white shadow-[0_10px_25px_rgba(67,32,89,0.2)] transition hover:-translate-y-0.5 hover:bg-[#341366]"
        >
          <UserPlus size={19} />
          Novo usuário
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatisticCard
          label="Total de usuários"
          value={statistics.total}
          icon={Users}
          iconClassName="bg-[#f0e8f3] text-[#432059]"
        />

        <StatisticCard
          label="Usuários ativos"
          value={statistics.ativos}
          icon={CheckCircle2}
          iconClassName="bg-emerald-50 text-emerald-700"
        />

        <StatisticCard
          label="Usuários bloqueados"
          value={statistics.bloqueados}
          icon={LockKeyhole}
          iconClassName="bg-red-50 text-red-700"
        />

        <StatisticCard
          label="Usuários inativos"
          value={statistics.inativos}
          icon={CircleUserRound}
          iconClassName="bg-slate-100 text-slate-600"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e7e1e9] bg-white shadow-[0_8px_30px_rgba(56,32,65,0.04)]">
        <div className="border-b border-[#eee9f0] p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={19}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#958b99]"
              />

              <input
                type="search"
                value={search}
                onChange={handleSearchChange}
                placeholder="Pesquisar por nome ou e-mail..."
                className="h-12 w-full rounded-xl border border-[#ded8e2] bg-white pl-11 pr-4 text-sm text-[#312934] outline-none transition placeholder:text-[#a59ca9] focus:border-[#432059] focus:ring-4 focus:ring-[#432059]/10"
              />
            </div>

            <div className="relative lg:w-56">
              <Filter
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#958b99]"
              />

              <select
                value={statusFilter}
                onChange={handleStatusChange}
                className="h-12 w-full appearance-none rounded-xl border border-[#ded8e2] bg-white pl-11 pr-10 text-sm font-semibold text-[#4d4351] outline-none transition focus:border-[#432059] focus:ring-4 focus:ring-[#432059]/10"
              >
                <option value="TODOS">Todos os status</option>
                <option value="ATIVO">Ativos</option>
                <option value="BLOQUEADO">Bloqueados</option>
                <option value="INATIVO">Inativos</option>
              </select>
            </div>
          </div>
        </div>

        {currentUsers.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[950px] border-collapse">
                <thead>
                  <tr className="border-b border-[#eee9f0] bg-[#faf8fb] text-left">
                    <TableHeading>Usuário</TableHeading>
                    <TableHeading>Perfis</TableHeading>
                    <TableHeading>Status</TableHeading>
                    <TableHeading>Último acesso</TableHeading>
                    <TableHeading>Cadastro</TableHeading>
                    <TableHeading align="right">
                      Ações
                    </TableHeading>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#f0ecf2]">
                  {currentUsers.map((user) => {
                    const userProfiles =
                      getProfilesFromUser(user);

                    return (
                      <tr
                        key={user.id}
                        className="transition hover:bg-[#fcfafc]"
                      >
                        <td className="px-5 py-4">
                          <UserIdentity user={user} />
                        </td>

                        <td className="px-5 py-4">
                          <ProfileBadges
                            profiles={userProfiles}
                          />
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge user={user} />
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-[#756b79]">
                          {formatDate(user.ultimoLoginEm)}
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-[#756b79]">
                          {formatDate(
                            user.criadoEm,
                            "Não informado",
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedUserId(user.id)
                            }
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#ded7e1] px-3.5 text-xs font-bold text-[#5d276d] transition hover:border-[#432059] hover:bg-[#f8f3f9]"
                          >
                            <Eye size={16} />
                            Detalhes
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-[#eee9f0] lg:hidden">
              {currentUsers.map((user) => {
                const userProfiles = getProfilesFromUser(user);

                return (
                  <article
                    key={user.id}
                    className="p-4 sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <UserIdentity user={user} />
                      <StatusBadge user={user} />
                    </div>

                    <div className="mt-4">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#988e9c]">
                        Perfis de acesso
                      </p>

                      <ProfileBadges
                        profiles={userProfiles}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <MobileInformation
                        label="Último acesso"
                        value={formatDate(
                          user.ultimoLoginEm,
                        )}
                      />

                      <MobileInformation
                        label="Cadastro"
                        value={formatDate(
                          user.criadoEm,
                          "Não informado",
                        )}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedUserId(user.id)
                      }
                      className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#ded7e1] text-xs font-bold text-[#5d276d] transition hover:border-[#432059] hover:bg-[#f8f3f9]"
                    >
                      <Eye size={16} />
                      Visualizar detalhes
                    </button>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f2edf4] text-[#623173]">
              <Search size={24} />
            </div>

            <h3 className="mt-5 text-lg font-bold text-[#342b37]">
              Nenhum usuário encontrado
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#897f8d]">
              Não encontramos usuários correspondentes aos
              filtros selecionados.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 text-sm font-bold text-[#5d276d] hover:underline"
            >
              Limpar pesquisa e filtros
            </button>
          </div>
        )}

        <footer className="flex flex-col justify-between gap-4 border-t border-[#eee9f0] px-4 py-4 sm:flex-row sm:items-center sm:px-5">
          <p className="text-xs font-medium text-[#8d8391]">
            Exibindo{" "}
            <strong className="text-[#514756]">
              {currentUsers.length}
            </strong>{" "}
            de{" "}
            <strong className="text-[#514756]">
              {filteredUsers.length}
            </strong>{" "}
            usuários
          </p>

          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) =>
                  Math.max(1, page - 1),
                )
              }
              disabled={currentPage === 1}
              className="flex h-10 items-center gap-2 rounded-xl border border-[#ded7e1] px-3 text-xs font-bold text-[#665c6a] transition hover:border-[#bdaec4] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={17} />
              Anterior
            </button>

            <span className="text-xs font-bold text-[#655b69]">
              Página {currentPage} de {totalPages}
            </span>

            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(totalPages, page + 1),
                )
              }
              disabled={currentPage === totalPages}
              className="flex h-10 items-center gap-2 rounded-xl border border-[#ded7e1] px-3 text-xs font-bold text-[#665c6a] transition hover:border-[#bdaec4] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próxima
              <ChevronRight size={17} />
            </button>
          </div>
        </footer>
      </section>

      <Modal
        open={createModalOpen}
        onClose={closeCreateModal}
        title={
          createStep === 1
            ? "Cadastrar novo usuário"
            : "Definir perfis de acesso"
        }
        description={
          createStep === 1
            ? "Informe os dados iniciais do colaborador."
            : "Selecione os perfis que serão vinculados ao usuário."
        }
        maxWidth={createStep === 1 ? "max-w-2xl" : "max-w-3xl"}
      >
        <form onSubmit={handleCreateFlowSubmit} noValidate>
          <div className="border-b border-[#eee9f0] px-5 py-4 sm:px-6">
            <div className="grid grid-cols-2 gap-3">
              <StepIndicator
                number={1}
                label="Dados do usuário"
                active={createStep === 1}
                completed={createStep > 1}
              />

              <StepIndicator
                number={2}
                label="Perfil de acesso"
                active={createStep === 2}
                completed={false}
              />
            </div>
          </div>

          {createStep === 1 ? (
            <div className="grid gap-5 px-5 py-6 sm:grid-cols-2 sm:px-6">
              <FormField
                id="nome"
                name="nome"
                label="Nome completo"
                value={form.nome}
                onChange={handleFormChange}
                placeholder="Digite o nome completo"
                autoComplete="name"
                icon={CircleUserRound}
                error={formErrors.nome}
                className="sm:col-span-2"
              />

              <FormField
                id="email"
                name="email"
                label="E-mail"
                type="email"
                value={form.email}
                onChange={handleFormChange}
                placeholder="nome@reservado.com.br"
                autoComplete="email"
                icon={Mail}
                error={formErrors.email}
                className="sm:col-span-2"
              />

              <FormField
                id="senha"
                name="senha"
                label="Senha inicial"
                type="password"
                value={form.senha}
                onChange={handleFormChange}
                placeholder="Mínimo de 8 caracteres"
                autoComplete="new-password"
                icon={LockKeyhole}
                error={formErrors.senha}
              />

              <FormField
                id="confirmarSenha"
                name="confirmarSenha"
                label="Confirmar senha"
                type="password"
                value={form.confirmarSenha}
                onChange={handleFormChange}
                placeholder="Repita a senha"
                autoComplete="new-password"
                icon={LockKeyhole}
                error={formErrors.confirmarSenha}
              />
            </div>
          ) : (
            <div className="space-y-5 px-5 py-6 sm:px-6">
              <div className="rounded-2xl border border-[#e7e0e9] bg-[#faf8fb] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#875492]">
                  Usuário que será criado
                </p>

                <p className="mt-2 font-bold text-[#3b313e]">
                  {form.nome}
                </p>

                <p className="mt-1 text-sm text-[#8a808e]">
                  {form.email}
                </p>
              </div>

              <div>
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-[#3b323e]">
                    Perfis disponíveis
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-[#918795]">
                    Um usuário pode possuir mais de um perfil.
                  </p>
                </div>

                <ProfileSelector
                  profiles={activeProfiles}
                  selectedIds={form.perfisIds}
                  onToggle={handleCreateProfileToggle}
                  error={formErrors.perfisIds}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-[#eee9f0] bg-[#fcfafc] px-5 py-4 sm:flex-row sm:justify-between sm:px-6">
            <button
              type="button"
              onClick={
                createStep === 1
                  ? closeCreateModal
                  : () => setCreateStep(1)
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dad3dd] px-5 text-sm font-bold text-[#675d6b] transition hover:border-[#bfaec6] hover:bg-white"
            >
              {createStep === 2 && <ArrowLeft size={18} />}
              {createStep === 1 ? "Cancelar" : "Voltar"}
            </button>

            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#432059] px-5 text-sm font-bold text-white transition hover:bg-[#341366]"
            >
              {createStep === 1 ? (
                <>
                  Continuar
                  <ArrowRight size={18} />
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Criar usuário
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(selectedUser)}
        onClose={() => setSelectedUserId(null)}
        title="Detalhes do usuário"
        description="Informações cadastradas e situação atual do acesso."
        maxWidth="max-w-xl"
      >
        {selectedUser && (
          <>
            <div className="px-5 py-6 sm:px-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#432059] text-base font-bold text-white">
                  {getInitials(selectedUser.nome)}
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold text-[#312934]">
                    {selectedUser.nome}
                  </h3>

                  <p className="mt-1 truncate text-sm text-[#847a88]">
                    {selectedUser.email}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <DetailCard
                  icon={ShieldCheck}
                  label="Perfis de acesso"
                  value={
                    getProfilesFromUser(selectedUser)
                      .map((profile) => profile.nome)
                      .join(", ") || "Sem perfil"
                  }
                />

                <DetailCard
                  icon={CheckCircle2}
                  label="Situação"
                  value={getUserStatus(selectedUser).label}
                />

                <DetailCard
                  icon={Clock3}
                  label="Último acesso"
                  value={formatDate(
                    selectedUser.ultimoLoginEm,
                  )}
                />

                <DetailCard
                  icon={CalendarDays}
                  label="Cadastrado em"
                  value={formatDate(
                    selectedUser.criadoEm,
                    "Não informado",
                  )}
                />
              </div>

              <button
                type="button"
                onClick={() =>
                  openManageProfiles(selectedUser)
                }
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#cdbfd3] bg-[#f8f3f9] text-sm font-bold text-[#5d276d] transition hover:border-[#432059] hover:bg-[#f2eaf4]"
              >
                <UserCog size={19} />
                Gerenciar perfis de acesso
              </button>
            </div>

            <div className="flex justify-end border-t border-[#eee9f0] bg-[#fcfafc] px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => setSelectedUserId(null)}
                className="h-11 rounded-xl bg-[#432059] px-5 text-sm font-bold text-white transition hover:bg-[#341366]"
              >
                Fechar
              </button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={Boolean(profileUser)}
        onClose={() => setProfileUserId(null)}
        title="Gerenciar perfis"
        description="Defina os perfis que este usuário deverá possuir."
        maxWidth="max-w-3xl"
      >
        {profileUser && (
          <>
            <div className="space-y-5 px-5 py-6 sm:px-6">
              <div className="flex items-center gap-4 rounded-2xl border border-[#e7e0e9] bg-[#faf8fb] p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#432059] text-sm font-bold text-white">
                  {getInitials(profileUser.nome)}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-bold text-[#3b313e]">
                    {profileUser.nome}
                  </p>

                  <p className="mt-1 truncate text-sm text-[#8a808e]">
                    {profileUser.email}
                  </p>
                </div>
              </div>

              <ProfileSelector
                profiles={manageableProfiles}
                selectedIds={managedProfileIds}
                onToggle={handleManagedProfileToggle}
                error={managedProfilesError}
              />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[#eee9f0] bg-[#fcfafc] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={() => setProfileUserId(null)}
                className="h-11 rounded-xl border border-[#dad3dd] px-5 text-sm font-bold text-[#675d6b] transition hover:border-[#bfaec6] hover:bg-white"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveManagedProfiles}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#432059] px-5 text-sm font-bold text-white transition hover:bg-[#341366]"
              >
                <CheckCircle2 size={18} />
                Salvar perfis
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

function StepIndicator({
  number,
  label,
  active,
  completed,
}) {
  return (
    <div
      className={[
        "flex items-center gap-3 rounded-xl border px-3 py-3",
        active
          ? "border-[#432059] bg-[#f8f3f9]"
          : completed
            ? "border-emerald-200 bg-emerald-50"
            : "border-[#e4dde7] bg-white",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
          active
            ? "bg-[#432059] text-white"
            : completed
              ? "bg-emerald-600 text-white"
              : "bg-[#eee8f0] text-[#817688]",
        ].join(" ")}
      >
        {completed ? <CheckCircle2 size={16} /> : number}
      </div>

      <p
        className={[
          "text-xs font-bold",
          active
            ? "text-[#432059]"
            : completed
              ? "text-emerald-700"
              : "text-[#817688]",
        ].join(" ")}
      >
        {label}
      </p>
    </div>
  );
}

function ProfileBadges({ profiles }) {
  if (profiles.length === 0) {
    return (
      <span className="inline-flex rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-700">
        Sem perfil
      </span>
    );
  }

  const visibleProfiles = profiles.slice(0, 2);
  const remainingCount = profiles.length - visibleProfiles.length;

  return (
    <div className="flex flex-wrap gap-2">
      {visibleProfiles.map((profile) => (
        <span
          key={profile.id}
          className="inline-flex rounded-lg bg-[#f3eef5] px-2.5 py-1.5 text-xs font-bold text-[#633274]"
        >
          {profile.nome}
        </span>
      ))}

      {remainingCount > 0 && (
        <span className="inline-flex rounded-lg bg-[#ece8ee] px-2.5 py-1.5 text-xs font-bold text-[#6e6472]">
          +{remainingCount}
        </span>
      )}
    </div>
  );
}

function StatisticCard({
  label,
  value,
  icon: Icon,
  iconClassName,
}) {
  return (
    <article className="rounded-2xl border border-[#e7e1e9] bg-white p-5 shadow-[0_8px_30px_rgba(56,32,65,0.04)]">
      <div className="flex items-center justify-between gap-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon size={21} />
        </div>

        <p className="text-3xl font-bold tracking-[-0.04em] text-[#302733]">
          {value}
        </p>
      </div>

      <p className="mt-4 text-sm font-semibold text-[#817688]">
        {label}
      </p>
    </article>
  );
}

function TableHeading({ children, align = "left" }) {
  return (
    <th
      className={[
        "px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.13em]",
        "text-[#8d8391]",
        align === "right" ? "text-right" : "text-left",
      ].join(" ")}
    >
      {children}
    </th>
  );
}

function UserIdentity({ user }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ede4f1] text-xs font-bold text-[#5d276d]">
        {getInitials(user.nome)}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-[#342b37]">
          {user.nome}
        </p>

        <p className="mt-1 truncate text-xs text-[#928895]">
          {user.email}
        </p>
      </div>
    </div>
  );
}

function MobileInformation({ label, value }) {
  return (
    <div className="rounded-xl bg-[#faf8fb] p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#988e9c]">
        {label}
      </p>

      <p className="mt-1.5 text-xs font-semibold leading-5 text-[#554b59]">
        {value}
      </p>
    </div>
  );
}

function DetailCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-[#ebe5ed] bg-[#fcfafc] p-4">
      <div className="flex items-center gap-2 text-[#6b397a]">
        <Icon size={17} />

        <p className="text-[10px] font-bold uppercase tracking-[0.12em]">
          {label}
        </p>
      </div>

      <p className="mt-2 text-sm font-bold text-[#3d3440]">
        {value}
      </p>
    </div>
  );
}