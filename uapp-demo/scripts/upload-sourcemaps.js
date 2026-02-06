#!/usr/bin/env node

/**
 * Upload SourceMaps to Sentry (works for h5 and mp-weixin).
 *
 * Environment:
 *   SENTRY_AUTH_TOKEN (required unless .sentryclirc is used)
 *   SENTRY_ORG
 *   SENTRY_PROJECT
 *   SENTRY_RELEASE (optional, fallback to ./sentry.release.js or package.json)
 *   PLATFORM (optional: h5, mp-weixin, android, ios; default: h5)
 *   SENTRY_DIST (optional: overrides dist, default = PLATFORM)
 *   SENTRY_URL_PREFIX (optional)
 *   SENTRY_STRIP_PREFIX (optional)
 *   SENTRY_URL (optional: for self-hosted)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packageJson = require('../package.json');
let release = process.env.SENTRY_RELEASE;
try {
  const releaseFile = require('../sentry.release.js');
  if (!release && releaseFile && releaseFile.SENTRY_RELEASE) {
    release = releaseFile.SENTRY_RELEASE;
  }
} catch (e) {
  // ignore
}
if (!release) {
  release = `${packageJson.name}@${packageJson.version}`;
}

const platform = process.env.PLATFORM || 'h5';
const dist = process.env.SENTRY_DIST || platform;

const sourcemapPaths = {
  h5: './unpackage/dist/build/h5',
  'mp-weixin': './unpackage/dist/dev/mp-weixin'
};

const sourcemapPath = sourcemapPaths[platform];
if (!sourcemapPath) {
  console.error(`❌ Unknown platform: ${platform}`);
  process.exit(1);
}

const absolutePath = path.resolve(__dirname, '..', sourcemapPath);
if (!fs.existsSync(absolutePath)) {
  console.error(`❌ SourceMap path not found: ${absolutePath}`);
  console.error('Please build the project first.');
  process.exit(1);
}

const urlPrefix =
  process.env.SENTRY_URL_PREFIX ||
  (platform === 'mp-weixin' ? '~/appservice' : platform === 'h5' ? '~/assets' : undefined);
const stripPrefix = process.env.SENTRY_STRIP_PREFIX || sourcemapPath;

console.log('📦 Uploading SourceMaps to Sentry...');
console.log(`   Release: ${release}`);
console.log(`   Platform: ${platform}`);
console.log(`   Dist: ${dist}`);
console.log(`   Path: ${sourcemapPath}`);
if (urlPrefix) console.log(`   Url Prefix: ${urlPrefix}`);
if (stripPrefix) console.log(`   Strip Prefix: ${stripPrefix}`);
console.log('');

try {
  console.log('1️⃣ Creating release...');
  execSync(`npx @sentry/cli releases new ${release}`, { stdio: 'inherit', env: process.env });

  console.log('\n2️⃣ Uploading source maps...');
  const cmdParts = [
    'npx @sentry/cli sourcemaps upload',
    `--release ${release}`,
    `--dist ${dist}`,
    urlPrefix ? `--url-prefix "${urlPrefix}"` : '',
    stripPrefix ? `--strip-prefix "${stripPrefix}"` : '',
    '--rewrite',
    sourcemapPath
  ].filter(Boolean);
  execSync(cmdParts.join(' '), { stdio: 'inherit', env: process.env });

  console.log('\n3️⃣ Finalizing release...');
  execSync(`npx @sentry/cli releases finalize ${release}`, { stdio: 'inherit', env: process.env });

  console.log(`\n✅ SourceMaps uploaded successfully for release: ${release}`);
} catch (error) {
  console.error('\n❌ Failed to upload SourceMaps');
  console.error('Error:', error && error.message ? error.message : error);
  process.exit(1);
}
