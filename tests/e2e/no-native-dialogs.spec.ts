import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const SCAN_DIRS = [
  path.join(process.cwd(), "app"),
  path.join(process.cwd(), "components"),
];

function collectTsFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectTsFiles(full);
    }
    if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      return [full];
    }
    return [];
  });
}

test("no native dialog APIs in app/ and components/", () => {
  const forbidden = [
    "window.alert(",
    "window.confirm(",
    "window.prompt(",
  ];
  const violations: string[] = [];

  for (const dir of SCAN_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const file of collectTsFiles(dir)) {
      const content = fs.readFileSync(file, "utf8");
      for (const pattern of forbidden) {
        if (content.includes(pattern)) {
          violations.push(`${file}: contains ${pattern}`);
        }
      }
    }
  }

  expect(violations).toEqual([]);
});
