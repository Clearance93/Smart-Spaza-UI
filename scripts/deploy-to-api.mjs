import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(repoRoot, 'dist', 'Smart-Spaza-UI', 'browser');
const target =
  process.env.API_WWWROOT ?? resolve(repoRoot, '..', 'SmartSpazaAPI', 'SmartSpazaAPI', 'wwwroot');

if (!existsSync(source)) {
  console.error(`Build output not found: ${source}\nRun "npm run build" first.`);
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });

console.log(`Smart Spaza UI copied to ${target}`);
