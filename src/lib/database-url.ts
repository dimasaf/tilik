const LOCAL_DATABASE_HOSTS: Record<string, true> = {
  localhost: true,
  "127.0.0.1": true,
  "[::1]": true,
  postgres: true,
};

export function assertLocalPostgresUrl(connectionString: string): string {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error("DATABASE_URL must point to local self-hosted PostgreSQL.");
  }

  if (
    !["postgresql:", "postgres:"].includes(url.protocol) ||
    !LOCAL_DATABASE_HOSTS[url.hostname] ||
    url.port !== "5432" ||
    !url.pathname ||
    url.pathname === "/" ||
    url.hash !== ""
  ) {
    throw new Error("DATABASE_URL must point to local self-hosted PostgreSQL.");
  }

  return connectionString;
}
