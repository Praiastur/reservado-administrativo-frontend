import { useEffect, useRef, useState } from "react";
import { Hash, LoaderCircle, X } from "lucide-react";

import { contractsService } from "../../services/contractsService";

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Campo de busca com autocomplete para escolher vários contratos de uma
 * vez: digita parte do número, escolhe uma sugestão, ela vira um "chip"
 * na lista. `selected`/`onChange` seguem o formato
 * `{ id, numero, letra }[]`.
 */
export function ContractPicker({
  selected = [],
  onChange,
  placeholder = "Digite o número do contrato…",
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsSearching(false);
      return undefined;
    }

    let active = true;
    setIsSearching(true);

    const timeoutId = setTimeout(async () => {
      try {
        const response = await contractsService.list({
          numero: trimmed,
          tamanhoPagina: 8,
        });

        if (!active) return;

        const selectedIds = new Set(selected.map((item) => item.id));

        setSuggestions(
          response.items.filter((item) => !selectedIds.has(item.id)),
        );
        setIsOpen(true);
      } catch {
        if (active) setSuggestions([]);
      } finally {
        if (active) setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function addContract(contract) {
    onChange([
      ...selected,
      { id: contract.id, numero: contract.numero, letra: contract.letra },
    ]);
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
  }

  function removeContract(id) {
    onChange(selected.filter((item) => item.id !== id));
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      if (suggestions.length > 0) addContract(suggestions[0]);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  const showEmptyState =
    isOpen &&
    !isSearching &&
    query.trim().length >= MIN_QUERY_LENGTH &&
    suggestions.length === 0;

  return (
    <div ref={containerRef} className="relative">
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selected.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#d4c0dc] bg-[#f6effa] px-2.5 py-1.5 text-xs font-bold text-[#5d276d]"
            >
              {[item.numero, item.letra].filter(Boolean).join(" / ")}
              <button
                type="button"
                onClick={() => removeContract(item.id)}
                className="rounded p-0.5 transition hover:bg-[#e6d5ec]"
                aria-label={`Remover contrato ${item.numero}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex h-12 items-center rounded-xl border border-[#ded8e2] bg-white text-[#8b818f] transition focus-within:border-[#432059] focus-within:ring-4 focus-within:ring-[#432059]/10">
        <Hash size={18} className="ml-4 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-[#aaa1ae]"
        />
        {isSearching && (
          <LoaderCircle
            size={16}
            className="mr-4 shrink-0 animate-spin text-[#aaa1ae]"
          />
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-[#e7e1e9] bg-white shadow-lg">
          {suggestions.map((contract) => (
            <button
              key={contract.id}
              type="button"
              onClick={() => addContract(contract)}
              className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-[#f8f4fa]"
            >
              <span className="font-bold text-[#342b37]">
                {[contract.numero, contract.letra].filter(Boolean).join(" / ")}
              </span>
              {contract.titular?.nome && (
                <span className="truncate text-xs text-[#928895]">
                  {contract.titular.nome}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {showEmptyState && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-[#e7e1e9] bg-white px-4 py-3 text-xs text-[#918794] shadow-lg">
          Nenhum contrato encontrado.
        </div>
      )}
    </div>
  );
}
