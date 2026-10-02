import { requireUser } from "@/lib/auth";
import { getBalances, getRewards } from "@/lib/data";
import { RewardManager } from "@/components/RewardManager";
import { RewardShop } from "@/components/RewardShop";

export const metadata = { title: "Rewards" };

export default async function RewardsPage() {
  const user = await requireUser();
  const rewards = getRewards(user.familyId);

  // Parents manage the catalogue; kids get the shop.
  if (user.role === "parent") {
    return <RewardManager rewards={rewards} />;
  }

  const balance = getBalances(user.familyId).get(user.id) ?? 0;
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Rewards
        </h1>
        <p className="mt-1 text-sm text-muted">
          Save up your points and pick something to spend them on.
        </p>
      </header>
      <RewardShop rewards={rewards.filter((r) => r.active === 1)} balance={balance} />
    </div>
  );
}
