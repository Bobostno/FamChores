import { requireParent } from "@/lib/auth";
import { getChores, getMembers, getPendingApprovals } from "@/lib/data";
import { ChoreManager } from "@/components/ChoreManager";

export const metadata = { title: "Chores" };

export default async function ChoresPage() {
  const parent = await requireParent();

  return (
    <ChoreManager
      chores={getChores(parent.familyId)}
      members={getMembers(parent.familyId)}
      approvals={getPendingApprovals(parent.familyId)}
    />
  );
}
