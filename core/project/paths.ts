import * as path from "path";

export function getProjectName(): string {
  return process.env.PROJECT || "testerhome";
}

export function getProjectRoot(): string {
  return path.resolve(process.cwd(), "projects", getProjectName());
}

export function getAuthStatePath(): string {
  return path.join(getProjectRoot(), ".auth-state.json");
}
