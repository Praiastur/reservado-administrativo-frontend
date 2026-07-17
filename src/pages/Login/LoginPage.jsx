import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { TextField } from "../../components/ui/TextField";
import { useAuth } from "../../contexts/AuthContext";

const initialForm = {
  email: "",
  senha: "",
  lembrar: false,
};

export function LoginPage() {
  const navigate = useNavigate();

  const { login } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: type === "checkbox" ? checked : value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: "",
    }));

    setMessage("");
  }

  function validateForm() {
    const newErrors = {};
    const normalizedEmail = form.email.trim();

    if (!normalizedEmail) {
      newErrors.email = "Informe seu e-mail.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      newErrors.email = "Digite um e-mail válido.";
    }

    if (!form.senha) {
      newErrors.senha = "Informe sua senha.";
    } else if (form.senha.length < 8) {
      newErrors.senha = "A senha deve possuir pelo menos 8 caracteres.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(event) {
  event.preventDefault();
  setMessage("");

  if (!validateForm()) {
    return;
  }

  setLoading(true);

  try {
    await login({
      email: form.email.trim(),
      senha: form.senha,
      remember: form.lembrar,
    });

    navigate("/dashboard", {
      replace: true,
    });
  } catch (error) {
    setMessage(
      error.message ||
        "Não foi possível entrar no sistema.",
    );
  } finally {
    setLoading(false);
  }
}

  function handleForgotPassword() {
    setMessage(
      "A recuperação de senha será disponibilizada quando o endpoint estiver pronto.",
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f5f8]">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden bg-[#351244] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
          <div className="absolute -left-24 top-20 h-80 w-80 rounded-full bg-[#76408f]/30 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-96 w-96 rounded-full bg-[#9f64b8]/20 blur-3xl" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur">
              <ShieldCheck size={24} />
            </div>

            <div>
              <p className="text-lg font-bold leading-none">Reservado</p>
              <p className="mt-1 text-xs font-medium text-white/60">
                Administrativo
              </p>
            </div>
          </div>

          <div className="relative z-10 max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white/80 backdrop-blur">
              <Sparkles size={15} />
              Ambiente corporativo integrado
            </div>

            <h1 className="max-w-lg text-4xl font-bold leading-[1.12] tracking-[-0.035em] xl:text-5xl">
              Gestão centralizada para decisões mais rápidas.
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-white/68">
              Gerencie usuários, perfis, permissões e operações internas em um
              único ambiente seguro e organizado.
            </p>

            <div className="mt-10 grid max-w-lg grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/12 bg-white/[0.07] p-5 backdrop-blur">
                <UsersRound className="mb-4 text-white/85" size={24} />

                <p className="font-semibold">Controle de acessos</p>

                <p className="mt-2 text-sm leading-6 text-white/55">
                  Perfis e permissões definidos para cada função.
                </p>
              </div>

              <div className="rounded-2xl border border-white/12 bg-white/[0.07] p-5 backdrop-blur">
                <CheckCircle2 className="mb-4 text-white/85" size={24} />

                <p className="font-semibold">Operação organizada</p>

                <p className="mt-2 text-sm leading-6 text-white/55">
                  Informações centralizadas e processos mais claros.
                </p>
              </div>
            </div>
          </div>

          <p className="relative z-10 text-xs text-white/40">
            © 2026 Reservado. Ambiente de uso interno.
          </p>
        </section>

        <section className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="absolute left-5 top-5 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#432059] text-white">
              <ShieldCheck size={22} />
            </div>

            <div>
              <p className="font-bold leading-none text-[#2c2330]">Reservado</p>
              <p className="mt-1 text-xs text-[#817788]">Administrativo</p>
            </div>
          </div>

          <div className="w-full max-w-[430px]">
            <div className="mb-9">
              <div className="mb-5 hidden h-12 w-12 items-center justify-center rounded-2xl bg-[#432059] text-white shadow-[0_12px_28px_rgba(67,32,89,0.22)] lg:flex">
                <LockKeyhole size={23} />
              </div>

              <p className="text-sm font-bold uppercase tracking-[0.17em] text-[#6f3a82]">
                Acesso seguro
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-[#251e28] sm:text-[34px]">
                Bem-vindo de volta
              </h2>

              <p className="mt-3 leading-7 text-[#776f7c]">
                Informe suas credenciais para acessar o painel administrativo.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <TextField
                id="email"
                name="email"
                label="E-mail"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="nome@reservado.com.br"
                autoComplete="email"
                icon={Mail}
                error={errors.email}
              />

              <TextField
                id="senha"
                name="senha"
                label="Senha"
                type={mostrarSenha ? "text" : "password"}
                value={form.senha}
                onChange={handleChange}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                icon={LockKeyhole}
                error={errors.senha}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setMostrarSenha((current) => !current)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-[#817788] transition hover:bg-[#f1edf3] hover:text-[#432059] focus:outline-none focus:ring-2 focus:ring-[#432059]/20"
                    aria-label={
                      mostrarSenha ? "Ocultar senha" : "Visualizar senha"
                    }
                  >
                    {mostrarSenha ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                }
              />

              <div className="flex items-center justify-between gap-4">
                <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#5d5562]">
                  <input
                    type="checkbox"
                    name="lembrar"
                    checked={form.lembrar}
                    onChange={handleChange}
                    className="h-4 w-4 cursor-pointer accent-[#432059]"
                  />
                  Manter conectado
                </label>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm font-bold text-[#5d276d] transition hover:text-[#341366] hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>

              {message && (
                <div
                  role="status"
                  className="rounded-xl border border-[#ded4e2] bg-[#f6f1f8] px-4 py-3 text-sm leading-6 text-[#5d276d]"
                >
                  {message}
                </div>
              )}

              <PrimaryButton type="submit" loading={loading}>
                {loading ? "Entrando..." : "Entrar no sistema"}

                {!loading && <ArrowRight size={18} />}
              </PrimaryButton>
            </form>

            <div className="mt-8 flex items-start gap-3 rounded-xl border border-[#e7e1e9] bg-white/60 p-4">
              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0 text-[#6f3a82]"
              />

              <p className="text-xs leading-5 text-[#817788]">
                Este é um ambiente restrito. Todas as ações realizadas poderão
                ser registradas para fins de segurança e auditoria.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}