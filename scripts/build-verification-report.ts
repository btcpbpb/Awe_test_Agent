#!/usr/bin/env node
/**
 * 从 latest-run.log 生成 report.json / report.md
 *
 * 用法：
 *   npx tsx scripts/build-verification-report.ts
 *   npx tsx scripts/build-verification-report.ts --test-file projects/testerhome/tests/auth/login.test.ts --exit-code 1
 */

import {
  buildVerificationReport,
  writeVerificationReport,
} from "../core/reports/build-verification-report";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  if (i === -1 || i + 1 >= process.argv.length) return undefined;
  return process.argv[i + 1];
}

const testFile = arg("--test-file");
const exitCodeRaw = arg("--exit-code");
const exitCode = exitCodeRaw !== undefined ? Number(exitCodeRaw) : 0;

const report = buildVerificationReport({
  testFile,
  exitCode,
});

writeVerificationReport(report);
process.exit(report.status === "passed" ? 0 : 1);
