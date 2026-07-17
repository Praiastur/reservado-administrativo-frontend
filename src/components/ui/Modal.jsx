import { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-2xl",
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        className="fixed inset-0 bg-[#1e1422]/55 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fechar modal"
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={[
          "relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden",
          "rounded-t-3xl border border-[#e5dfe8] bg-white",
          "shadow-[0_30px_100px_rgba(27,13,33,0.28)]",
          "sm:rounded-3xl",
          maxWidth,
        ].join(" ")}
      >
        <header className="flex items-start justify-between gap-5 border-b border-[#eee9f0] px-5 py-5 sm:px-6">
          <div>
            <h2
              id="modal-title"
              className="text-xl font-bold tracking-[-0.025em] text-[#302733]"
            >
              {title}
            </h2>

            {description && (
              <p className="mt-1.5 text-sm leading-6 text-[#847a88]">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#887e8c] transition hover:bg-[#f4f0f5] hover:text-[#432059]"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </header>

        <div className="overflow-y-auto">{children}</div>
      </section>
    </div>
  );
}