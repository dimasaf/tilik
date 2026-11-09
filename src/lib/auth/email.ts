import "server-only";
import nodemailer from "nodemailer";
import { getApplicationOrigin } from "@/lib/auth/origin";

const LOCAL_SMTP_HOSTS: Record<string, true> = {
  localhost: true,
  "127.0.0.1": true,
  "[::1]": true,
  mailpit: true,
};

function mailpitTransport() {
  const host = process.env.SMTP_HOST ?? "";
  const port = Number(process.env.SMTP_PORT);
  if (!LOCAL_SMTP_HOSTS[host] || port !== 1025) {
    throw new Error("Email delivery is restricted to local Mailpit.");
  }

  return nodemailer.createTransport({ host, port, secure: false });
}

export async function sendVerificationEmail(
  email: string,
  tokenHash: string,
): Promise<void> {
  const confirmationUrl = new URL("/auth/confirm", getApplicationOrigin());
  confirmationUrl.searchParams.set("token_hash", tokenHash);
  confirmationUrl.searchParams.set("type", "email");

  await mailpitTransport().sendMail({
    from: process.env.SMTP_FROM ?? "Tilikstory <no-reply@tilikstory.local>",
    to: email,
    subject: "Konfirmasi email Tilikstory",
    text: `Konfirmasi email Anda melalui tautan ini: ${confirmationUrl.href}`,
    html: `<p>Konfirmasi email Anda untuk Tilikstory.</p><p><a href="${confirmationUrl.href}">Konfirmasi email</a></p>`,
  });
}
