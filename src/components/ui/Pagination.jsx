import { useEffect, useId, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export function Pagination({
  currentPage,
  totalPages,
  totalRecords,
  canGoBack,
  canGoForward,
  onPrevious,
  onNext,
  onPageChange,
  itemLabelSingular = "registro encontrado",
  itemLabelPlural = "registros encontrados",
}) {
  const pageInputId = useId();
  const [pageToGo, setPageToGo] = useState(String(currentPage));

  useEffect(() => {
    setPageToGo(String(currentPage));
  }, [currentPage]);

  function handleGoToPage(event) {
    event.preventDefault();

    const requestedPage = Number.parseInt(pageToGo, 10);

    if (Number.isNaN(requestedPage)) {
      setPageToGo(String(currentPage));
      return;
    }

    const safePage = Math.min(Math.max(requestedPage, 1), totalPages);
    setPageToGo(String(safePage));

    if (safePage !== currentPage) {
      onPageChange(safePage);
    }
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-[#eee9f0] px-5 py-4 sm:flex-row">
      <p className="text-xs font-medium text-[#918794]">
        {totalRecords}{" "}
        {totalRecords === 1 ? itemLabelSingular : itemLabelPlural}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={!canGoBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ded7e1] text-[#5d276d] transition hover:border-[#432059] disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Primeira página"
          title="Primeira página"
        >
          <ChevronsLeft size={18} />
        </button>
        <button
          type="button"
          onClick={onPrevious}
          disabled={!canGoBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ded7e1] text-[#5d276d] transition hover:border-[#432059] disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Página anterior"
          title="Página anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <form
          onSubmit={handleGoToPage}
          className="flex h-10 items-center overflow-hidden rounded-xl border border-[#ded7e1] bg-white focus-within:border-[#432059] focus-within:ring-4 focus-within:ring-[#432059]/10"
        >
          <label className="sr-only" htmlFor={pageInputId}>
            Ir para a página
          </label>
          <input
            id={pageInputId}
            type="number"
            min="1"
            max={totalPages}
            value={pageToGo}
            onChange={(event) => setPageToGo(event.target.value)}
            className="h-full w-16 bg-transparent px-3 text-center text-sm font-bold text-[#4c414f] outline-none"
            aria-label={`Página atual. Digite um número entre 1 e ${totalPages}`}
          />
          <span className="whitespace-nowrap border-l border-[#eee9f0] px-3 text-xs font-semibold text-[#817688]">
            de {totalPages}
          </span>
          <button
            type="submit"
            className="h-full border-l border-[#ded7e1] px-3 text-xs font-bold text-[#5d276d] transition hover:bg-[#f8f4fa]"
          >
            Ir
          </button>
        </form>
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoForward}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ded7e1] text-[#5d276d] transition hover:border-[#432059] disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Próxima página"
          title="Próxima página"
        >
          <ChevronRight size={18} />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={!canGoForward}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#ded7e1] text-[#5d276d] transition hover:border-[#432059] disabled:cursor-not-allowed disabled:opacity-35"
          aria-label="Última página"
          title="Última página"
        >
          <ChevronsRight size={18} />
        </button>
      </div>
    </div>
  );
}
