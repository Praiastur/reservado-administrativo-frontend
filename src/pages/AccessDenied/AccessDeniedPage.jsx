import {
  ArrowLeft,
  Mail,
  ShieldX,
} from "lucide-react";
import { Link } from "react-router";

import { useSystemSettings } from "../../contexts/SystemSettingsContext";

export function AccessDeniedPage() {
  const { settings } = useSystemSettings();

  const supportEmail =
    settings.supportEmail?.trim() || "suporte@reservado.com.br";

  return (
    <section className="flex min-h-[calc(100vh-150px)] items-center justify-center">
      <div className="w-full max-w-2xl rounded-3xl border border-[#eadfe8] bg-white p-7 text-center shadow-[0_20px_60px_rgba(52,19,102,0.07)] sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <ShieldX size={30} />
        </div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-red-600">
          Acesso restrito
        </p>

        <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-[#2e2631]">
          Você não possui permissão
        </h2>

        <p className="mx-auto mt-4 max-w-lg leading-7 text-[#7d7381]">
          Seu perfil de acesso não permite visualizar esta área.
          Procure um administrador caso precise utilizar esta
          funcionalidade.
        </p>

        <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-[#e7e1e9] bg-[#faf8fb] p-4">
          <div className="flex flex-col items-center gap-2 text-sm text-[#756b79] sm:flex-row sm:justify-center">
            <Mail size={17} className="shrink-0 text-[#633274]" />

            <span>Precisa de ajuda?</span>

            <a
              href={`mailto:${supportEmail}`}
              className="break-all font-bold text-[#5d276d] transition hover:text-[#341366] hover:underline"
            >
              {supportEmail}
            </a>
          </div>
        </div>

        <Link
          to="/dashboard"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#432059] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#341366]"
        >
          <ArrowLeft size={18} />
          Voltar ao dashboard
        </Link>
      </div>
    </section>
  );
}