export type InviteStatus = "none" | "pending" | "active";

export type EmployeeListItem = {
  id: string;
  displayName: string;
  departmentName: string | null;
  status: "active" | "inactive";
  /** Omitido para colaborador/gestor (sem permissão de ver Acesso). */
  hasAccount?: boolean;
  inviteStatus?: InviteStatus;
};

export type EmployeeDetail = {
  id: string;
  displayName: string;
  workEmail: string | null;
  departmentId: string | null;
  departmentName: string | null;
  managerId: string | null;
  managerName: string | null;
  extensionNumber: string | null;
  status: "active" | "inactive";
  /** Omitido para colaborador/gestor (sem permissão de ver Acesso). */
  hasAccount?: boolean;
  inviteStatus?: InviteStatus;
  canEdit: boolean;
  canInvite: boolean;
  canDeactivate: boolean;
  canReactivate: boolean;
};

export type EmployeeListResult = {
  items: EmployeeListItem[];
  page: number;
  pageSize: number;
  total: number;
};
