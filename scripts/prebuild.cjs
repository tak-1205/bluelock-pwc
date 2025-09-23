// scripts/prebuild.cjs
const { spawnSync } = require('node:child_process');

const isCI = !!(process.env.CI || process.env.VERCEL);
if (isCI) {
  console.log('[prebuild] CI 環境のため前計算はスキップします（コミット済み JSON を利用）');
  process.exit(0);
}

// ローカルだけ前計算
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: true });
  if (r.status !== 0) process.exit(r.status || 1);
};

run('node', ['scripts/build-combos.mjs', 'ALL=1']);
run('node', ['scripts/build-anchor-hints.mjs']);
