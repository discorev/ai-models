import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFile, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const root = new URL('../', import.meta.url);

async function fixture(t, mutate) {
  const dir = await mkdtemp(join(tmpdir(), 'native-capabilities-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(join(dir, 'scripts'));
  for (const file of ['models.json', 'codex_client_models.json', 'native-capabilities-evidence.json', 'scripts/validate-native-capabilities.mjs']) {
    await copyFile(new URL(file, root), join(dir, file));
  }
  const models = JSON.parse(await readFile(join(dir, 'models.json'), 'utf8'));
  mutate?.(models);
  await writeFile(join(dir, 'models.json'), JSON.stringify(models));
  return () => execFileSync(process.execPath, [join(dir, 'scripts/validate-native-capabilities.mjs')], { encoding: 'utf8', stdio: 'pipe' });
}

test('validates the curated catalog', async (t) => {
  const run = await fixture(t);
  assert.match(run(), /Validated \d+ native web-search annotations/);
});

test('rejects non-boolean declarations', async (t) => {
  const run = await fixture(t, (models) => {
    models.claude.find((model) => model.id === 'claude-opus-5').native_capabilities.web_search = 'true';
  });
  assert.throws(run, /web_search must be boolean/);
});

test('rejects contradicting exact Codex evidence', async (t) => {
  const run = await fixture(t, (models) => {
    models['codex-free'].find((model) => model.id === 'gpt-5.5').native_capabilities.web_search = false;
  });
  assert.throws(run, /does not match Codex client metadata/);
});

for (const value of [true, false]) {
  test(`rejects unsupported assertions for an unknown model (${value})`, async (t) => {
    const run = await fixture(t, (models) => {
      models.claude.push({ id: 'unverified-test-model', native_capabilities: { web_search: value } });
    });
    assert.throws(run, /must match exact documented model evidence or remain unknown/);
  });
}

test('does not borrow evidence from another provider', async (t) => {
  const run = await fixture(t, (models) => {
    models.xai.push({ id: 'claude-opus-5', native_capabilities: { web_search: true } });
  });
  assert.throws(run, /must match exact documented model evidence or remain unknown/);
});

test('leaves unverified model IDs unknown', async (t) => {
  const run = await fixture(t, (models) => {
    models.claude.push({ id: 'unverified-test-model' });
  });
  assert.match(run(), /Validated \d+ native web-search annotations/);
});
