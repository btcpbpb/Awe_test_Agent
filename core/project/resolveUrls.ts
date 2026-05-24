export function normalizeAbsoluteHttpUrl(input?: string): string | undefined {
  const value = input?.trim();
  if (!value) return undefined;
  if (!/^https?:\/\//i.test(value)) return undefined;
  return value.replace(/\/+$/, "");
}

export function resolveProjectUrls(config: {
  baseUrl: string;
  loginUrl: string;
}): { baseUrl: string; loginUrl: string } {
  const baseUrl =
    normalizeAbsoluteHttpUrl(process.env.BASE_URL) || config.baseUrl;
  const loginUrl =
    normalizeAbsoluteHttpUrl(process.env.LOGIN_URL) ||
    config.loginUrl ||
    `${baseUrl}/account/sign_in`;

  return { baseUrl, loginUrl };
}
