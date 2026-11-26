// Lets Node import the Deno-style Edge Function sources: "npm:pkg@ver" → "pkg"
// (resolved from tests/node_modules).
import { registerHooks } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), '..') + '/').href;
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('npm:')) {
      return next(specifier.slice(4).replace(/(?<=.)@[\d.^~]+$/, ''), { ...context, parentURL: here });
    }
    return next(specifier, context);
  },
});
