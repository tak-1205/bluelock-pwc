// node scripts/audit-combos.mjs
import fs from 'node:fs';
import path from 'node:path';
import { canonicalRootId } from '../src/utils/ids.js';


const dir = path.resolve('./public/combos');
let bad = 0;
for (const file of fs.readdirSync(dir)) {
if (!file.endsWith('.json')) continue;
const p = path.join(dir, file);
const arr = JSON.parse(fs.readFileSync(p, 'utf8'));
arr.forEach((row, i) => {
const roots = row.ids.map(canonicalRootId);
if (new Set(roots).size !== roots.length) {
bad++;
console.error(`[DUP ROOT] ${file} #${i} key=${row.key} ids=${row.ids.join('|')} roots=${roots.join('|')}`);
}
});
}
if (bad) {
console.error(`\nNG: ${bad}件のroot重複を検出しました`);
process.exit(1);
}
console.log('OK: root重複は検出されませんでした');