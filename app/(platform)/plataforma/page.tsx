import { redirect } from "next/navigation";

export const metadata = {
  title: "Plataforma",
};

export default function PlataformaIndexPage() {
  redirect("/plataforma/dashboard");
}
