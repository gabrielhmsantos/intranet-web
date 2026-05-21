import { PlaceholderPage } from "@/components/shell/placeholder-page";

export const metadata = { title: "Colaborador" };

type PageProps = { params: Promise<{ id: string }> };

export default async function ColaboradorDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <PlaceholderPage
      title="Colaborador"
      description={`Detalhe do colaborador (ID: ${id}) — placeholder EP-1.`}
    />
  );
}
