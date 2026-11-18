export type ExpiredBootstrapInvite = {
  inviteId: string;
  tenantId: string;
  tenantName: string;
  email: string;
  expiresAt: string;
  status: "pending";
};
