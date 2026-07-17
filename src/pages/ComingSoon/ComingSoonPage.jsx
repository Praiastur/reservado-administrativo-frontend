import { ArrowLeft, Construction } from "lucide-react";
import { Link } from "react-router";

export function ComingSoonPage({ title, description, icon: Icon }) {
  return (
    <section className="flex min-h-[calc(100vh-150px)] items-center justify-center">
      <div className="w-full max-w-2xl rounded-3xl border border-[#e5dfe8] bg-white p-7 text-center shadow-[0_20px_60px_rgba(52,19,102,0.07)] sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f0e8f3] text-[#432059]">
          {Icon ? <Icon size={29} /> : <Construction size={29} />}
        </div>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#754286]">
          Próxima etapa
        </p>

        <h2 className="mt-3 text-3xl font-bold tracking-[-0.035em] text-[#2e2631]">
          {title}
        </h2>

        <p className="mx-auto mt-4 max-w-lg leading-7 text-[#7d7381]">
          {description}
        </p>

        <Link
          to="/dashboard"
          className="mt-8 inline-flex items-center gap-2 rounded-xl border border-[#dcd4df] px-5 py-3 text-sm font-bold text-[#432059] transition hover:border-[#432059] hover:bg-[#f7f2f8]"
        >
          <ArrowLeft size={18} />
          Voltar ao dashboard
        </Link>
      </div>
    </section>
  );
}