import { execSync } from 'node:child_process';

/**
 * Create annotated tags for all "Release x.x.x" commits >= 1.0.0
 */

interface ReleaseCommit {
  hash: string;
  version: string;
  message: string;
}

function execCommand(command: string): string {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error instanceof Error ? error.message : String(error)}`);
  }
}

function getReleaseCommits(): ReleaseCommit[] {
  // Get all commits with "Release x.x.x" format
  const output = execCommand(String.raw`git log --oneline --grep="^Release [0-9]\+\.[0-9]\+\.[0-9]\+$"`);

  if (!output) {
    console.log('No release commits found');
    return [];
  }

  return output
    .split('\n')
    .filter((line) => line.trim()) // Remove empty lines
    .map((line) => {
      const [hash, ...messageParts] = line.split(' ');
      const message = messageParts.join(' ');

      if (!hash) {
        throw new Error(`Invalid commit line: ${line}`);
      }

      // Extract version from message - must be exact format
      const versionMatch = message.match(/^Release ([0-9]+\.[0-9]+\.[0-9]+)$/);
      if (!versionMatch) {
        // Skip non-matching commits (like merge commits)
        console.log(`Skipping non-release commit: ${message}`);
        return null;
      }

      let version = versionMatch[1];

      // Handle the special case: correct 3.8.0 to 5.8.0
      if (version === '3.8.0') {
        console.log(`Correcting version 3.8.0 → 5.8.0 for commit ${hash}`);
        version = '5.8.0';
      }

      return { hash, version, message };
    })
    .filter((commit): commit is ReleaseCommit => commit !== null);
}

function isOnMainBranch(commitHash: string): boolean {
  try {
    const branches = execCommand(`git branch --contains ${commitHash}`);
    return branches.split('\n').some((branch) => branch.trim() === 'main' || branch.trim() === '* main');
  } catch {
    return false;
  }
}

function isVersionOneOrAbove(version: string): boolean {
  const [major = 0] = version.split('.').map(Number);
  return major >= 1;
}

function tagExists(tag: string): boolean {
  try {
    execCommand(`git rev-parse ${tag}`);
    return true;
  } catch {
    return false;
  }
}

function createTag(commit: ReleaseCommit): void {
  const tag = `v${commit.version}`;

  if (tagExists(tag)) {
    console.log(`Tag ${tag} already exists, skipping`);
    return;
  }

  if (!isOnMainBranch(commit.hash)) {
    console.log(`Commit ${commit.hash} is not on main branch, skipping`);
    return;
  }

  if (!isVersionOneOrAbove(commit.version)) {
    console.log(`Version ${commit.version} is below 1.0.0, skipping`);
    return;
  }

  try {
    execCommand(`git tag -a ${tag} ${commit.hash} -m "Release ${commit.version}"`);
    console.log(`✓ Created tag ${tag} for commit ${commit.hash}`);
  } catch (error) {
    console.error(`✗ Failed to create tag ${tag}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function main(): void {
  console.log('Creating release tags...');

  const releaseCommits = getReleaseCommits();
  console.log(`Found ${releaseCommits.length} release commits`);

  if (releaseCommits.length === 0) {
    return;
  }

  // Process commits (newest first from git log output)
  let created = 0;
  let skipped = 0;

  releaseCommits.forEach((commit) => {
    console.log(`\nProcessing: ${commit.hash} - Release ${commit.version}`);

    if (!isVersionOneOrAbove(commit.version)) {
      console.log(`  Skipping v${commit.version} (< 1.0.0)`);
      skipped++;
      return;
    }

    if (!isOnMainBranch(commit.hash)) {
      console.log(`  Skipping ${commit.hash} (not on main branch)`);
      skipped++;
      return;
    }

    if (tagExists(`v${commit.version}`)) {
      console.log(`  Skipping v${commit.version} (tag exists)`);
      skipped++;
      return;
    }

    createTag(commit);
    created++;
  });

  console.log(`\n=== Summary ===`);
  console.log(`Tags created: ${created}`);
  console.log(`Commits skipped: ${skipped}`);
  console.log(`Total processed: ${releaseCommits.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
