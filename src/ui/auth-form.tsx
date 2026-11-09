"use client";

import { useState, type FormEvent } from "react";

type AuthFormProps = {
  mode: "register" | "sign-in";
  notice?: string;
};

export function AuthForm({ mode, notice }: AuthFormProps) {
  const isRegistration = mode === "register";
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      const result = (await response.json()) as {
        message?: string;
        error?: string;
      };
      if (!response.ok) {
        setError(result.error ?? "Permintaan belum berhasil. Coba lagi.");
        return;
      }

      if (isRegistration) {
        setMessage(result.message ?? "Periksa email untuk konfirmasi akun.");
        form.reset();
      } else {
        window.location.assign("/account");
      }
    } catch {
      setError("Tidak dapat terhubung. Periksa koneksi lokal lalu coba lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-panel" aria-labelledby="auth-title">
        <a className="wordmark" href="/" aria-label="Tilikstory home">
          <span className="wordmark-mark" aria-hidden="true">T</span>
          <span>Tilikstory</span>
        </a>
        <div className="auth-copy">
          <p className="eyebrow">CERITA YANG DIRAYAKAN</p>
          <h1 id="auth-title">
            {isRegistration ? "Mulai dari cerita Anda." : "Selamat datang kembali."}
          </h1>
          <p className="auth-intro">
            {isRegistration
              ? "Buat akun untuk menyiapkan undangan yang terasa personal."
              : "Masuk untuk melanjutkan cerita dan mengelola undangan Anda."}
          </p>
        </div>

        <form className="auth-form" onSubmit={submit} aria-busy={pending}>
          <div className="field-group">
            <label htmlFor={`${mode}-email`}>Email</label>
            <input
              id={`${mode}-email`}
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              placeholder="nama@email.com"
              required
            />
          </div>
          <div className="field-group">
            <label htmlFor={`${mode}-password`}>Password</label>
            <input
              id={`${mode}-password`}
              name="password"
              type="password"
              autoComplete={isRegistration ? "new-password" : "current-password"}
              minLength={isRegistration ? 12 : 1}
              maxLength={128}
              aria-describedby={isRegistration ? `${mode}-password-help` : undefined}
              required
            />
            {isRegistration && (
              <p id={`${mode}-password-help`} className="field-help">
                Gunakan minimal 12 karakter.
              </p>
            )}
          </div>

          {notice && <p className="form-notice" role="status">{notice}</p>}
          {message && <p className="form-message" role="status">{message}</p>}
          {error && <p className="form-error" role="alert">{error}</p>}

          <button className="primary-button" type="submit" disabled={pending}>
            {pending
              ? "Memproses…"
              : isRegistration
                ? "Buat akun"
                : "Masuk ke akun"}
          </button>
        </form>

        <p className="auth-switch">
          {isRegistration ? "Sudah punya akun? " : "Belum punya akun? "}
          <a href={isRegistration ? "/sign-in" : "/register"}>
            {isRegistration ? "Masuk" : "Daftar"}
          </a>
        </p>
      </section>

      <aside className="auth-art" aria-label="Ruang untuk cerita yang akan dirayakan">
        <div className="art-stamp" aria-hidden="true">
          <span>hari</span>
          <span>istimewa</span>
          <span>dimulai</span>
          <span>di sini</span>
        </div>
        <div className="art-caption">
          <span className="art-number" aria-hidden="true">01</span>
          <p>Ruang kecil untuk merencanakan<br />hari yang akan selalu diingat.</p>
        </div>
      </aside>
    </div>
  );
}
