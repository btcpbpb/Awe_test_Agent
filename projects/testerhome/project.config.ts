export const projectConfig = {
  name: "testerhome",
  baseUrl: "https://testerhome.com",
  loginUrl: "https://testerhome.com/account/sign_in",
  authStatePath: ".auth-state.json",
  defaultTags: [
    "smoke",
    "regression",
    "p0",
    "p1",
    "p2",
    "auth",
    "topics",
    "search",
    "user",
    "community",
  ],
} as const;

export type ProjectConfig = typeof projectConfig;
