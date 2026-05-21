type PlaceholderPageProps = {
  title: string;
  description?: string;
};

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description ? (
        <p className="text-muted-foreground">{description}</p>
      ) : (
        <p className="text-muted-foreground">
          Conteúdo em desenvolvimento — módulo previsto para um épico futuro.
        </p>
      )}
    </div>
  );
}
