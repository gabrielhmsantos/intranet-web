/**
 * FR-004a: active employees without account ∪ pending employee invites (deduped).
 */
export function countPendingInvites(
  activeWithoutAccountIds: Iterable<string>,
  pendingInviteEmployeeIds: Iterable<string>,
): number {
  const ids = new Set<string>();
  for (const id of activeWithoutAccountIds) {
    ids.add(id);
  }
  for (const id of pendingInviteEmployeeIds) {
    ids.add(id);
  }
  return ids.size;
}
