#!/usr/bin/env node

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import archiver from 'archiver';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

const packageJson = JSON.parse(
  await fs.readFile(path.join(rootDir, 'package.json'), 'utf8')
);

const distDir = path.join(rootDir, 'dist');

const stagingDir = path.join(distDir, packageJson.name);

const outputFile = path.join(
  distDir,
  `${packageJson.name}-${packageJson.version}.mcpb`
);

/**
 * Cleanup old artifacts
 */
await fs.rm(stagingDir, {
  recursive: true,
  force: true,
});

await fs.rm(
  path.join(distDir, 'claude-deepseek-model-proxy'),
  {
    recursive: true,
    force: true,
  }
);

await fs.rm(
  path.join(
    distDir,
    'claude-deepseek-model-proxy-0.1.0.mcpb'
  ),
  {
    force: true,
  }
);

await fs.rm(outputFile, {
  force: true,
});

/**
 * Create staging directories
 */
await fs.mkdir(path.join(stagingDir, 'server'), {
  recursive: true,
});

await fs.mkdir(path.join(stagingDir, 'scripts'), {
  recursive: true,
});

await fs.mkdir(path.join(stagingDir, 'srcs'), {
  recursive: true,
});

/**
 * Copy project files
 */
await copyFile('manifest.json', 'manifest.json');
await copyFile('proxy.mjs', 'proxy.mjs');
await copyFile('README.md', 'README.md');
await copyFile('package.json', 'package.json');
await copyFile('start.sh', 'start.sh');

await copyFile(
  'server/index.mjs',
  'server/index.mjs'
);

await copyFile(
  'scripts/ensure-node.sh',
  'scripts/ensure-node.sh'
);

await copyFile(
  'scripts/install-launch-agent.mjs',
  'scripts/install-launch-agent.mjs'
);

await copyFile(
  'scripts/run-launch-agent.sh',
  'scripts/run-launch-agent.sh'
);

await copyFile(
  'scripts/uninstall-launch-agent.mjs',
  'scripts/uninstall-launch-agent.mjs'
);

await copyFile(
  'srcs/claude-developer-mode.png',
  'srcs/claude-developer-mode.png'
);

/**
 * Create .mcpb archive
 */
await zipDirectory(stagingDir, outputFile);

console.log(`\nBuild complete:\n${outputFile}\n`);

/**
 * Helper: Copy file into staging directory
 */
async function copyFile(from, to) {
  const source = path.join(rootDir, from);
  const destination = path.join(stagingDir, to);

  await fs.copyFile(source, destination);
}

/**
 * Helper: Create ZIP archive
 */
async function zipDirectory(sourceDir, outPath) {
  return new Promise((resolve, reject) => {
    const output = fsSync.createWriteStream(outPath);

    const archive = archiver('zip', {
      zlib: {
        level: 9,
      },
    });

    output.on('close', () => {
      console.log(
        `Archive created (${archive.pointer()} bytes)`
      );
      resolve();
    });

    output.on('error', reject);

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn(err);
      } else {
        reject(err);
      }
    });

    archive.on('error', reject);

    archive.pipe(output);

    /**
     * false = do not nest sourceDir itself,
     * only include its contents
     */
    archive.directory(sourceDir, false);

    archive.finalize();
  });
}