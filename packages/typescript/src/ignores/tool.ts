/**
 * Ignores for content that a named developer tool owns and generates. This list is separate from
 * `commonIgnores`, which collects build output and files no ESLint config parses: those are facts
 * about the JavaScript toolchain, while these are facts about which tools a repo happens to run.
 */
export const toolIgnores: string[] = [
  '**/.claude/**',
  // rdy records a hash of every compiled kit bundle, and the manifest is where those hashes live, so
  // an autofix rewriting either one makes the kit report as stale. Both entries are scoped rather
  // than covering `.readyup/` outright, because the directory also holds the authored TypeScript of
  // the kit declarations and their predicates, which stays linted.
  '**/.readyup/**/*.js',
  '**/.readyup/manifest.json',
  '**/.rovo/**',
  '**/.rovodev/**',
];
