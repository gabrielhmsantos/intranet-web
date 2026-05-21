import { PlaceholderPage } from "@/components/shell/placeholder-page";

export const metadata = { title: "Evento" };

type PageProps = { params: Promise<{ id: string }> };

export default async function EventoDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <PlaceholderPage
      title="Evento"
      description={`Detalhe do evento (ID: ${id}) — placeholder EP-1.`}
    />
  );
}
