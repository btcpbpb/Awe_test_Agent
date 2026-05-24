/**
 * 扫描测试文件，生成用例 manifest
 */

import * as fs from "fs";
import * as path from "path";

export type CaseStability = "stable" | "quarantined" | "experimental";
export type CasePriority = "P0" | "P1" | "P2" | "P3";

export interface TestCaseEntry {
  id: string;
  title: string;
  file: string;
  describe: string;
  tags: string[];
  priority: CasePriority;
  owner?: string;
  stability: CaseStability;
  module: string;
}

export interface CaseManifest {
  version: 1;
  project: string;
  generatedAt: string;
  cases: TestCaseEntry[];
}

function slugify(parts: string[]): string {
  return parts
    .join(".")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function priorityFromTags(tags: string[]): CasePriority {
  if (tags.some((t) => t === "p0" || t === "@p0")) return "P0";
  if (tags.some((t) => t === "p1" || t === "@p1")) return "P1";
  if (tags.some((t) => t === "p2" || t === "@p2")) return "P2";
  return "P3";
}

function normalizeTag(tag: string): string {
  return tag.replace(/^@/, "").toLowerCase();
}

function parseTestFile(
  filePath: string,
  projectRoot: string,
  project: string
): TestCaseEntry[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const relFile = path.relative(process.cwd(), filePath).replace(/\\/g, "/");

  const module = path.basename(path.dirname(filePath));

  let owner: string | undefined;
  let stability: CaseStability = "stable";

  const ownerMatch = content.match(/@owner\s+(\S+)/);
  if (ownerMatch) owner = ownerMatch[1];

  const stabilityMatch = content.match(
    /@stability\s+(stable|quarantined|experimental)/i
  );
  if (stabilityMatch) {
    stability = stabilityMatch[1].toLowerCase() as CaseStability;
  }

  const describeMatch = content.match(/describe\s*\(\s*["'`]([^"'`]+)["'`]/);
  const describeTitle = describeMatch ? describeMatch[1] : module;

  const entries: TestCaseEntry[] = [];
  const testRegex =
    /test\s*\(\s*["'`]([^"'`]+)["'`]\s*,\s*\{[^}]*tags:\s*\[([^\]]*)\]/g;

  let match: RegExpExecArray | null;
  while ((match = testRegex.exec(content)) !== null) {
    const title = match[1];
    const tagsRaw = match[2];
    const tags = tagsRaw
      .split(",")
      .map((t) => normalizeTag(t.trim().replace(/["'`]/g, "")))
      .filter(Boolean);

    const id = slugify([project, module, title]);

    entries.push({
      id,
      title,
      file: relFile,
      describe: describeTitle,
      tags,
      priority: priorityFromTags(tags),
      owner,
      stability,
      module,
    });
  }

  return entries;
}

export function scanProjectTests(project?: string): CaseManifest {
  const projectName = project || process.env.PROJECT || "testerhome";
  const projectRoot = path.join(process.cwd(), "projects", projectName);
  const testsDir = path.join(projectRoot, "tests");

  const cases: TestCaseEntry[] = [];

  if (!fs.existsSync(testsDir)) {
    return {
      version: 1,
      project: projectName,
      generatedAt: new Date().toISOString(),
      cases: [],
    };
  }

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".test.ts")) {
        cases.push(...parseTestFile(full, projectRoot, projectName));
      }
    }
  }

  walk(testsDir);

  cases.sort((a, b) => a.id.localeCompare(b.id));

  return {
    version: 1,
    project: projectName,
    generatedAt: new Date().toISOString(),
    cases,
  };
}

export interface ValidateResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateManifest(manifest: CaseManifest): ValidateResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = new Set<string>();

  for (const c of manifest.cases) {
    if (ids.has(c.id)) {
      errors.push(`重复 id: ${c.id}`);
    }
    ids.add(c.id);

    if (!c.title) errors.push(`用例缺少 title: ${c.id}`);
    if (!c.file) errors.push(`用例缺少 file: ${c.id}`);
    if (!fs.existsSync(path.join(process.cwd(), c.file))) {
      errors.push(`文件不存在: ${c.file} (${c.id})`);
    }
    if (c.tags.length === 0) {
      warnings.push(`用例无 tags: ${c.id}`);
    }
    if (!c.tags.some((t) => ["p0", "p1", "p2", "p3"].includes(t))) {
      warnings.push(`用例未标注优先级 tag (p0-p2): ${c.id}`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export interface QueryFilters {
  tag?: string;
  priority?: string;
  stability?: string;
  owner?: string;
  module?: string;
}

export function queryCases(
  manifest: CaseManifest,
  filters: QueryFilters
): TestCaseEntry[] {
  return manifest.cases.filter((c) => {
    if (filters.tag && !c.tags.includes(filters.tag.toLowerCase())) {
      return false;
    }
    if (
      filters.priority &&
      c.priority.toLowerCase() !== filters.priority.toLowerCase()
    ) {
      return false;
    }
    if (
      filters.stability &&
      c.stability.toLowerCase() !== filters.stability.toLowerCase()
    ) {
      return false;
    }
    if (filters.owner && c.owner !== filters.owner) {
      return false;
    }
    if (filters.module && c.module !== filters.module) {
      return false;
    }
    return true;
  });
}

export function manifestPath(project?: string): string {
  const projectName = project || process.env.PROJECT || "testerhome";
  return path.join(
    process.cwd(),
    "projects",
    projectName,
    "tests",
    "manifest.json"
  );
}

export function writeManifest(manifest: CaseManifest): string {
  const out = manifestPath(manifest.project);
  fs.writeFileSync(out, JSON.stringify(manifest, null, 2), "utf-8");
  return out;
}

export function readManifest(project?: string): CaseManifest | null {
  const p = manifestPath(project);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf-8")) as CaseManifest;
}
