import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { findUncatalogedVideoFiles } from './liveVideoCatalog.mjs';

const VIDEO_FILE_PATTERN = /\.(mp4|mov|m4v|webm|mkv)$/i;
const downloadDir = process.env.DOWNLOAD_DIR || `${process.env.HOME}/Downloads/live`;

function getLocalVideoFiles(dir) {
  try {
    return readdirSync(dir)
      .filter((name) => VIDEO_FILE_PATTERN.test(name))
      .filter((name) => statSync(join(dir, name)).isFile())
      .sort();
  } catch {
    return [];
  }
}

const files = getLocalVideoFiles(downloadDir);
const uncataloged = findUncatalogedVideoFiles(files);

if (uncataloged.length === 0) {
  process.stdout.write('Live video catalog check passed.\n');
  process.exit(0);
}

process.stderr.write('Error: found local live video files without catalog metadata:\n');
for (const fileName of uncataloged) {
  process.stderr.write(`- ${fileName}\n`);
}
process.stderr.write('Add these entries to scripts/liveVideoCatalog.mjs before rerunning the pipeline.\n');
process.exit(1);
