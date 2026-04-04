# 0xGarfield Home

个人主页的独立站点工程。这个目录可以直接作为新仓库根目录使用。

## 目录

- `config/site.json`: 全站公共链接、域名和资源版本
- `src/pages/`: 页面模板源文件
- `public/`: 样式、脚本、图片和静态头配置
- `scripts/build.mjs`: 生成独立部署产物到 `dist/`
- `scripts/sync-current-repo.mjs`: 把产物回同步到当前仓库的 `home-site/`

## 更新内容

- 改页面文案或结构：编辑 `src/pages/*.html`
- 改全站公共链接、Talktalk 跳转、社交资料：编辑 `config/site.json`
- 改交互功能：编辑 `public/script.js`
- 改视觉样式：编辑 `public/styles.css`

## 本地命令

```bash
cd 0xgarfield-home
npm run build
npm run sync:legacy
```

`npm run sync:legacy` 用于切换新仓库前的兼容阶段。它会先构建，再把结果同步回当前仓库的 `home-site/`，保证现有上线流程不停。

## 低停机切换建议

1. 在这个目录基础上创建新仓库。
2. 先把新仓库部署到临时域名或预览环境。
3. 验证 `/`、`/index-zh`、`/evidence`、`/evidence-zh`、`/404`。
4. DNS 或托管项目切到新仓库。
5. 切换完成前，继续用 `npm run sync:legacy` 同步当前仓库的 `home-site/`。
