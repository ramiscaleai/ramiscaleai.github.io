import { readdir, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { basename, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const allowedAtRoot = new Set(['.git', '.gitignore', '.github', '.githooks', 'README.md', 'dist', 'generate.mjs', 'scripts']);
const forbiddenNames = /^(?:\.env(?:\..*)?|contact-server\.mjs|docker-compose\.ya?ml|Dockerfile(?:\..*)?|nginx\.conf|id_(?:rsa|ed25519)(?:\.pub)?)$/i;
const privateKeyExtension = /\.(?:pem|key|p12|pfx)$/i;
const emailAddress = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const absoluteApi = /https?:\/\/[^\s"'<>`]*\/(?:api|rest)(?:\/|[?#]|$)/i;
const apiHostname = /https?:\/\/api\.[A-Z0-9.-]+/i;
const credential = new RegExp([
  '-----BEGIN (?:OPENSSH |RSA |EC |DSA )?PRIVATE KEY-----',
  'github_pat_[A-Za-z0-9_]{20,}',
  'gh[pousr]_[A-Za-z0-9]{20,}',
  'sk-[A-Za-z0-9_-]{20,}',
  'AKIA[0-9A-Z]{16}',
  'AIza[0-9A-Za-z_-]{35}',
  'xox[baprs]-[A-Za-z0-9-]{20,}'
].join('|'));
const failures = new Set();

function check(name, bytes, location) {
  const first = name.split('/')[0];
  if (!allowedAtRoot.has(first)) failures.add(`${location}:${name}: unexpected top-level item`);
  if (forbiddenNames.test(basename(name)) || privateKeyExtension.test(name)) failures.add(`${location}:${name}: forbidden filename`);
  const binaryAsset = /\.(?:png|jpe?g|webp|gif|ico)$/i.test(name);
  const data = bytes.toString(binaryAsset ? 'latin1' : 'utf8');
  if (emailAddress.test(data)) failures.add(`${location}:${name}: email address`);
  if (absoluteApi.test(data) || apiHostname.test(data)) failures.add(`${location}:${name}: absolute API location`);
  if (credential.test(data)) failures.add(`${location}:${name}: credential-like string`);
  if (data.includes('street' + 'Address')) failures.add(`${location}:${name}: street address in metadata`);
}

async function scanTree(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    const name = relative(root, path);
    if (name === '.git') continue;
    if (entry.isDirectory()) {
      if (!allowedAtRoot.has(name.split('/')[0])) failures.add(`worktree:${name}: unexpected top-level item`);
      await scanTree(path);
    } else if (entry.isFile()) {
      check(name, await readFile(path), 'worktree');
    } else {
      failures.add(`worktree:${name}: unsupported file type`);
    }
  }
}

function git(args) {
  return execFileSync('git', args, { cwd: root, maxBuffer: 32 * 1024 * 1024 });
}

function checkGitIdentity() {
  for (const kind of ['AUTHOR', 'COMMITTER']) {
    const ident = git(['var', `GIT_${kind}_IDENT`]).toString('utf8');
    const address = ident.match(/<([^>]+)>/)?.[1] || '';
    if (!address.endsWith('@users.noreply.github.com')) {
      failures.add(`Git ${kind.toLowerCase()} identity is not a GitHub no-reply address`);
    }
  }
  const history = git(['log', '--all', '--format=%ae%n%ce']).toString('utf8');
  for (const address of history.split('\n').filter(Boolean)) {
    if (!address.endsWith('@users.noreply.github.com')) {
      failures.add('Git history contains a non-private commit email');
    }
  }
}

function scanGitBlobs() {
  const seen = new Set();
  const index = git(['ls-files', '--stage', '-z']).toString('utf8');
  for (const record of index.split('\0')) {
    if (!record) continue;
    const match = record.match(/^\d+ ([0-9a-f]+) \d+\t(.+)$/s);
    if (!match) throw new Error('Unexpected Git index record');
    const [, oid, name] = match;
    check(name, git(['cat-file', 'blob', oid]), 'index');
    seen.add(`${oid}:${name}`);
  }
  const history = git(['rev-list', '--objects', '--all']).toString('utf8');
  for (const line of history.split('\n')) {
    if (!line) continue;
    const oid = line.slice(0, 40);
    const name = line.slice(41);
    if (!name || seen.has(`${oid}:${name}`)) continue;
    if (git(['cat-file', '-t', oid]).toString('utf8').trim() !== 'blob') continue;
    check(name, git(['cat-file', 'blob', oid]), 'history');
    seen.add(`${oid}:${name}`);
  }
}

await scanTree(root);
checkGitIdentity();
scanGitBlobs();
if (failures.size) {
  console.error([...failures].sort().join('\n'));
  process.exitCode = 1;
} else {
  console.log('Public worktree, index, and history scan passed.');
}
