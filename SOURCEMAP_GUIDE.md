# SourceMap 使用说明

## 配置 Sentry 认证

### 方式 1：使用配置文件（推荐）

1. 复制示例配置文件：
```bash
cp .sentryclirc.example .sentryclirc
```

2. 编辑 `.sentryclirc` 填入你的信息：
```ini
[auth]
token=YOUR_SENTRY_AUTH_TOKEN

[defaults]
org=your-org-slug
project=your-project-slug
url=https://sentry.io/
```

3. 获取 Auth Token：
   - 登录 Sentry
   - Settings → Account → API → Auth Tokens
   - Create New Token
   - 需要的权限：`project:releases`, `project:write`

### 方式 2：使用环境变量

```bash
export SENTRY_AUTH_TOKEN=your_token
export SENTRY_ORG=your-org
export SENTRY_PROJECT=your-project
```

## 使用流程

### 1. 构建项目（生成 SourceMap）

```bash
# H5
uapp run buid:h5

# 微信小程序
uapp run dev:mp-weixin --open
```

构建完成后，会在 `unpackage/dist/` 目录生成 `.map` 文件。

### 2. 上传 SourceMap 到 Sentry

```bash
# H5 平台
npm run upload:sourcemaps:h5

# 微信小程序
npm run upload:sourcemaps:mp-weixin
```

### 3. 验证上传

1. 触发一个错误
2. 在 Sentry 中查看 Issue
3. 检查堆栈是否显示原始代码位置

**之前**（没有 SourceMap）：
```
at Proxy.onLaunch (app-service.js:5516:9)
```

**之后**（有 SourceMap）：
```
at App.vue:32:5
  in onLaunch()
```

## 自动化

### 构建并上传（一步完成）

创建自动化脚本：

```bash
# 构建并上传 Android
npm run build:app-android && npm run upload:sourcemaps:android
```

### CI/CD 集成

在 GitHub Actions 中：

```yaml
- name: Upload SourceMaps
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: your-org
    SENTRY_PROJECT: your-project
  run: npm run upload:sourcemaps:android
```

## 注意事项

1. **不要提交 `.sentryclirc` 到 Git**
   - 已添加到 `.gitignore`

2. **Release 版本号**
   - 确保 `App.vue` 中的 `release` 与 `package.json` 的 `version` 一致
   - 当前版本：`uappx@1.0.0`

3. **Platform 匹配**
   - 上传时的 `--dist` 参数需要与代码中的 `dist` 配置一致
   - 当前使用 `uni.getSystemInfoSync().platform`

## 故障排除

### 上传失败

检查：
1. Auth Token 是否正确
2. Organization 和 Project slug 是否正确
3. 是否有足够的权限

### 堆栈仍然无法还原

检查：
1. Release 版本号是否匹配
2. Dist 参数是否匹配
3. SourceMap 文件是否正确上传

在 Sentry 中验证：
- Releases → 选择版本 → Source Maps
- 应该能看到上传的文件列表
