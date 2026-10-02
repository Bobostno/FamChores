import { requireParent } from "@/lib/auth";
import { getBalances, getMembers } from "@/lib/data";
import { MemberManager } from "@/components/MemberManager";
import { getDb } from "@/lib/db";

export const metadata = { title: "Members" };

export default async function MembersPage() {
  const parent = await requireParent();

  const members = getMembers(parent.familyId);
  const balanceMap = getBalances(parent.familyId);
  const balances = Object.fromEntries(balanceMap);

  const family = getDb()
    .prepare("SELECT invite_code FROM families WHERE id = ?")
    .get(parent.familyId) as { invite_code: string };

  return (
    <MemberManager
      members={members}
      balances={balances}
      inviteCode={family.invite_code}
      viewerId={parent.id}
    />
  );
}
