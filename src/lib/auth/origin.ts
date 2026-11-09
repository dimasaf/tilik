const LOOPBACK_HOSTS: Record<string, true> = {
  localhost: true,
  "127.0.0.1": true,
  "[::1]": true,
};

export function getApplicationOrigin(): URL {
  const configuredOrigin = process.env.APP_ORIGIN ?? "";
  let url: URL;
  try {
    url = new URL(configuredOrigin);
  } catch {
    throw new Error("APP_ORIGIN must be a local or HTTPS origin.");
  }

  const isLocalHttp =
    url.protocol === "http:" && LOOPBACK_HOSTS[url.hostname] === true;
  const isHttps = url.protocol === "https:";
  if (
    (!isLocalHttp && !isHttps) ||
    url.pathname !== "/" ||
    url.username !== "" ||
    url.password !== "" ||
    url.search !== "" ||
    url.hash !== ""
  ) {
    throw new Error("APP_ORIGIN must be a local or HTTPS origin.");
  }

  return new URL(url.origin);
}
