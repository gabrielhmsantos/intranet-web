import { ProfileForm } from "@/components/profile/profile-form";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Perfil" };

export default function PerfilPage() {
  if (!isSupabaseConfigured()) {
    return (
      <p className="text-muted-foreground">
        Configure Supabase para editar o perfil.
      </p>
    );
  }

  return <ProfileForm />;
}
