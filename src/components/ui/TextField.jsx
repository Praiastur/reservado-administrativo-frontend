export function TextField({
  id,
  label,
  icon: Icon,
  error,
  rightElement,
  className = "",
  ...inputProps
}) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={`space-y-2 ${className}`}>
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-[#332d37]"
      >
        {label}
      </label>

      <div
        className={[
          "flex h-12 items-center rounded-xl border bg-white transition",
          "focus-within:border-[#432059] focus-within:ring-4 focus-within:ring-[#432059]/10",
          error
            ? "border-red-400"
            : "border-[#ded8e2] hover:border-[#c8bdcc]",
        ].join(" ")}
      >
        {Icon && (
          <div className="flex h-full items-center pl-4 text-[#817788]">
            <Icon size={19} strokeWidth={1.9} />
          </div>
        )}

        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] text-[#211c24] outline-none placeholder:text-[#aaa2ae]"
          {...inputProps}
        />

        {rightElement && (
          <div className="flex h-full items-center pr-2">{rightElement}</div>
        )}
      </div>

      {error && (
        <p id={errorId} className="text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}