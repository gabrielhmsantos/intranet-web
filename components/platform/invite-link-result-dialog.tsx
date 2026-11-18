"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type InviteLinkResultDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  inviteUrl: string | null;
};

export function InviteLinkResultDialog({
  open,
  onOpenChange,
  title,
  description,
  inviteUrl,
}: InviteLinkResultDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {inviteUrl ? (
          <div className="flex flex-col gap-3">
            <Input readOnly value={inviteUrl} aria-label="Link do convite" />
            <Button
              type="button"
              onClick={() => navigator.clipboard.writeText(inviteUrl)}
            >
              Copiar link
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
