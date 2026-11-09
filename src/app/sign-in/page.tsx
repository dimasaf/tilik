import { AuthForm } from "@/ui/auth-form";

type SignInPageProps = {
  searchParams?: Promise<{ verified?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const parameters = searchParams ? await searchParams : {};
  const notice =
    parameters.verified === "1"
      ? "Email terkonfirmasi. Sekarang Anda dapat masuk."
      : undefined;

  return (
    <main className="auth-shell">
      <AuthForm mode="sign-in" notice={notice} />
    </main>
  );
}
