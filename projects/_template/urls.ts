import { resolveProjectUrls } from "@core/project/resolveUrls";
import { projectConfig } from "./project.config";

const urls = resolveProjectUrls(projectConfig);

export const BASE_URL = urls.baseUrl;
export const LOGIN_URL = urls.loginUrl;

declare global {
  // eslint-disable-next-line no-var
  var __AWE_BASE_URL__: string | undefined;
}

globalThis.__AWE_BASE_URL__ = BASE_URL;
