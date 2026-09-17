/** Cabeçalho padrão das páginas do admin: título, contexto e ação opcional. */
export default function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-gray-200 pb-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900">{title}</h1>
        {description && <p className="mt-1 text-[13px] text-gray-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
