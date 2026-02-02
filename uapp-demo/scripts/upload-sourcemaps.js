#!/usr/bin/env node

/**
 * 上传 SourceMaps 到 Sentry
 * 
 * 使用方法：
 * 1. 设置环境变量：
 *    export SENTRY_AUTH_TOKEN=your_token
 *    export SENTRY_ORG=your-org
 *    export SENTRY_PROJECT=your-project
 * 
 * 2. 或创建 .sentryclirc 文件（推荐）
 * 
 * 3. 运行：npm run upload:sourcemaps
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 读取版本信息
const packageJson = require('../package.json');
const release = `${packageJson.name}@${packageJson.version}`;

// 获取平台和环境
const platform = process.env.PLATFORM || 'android'; // android, ios, h5, mp-weixin
const environment = process.env.ENVIRONMENT || 'production';

// 根据平台确定 sourcemap 路径
const sourcemapPaths = {
  'android': './unpackage/dist/dev/app-plus',
  'ios': './unpackage/dist/dev/app-plus',
  'h5': './unpackage/dist/build/h5',
  'mp-weixin': './unpackage/dist/dev/mp-weixin',
};

const sourcemapPath = sourcemapPaths[platform];

if (!sourcemapPath) {
  console.error(`❌ Unknown platform: ${platform}`);
  process.exit(1);
}

// 检查路径是否存在
if (!fs.existsSync(sourcemapPath)) {
  console.error(`❌ SourceMap path not found: ${sourcemapPath}`);
  console.error('Please build the project first.');
  process.exit(1);
}

console.log('📦 Uploading SourceMaps to Sentry...');
console.log(`   Release: ${release}`);
console.log(`   Platform: ${platform}`);
console.log(`   Environment: ${environment}`);
console.log(`   Path: ${sourcemapPath}`);
console.log('');

try {
  // 1. 创建 Release
  console.log('1️⃣ Creating release...');
  execSync(`npx @sentry/cli releases new ${release}`, { 
    stdio: 'inherit',
    env: process.env 
  });

  // 2. 上传 SourceMaps（新版 CLI 命令格式）
  console.log('\n2️⃣ Uploading source maps...');
  execSync(
    `npx @sentry/cli sourcemaps upload ` +
    `--release ${release} ` +
    `--dist ${platform} ` +
    `${sourcemapPath}`,
    { 
      stdio: 'inherit',
      env: process.env 
    }
  );

  // 3. 设置 Release 的部署信息
  console.log('\n3️⃣ Setting deploy info...');
  execSync(
    `npx @sentry/cli releases deploys ${release} new -e ${environment}`,
    { 
      stdio: 'inherit',
      env: process.env 
    }
  );

  // 4. Finalize Release
  console.log('\n4️⃣ Finalizing release...');
  execSync(`npx @sentry/cli releases finalize ${release}`, { 
    stdio: 'inherit',
    env: process.env 
  });

  console.log(`\n✅ SourceMaps uploaded successfully for release: ${release}`);
  console.log(`   View in Sentry: https://sentry.io/organizations/YOUR_ORG/releases/${release}/\n`);

} catch (error) {
  console.error('\n❌ Failed to upload SourceMaps');
  console.error('Error:', error.message);
  console.log('\nTroubleshooting:');
  console.log('1. Check if SENTRY_AUTH_TOKEN is set');
  console.log('2. Verify .sentryclirc configuration');
  console.log('3. Ensure you have proper permissions');
  process.exit(1);
}
