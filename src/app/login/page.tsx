import { Suspense } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { SignInForm } from "@/components/AuthForms";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to see how the family is doing."
      footer={
        <>
          No account yet?{" "}
          <Link href="/join" className="font-medium text-accent hover:underline">
            Create your family
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="h-64" />}>
        <SignInForm />
      </Suspense>
    </AuthShell>
  );
}
