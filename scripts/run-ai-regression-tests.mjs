import { mkdir } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { build } from 'esbuild'

const outdir = resolve('dist/ai-regression')
const outfile = resolve(outdir, 'regression.test.mjs')

await mkdir(outdir, { recursive: true })

await build({
  entryPoints: [resolve('tests/ai/regression.test.ts')],
  outfile,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  logLevel: 'silent',
})

const result = spawnSync(process.execPath, [outfile], {
  stdio: 'inherit',
})

process.exit(result.status ?? 1)
