#!/usr/bin/env node
/**
 * 查询用例 manifest
 *
 * 用法：
 *   npm run cases:query -- --tag smoke
 *   npm run cases:query -- --priority P0 --module auth
 *   npm run cases:query -- --stability quarantined
 */

import {
  readManifest,
  scanProjectTests,
  queryCases,
} from "../core/cases/case-manifest";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  if (i === -1 || i + 1 >= process.argv.length) return undefined;
  return process.argv[i + 1];
}

const project = process.env.PROJECT || "testerhome";
const manifest = readManifest(project) ?? scanProjectTests(project);

const filters = {
  tag: arg("--tag"),
  priority: arg("--priority"),
  stability: arg("--stability"),
  owner: arg("--owner"),
  module: arg("--module"),
};

const results = queryCases(manifest, filters);

console.log(`\n=== 用例查询 · ${project} ===\n`);
console.log(
  `条件: ${Object.entries(filters)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ") || "(无)"}`
);
console.log(`匹配 ${results.length} / ${manifest.cases.length} 条\n`);

for (const c of results) {
  console.log(`• [${c.priority}] ${c.id}`);
  console.log(`  ${c.title}`);
  console.log(`  file: ${c.file}`);
  console.log(`  tags: ${c.tags.join(", ")} | stability: ${c.stability}`);
  if (c.owner) console.log(`  owner: ${c.owner}`);
  console.log("");
}

process.exit(0);
