#!/usr/bin/env node
/**
 * 校验 / 生成用例 manifest
 *
 * 用法：
 *   npm run cases:check
 *   npm run cases:validate          # 校验并重写 manifest.json
 */

import {
  scanProjectTests,
  validateManifest,
  writeManifest,
  readManifest,
} from "../core/cases/case-manifest";

const writeFlag = process.argv.includes("--write-manifest");
const project = process.env.PROJECT || "testerhome";

const scanned = scanProjectTests(project);
const validation = validateManifest(scanned);

console.log(`\n=== 用例校验 · ${project} ===\n`);
console.log(`扫描到 ${scanned.cases.length} 条用例`);

if (validation.warnings.length > 0) {
  console.log("\n⚠️  警告:");
  validation.warnings.forEach((w) => console.log(`  - ${w}`));
}

if (validation.errors.length > 0) {
  console.log("\n❌ 错误:");
  validation.errors.forEach((e) => console.log(`  - ${e}`));
}

if (writeFlag) {
  const out = writeManifest(scanned);
  console.log(`\n✅ 已写入 ${out}`);
} else {
  const existing = readManifest(project);
  if (existing && existing.cases.length !== scanned.cases.length) {
    console.log(
      `\n⚠️  manifest 过期：文件内 ${existing.cases.length} 条，实际 ${scanned.cases.length} 条`
    );
    console.log("   运行 npm run cases:validate 刷新");
  }
}

console.log("");
process.exit(validation.valid ? 0 : 1);
