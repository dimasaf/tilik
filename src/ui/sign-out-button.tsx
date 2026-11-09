"use client";

import { useState } from "react";

export function SignOutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/sign-out", { method: "POST" });
      if (!response.ok) {
        setError("Tidak dapat keluar sekarang. Coba lagi.");
        return;
      }
      window.location.replace("/sign-in");
    } catch {
      setError("Tidak dapat terhubung. Coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="sign-out-area">
      <button className="secondary-button" type="button" onClick={signOut} disabled={pending}>
        {pending ? "Keluar…" : "Keluar dari akun"}
      </button>
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  );
}
