import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { OnboardingForm } from "@/components/AuthForms";

export const metadata = { title: "Get started" };

export default function JoinPage() {
  return (
    <AuthShell
      title="Start your family hub"
      subtitle="Create a new family, or join one with an invite code."
      footer={
        <>
          Already set up?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <OnboardingForm />
    </AuthShell>
  );
}
