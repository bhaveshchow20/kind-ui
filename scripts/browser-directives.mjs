import { relative, resolve } from "node:path";

// Use only for browser application fixtures. The packed entry and Next build
// independently verify RSC boundaries; this must never be applied to that build.
const seen = new Set();
export function browserDirectives(root, clientModules = []) {
  const fixtures = new Set(clientModules.map((id) => resolve(id)));
  let duplicates = 0;
  return {
    onwarn(warning, defaultHandler) {
      const id = warning.id && relative(root, warning.id).replaceAll("\\", "/");
      const known =
        id &&
        (fixtures.has(resolve(warning.id)) ||
          /^packages\/charts\/dist\/.*\.js$/.test(id) ||
          /(?:^|\/)node_modules\/(?:framer-motion\/dist\/(?:es|esm)|@kind-ui\/charts\/dist)\/.*\.m?js$/.test(
            id,
          ));
      if (
        warning.code !== "MODULE_LEVEL_DIRECTIVE" ||
        !warning.message.includes('directive "use client"') ||
        !known
      ) {
        defaultHandler(warning);
        return;
      }
      const key = resolve(warning.id);
      if (seen.has(key)) duplicates++;
      else {
        seen.add(key);
        console.warn(
          `[browser directives] ${id}: use client is bundled into a client-only app; package/Next boundary gates remain separate.`,
        );
      }
    },
    plugin: {
      name: "browser-directive-summary",
      buildEnd() {
        if (duplicates)
          console.warn(
            `[browser directives] ${duplicates} repeated known module diagnostics deduplicated in this build.`,
          );
      },
    },
  };
}
