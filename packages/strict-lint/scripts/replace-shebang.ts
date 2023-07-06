#!/usr/bin/env node --loader @esbuild-kit/esm-loader

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootPath = path.join(__dirname, '..');
const binPath = 'dist/bin';
const directoryPath = path.join(rootPath, binPath);

const fileNames = fs
  .readdirSync(directoryPath)
  .filter(file => file.endsWith('.js'));

for (const fileName of fileNames) {
  const filePath = path.join(directoryPath, fileName);
  const data = fs.readFileSync(filePath, { encoding: 'utf8' });

  const lines = data.split('\n');
  if (lines.length > 0 && lines[0]?.startsWith('#!')) {
    lines[0] = '#!/usr/bin/env node'; // replace shebang
    fs.writeFileSync(filePath, lines.join('\n'), { encoding: 'utf8' });
  }
  const relativeFilePath = path.relative(rootPath, filePath);
  console.info(`Replaced shebang in ${relativeFilePath}`);
}
