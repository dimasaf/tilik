export type AuthTestEndpointConfiguration = {
  topology: string;
  databaseUrl: string;
  appUrl: string;
  appOrigin: string;
  mailpitApiUrl: string;
  smtpHost: string;
  smtpPort: number;
};

function matchesServiceUrl(
  value: string,
  protocol: string,
  hostname: string,
  port: string,
): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === protocol &&
      url.hostname === hostname &&
      url.port === port &&
      (url.pathname === "" || url.pathname === "/") &&
      url.username === "" &&
      url.password === "" &&
      url.search === "" &&
      url.hash === ""
    );
  } catch {
    return false;
  }
}

export function assertComposeAuthTestEndpoints(
  configuration: AuthTestEndpointConfiguration,
): void {
  let database: URL;
  try {
    database = new URL(configuration.databaseUrl);
  } catch {
    throw new Error("Authentication tests require the private Compose topology.");
  }

  const databaseIsLocal =
    (database.protocol === "postgresql:" || database.protocol === "postgres:") &&
    database.hostname === "postgres" &&
    database.port === "5432" &&
    database.username === "tilikstory" &&
    database.pathname === "/tilikstory" &&
    database.searchParams.size === 1 &&
    database.searchParams.get("schema") === "public" &&
    database.hash === "";

  const allowed =
    configuration.topology === "compose-private" &&
    databaseIsLocal &&
    matchesServiceUrl(configuration.appUrl, "http:", "app", "3000") &&
    matchesServiceUrl(
      configuration.appOrigin,
      "http:",
      "localhost",
      "3000",
    ) &&
    matchesServiceUrl(
      configuration.mailpitApiUrl,
      "http:",
      "mailpit",
      "8025",
    ) &&
    configuration.smtpHost === "mailpit" &&
    configuration.smtpPort === 1025;

  if (!allowed) {
    throw new Error("Authentication tests require the private Compose topology.");
  }
}
