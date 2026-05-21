import { PlaceholderPage } from "@/components/shell/placeholder-page";
import { FeedbackDemo } from "@/components/demo/feedback-demo";

export const metadata = { title: "Início" };

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <PlaceholderPage
        title="Início"
        description="Resumo da área do colaborador — conteúdo real nos próximos épicos."
      />
      {process.env.NODE_ENV === "development" ? <FeedbackDemo /> : null}
    </div>
  );
}
