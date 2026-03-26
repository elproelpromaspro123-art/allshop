const STATUS_META: Record<string, { label: string; className: string; dot: string }> = {
  pending: {
    label: "Pendiente",
    className: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
  },
  processing: {
    label: "Procesando",
    className: "border-sky-200 bg-sky-50 text-sky-800",
    dot: "bg-sky-500",
  },
  shipped: {
    label: "Enviado",
    className: "border-indigo-200 bg-indigo-50 text-indigo-800",
    dot: "bg-indigo-500",
  },
  delivered: {
    label: "Entregado",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelado",
    className: "border-rose-200 bg-rose-50 text-rose-800",
    dot: "bg-rose-500",
  },
  refunded: {
    label: "Reembolsado",
    className: "border-slate-200 bg-slate-50 text-slate-700",
    dot: "bg-slate-400",
  },
  deleted: {
    label: "Eliminado",
    className: "border-slate-200 bg-slate-50 text-slate-700",
    dot: "bg-slate-400",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] || {
    label: status,
    className: "border-slate-200 bg-slate-50 text-slate-700",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.className}`}
      aria-label={`Estado ${meta.label}`}
      title={meta.label}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}
