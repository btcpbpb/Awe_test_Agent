export const projectConfig = {
  name: "myapp",
  baseUrl: "https://example.com",
  loginUrl: "https://example.com/login",
  authStatePath: ".auth-state.json",
  defaultTags: ["smoke", "p0"],
} as const;

export type ProjectConfig = typeof projectConfig;
