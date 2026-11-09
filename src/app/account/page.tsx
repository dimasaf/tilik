import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { SignOutButton } from "@/ui/sign-out-button";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentSession();
  if (!user) redirect("/sign-in");

  return (
    <main className="account-shell">
      <section className="account-content" aria-labelledby="account-title">
        <a className="wordmark" href="/" aria-label="Tilikstory home">
          <span className="wordmark-mark" aria-hidden="true">T</span>
          <span>Tilikstory</span>
        </a>
        <p className="eyebrow">AKUN PELANGGAN</p>
        <h1 id="account-title">Senang melihatmu kembali.</h1>
        <p className="account-email">Masuk sebagai <strong>{user.email}</strong></p>
        <p className="account-note">Email akun ini sudah terkonfirmasi.</p>
        <SignOutButton />
      </section>
      <aside className="account-art" aria-hidden="true">
        <div className="art-ring" />
        <p>setiap cerita<br />punya awal</p>
      </aside>
    </main>
  );
}
