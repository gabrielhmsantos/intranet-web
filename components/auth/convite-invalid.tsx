import { INVITE_INVALID_MESSAGE } from "@/lib/invites";

export function ConviteInvalid() {
  return (
    <div
      className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground"
      data-testid="convite-invalid"
    >
      {INVITE_INVALID_MESSAGE}
    </div>
  );
}
