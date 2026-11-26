const { execSync } = require('child_process');
const crypto = require('crypto');

/**
 * The exact commit this build was made from — stamped into every page
 * (<meta name="build-commit">, and Settings shows it) so anyone can check that
 * the live site is the published code (scripts/verify-live.mjs does it
 * automatically). Order: an explicit BUILD_COMMIT, the hosting provider's
 * commit, then the local git checkout ("-dirty" when it has uncommitted
 * changes, so a hand-made build never passes for a published commit).
 */
function buildCommit() {
  if (process.env.BUILD_COMMIT) return process.env.BUILD_COMMIT;
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA;
  try {
    const run = (cmd) => execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    const sha = run('git rev-parse HEAD');
    return run('git status --porcelain') ? `${sha}-dirty` : sha;
  } catch {
    return 'unknown';
  }
}
const commit = buildCommit();

/**
 * Module ids that do not depend on WHERE the project folder is.
 *
 * webpack numbers every module with a hash of its identifier. For most modules
 * that identifier is relative to the project, but Next's app-router entry
 * modules carry the project's ABSOLUTE path inside it — so the same commit
 * built in /vercel/path0, in a GitHub runner and on a laptop gave different
 * script files, and the live site could never be matched against a rebuild.
 * This plugin does webpack's own job (deterministic ids) with the project path
 * scrubbed out of the identifier first. Ids are arbitrary labels: only their
 * uniqueness matters to the running app.
 */
class PathFreeModuleIds {
  constructor(root) {
    // every spelling the path takes inside identifiers: raw, URL-encoded, JSON-in-URL
    const forms = new Set([root, encodeURIComponent(root), encodeURI(root), JSON.stringify(root).slice(1, -1)]);
    this.forms = [...forms].sort((a, b) => b.length - a.length);
  }
  scrub(id) {
    let out = id;
    for (const f of this.forms) out = out.split(f).join('<root>');
    return out;
  }
  apply(compiler) {
    compiler.hooks.compilation.tap('PathFreeModuleIds', (compilation) => {
      compilation.hooks.moduleIds.tap('PathFreeModuleIds', () => {
        const graph = compilation.chunkGraph;
        const used = new Set();
        const todo = [];
        for (const m of compilation.modules) {
          if (!m.needId) continue;
          const id = graph.getModuleId(m);
          if (id !== null) used.add(String(id));
          else if (graph.getNumberOfModuleChunks(m) !== 0) todo.push([this.scrub(m.identifier()), m]);
        }
        todo.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
        let range = 1000;
        while (range < (todo.length + used.size) * 20) range *= 10;
        for (const [name, m] of todo) {
          let id; let salt = 0;
          do {
            const h = crypto.createHash('sha256').update(name + (salt ? `#${salt}` : '')).digest();
            id = h.readUInt32BE(0) % range;
            salt++;
          } while (used.has(String(id)));
          used.add(String(id));
          graph.setModuleId(m, id);
        }
      });
    });
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export — remove these 3 lines if deploying to a Node.js host
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BUILD_COMMIT: commit },
  // Same source + same settings → the same files (the default build id is
  // random), which is what makes the live site checkable. One known wrinkle:
  // the order of the entries in webpack's small runtime file varies between
  // builds — scripts/verify-live.mjs compares that one table order-insensitively.
  generateBuildId: async () => (commit === 'unknown' ? null : commit),
  webpack: (config, { dev, isServer, dir }) => {
    if (!dev && !isServer) {
      config.optimization.moduleIds = false; // PathFreeModuleIds assigns them
      config.plugins.push(new PathFreeModuleIds(dir));
      // Name each script after a hash of its ACTUAL content. (By default the
      // hash in the file name is computed from webpack's internal module
      // data, which again includes the absolute path — identical files got
      // different names in different folders.)
      config.optimization.realContentHash = true;
      for (const key of ['filename', 'chunkFilename']) {
        if (typeof config.output[key] === 'string') {
          config.output[key] = config.output[key].replace('[chunkhash]', '[contenthash]');
        }
      }
    }
    return config;
  },
};

module.exports = nextConfig;
