# RaceDocs

**简体中文** | [English](README.md)

RaceDocs 是面向中文模拟赛车玩家的双语手册资料库。它将车辆手册整理为适合网页阅读的内容，方便查找、阅读和中英文对照。

在线阅读：[racedocs.eeracing.com](https://racedocs.eeracing.com)

## 可以做什么

- 按标题、品牌、车辆组别或模拟平台搜索手册，并按品牌、组别等条件筛选。
- 在手册页面切换中文和英文，通过章节目录快速定位内容。尚未翻译的正文会显示提示。
- 在手机和电脑上阅读包含图片、表格的手册。

## 本地开发

项目使用 Astro 构建静态网站。需要 Node.js 24（仓库的 `.nvmrc` 为 24.21.0）和 pnpm 11（`package.json` 指定 11.26.0）。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

启动后按终端提示打开本地地址。提交修改前运行：

```sh
pnpm test
pnpm build
```

可以用 `pnpm preview` 预览生产构建。构建产物位于 `dist/`；CI 也会执行测试和构建。

## 添加或修改手册

手册保存在 [`src/data/manuals/`](src/data/manuals/)，每本对应一个 `.yml` 文件。建议先参考现有文件；下面是可用于起稿的最小示例：

```yaml
slug: example-car
published: false
titleZh: 示例赛车用户手册
contentType: vehicle-manual
brand: 示例品牌
vehicleClass: GT3
platform: iRacing
discipline: sports-car
source:
  type: synthetic
  title: 示例来源
  notice: 请填写实际来源及内容使用说明
sections:
  - id: introduction
    level: 2
    titleZh: 简介
    bodyZh: |-
      在这里编写支持 Markdown 的正文。
```

将其保存为 `src/data/manuals/example-car.yml`，再按实际内容填写字段。`source.type` 可为 `official` 或 `synthetic`；来源版本和发布日期可分别填在可选的 `revision`、`publishedAt` 字段中。分类等字段的完整取值见 [`manual-schema.ts`](src/lib/manual-schema.ts)。

内容维护时注意：

1. `slug` 必须与文件名一致，只能使用小写英文字母、数字和连字符。章节 `id` 也遵循此格式，且在同一本手册内不能重复。
2. 每本手册至少有一个章节。`level` 只能是 `2` 或 `3`，首个三级章节之前必须有二级章节。
3. 手册的 `titleZh` 必填，`titleEn` 可选。章节至少提供一种语言的标题或正文；缺少另一语言的正文时，阅读页会显示未翻译提示。
4. 图片放在 `src/data/manuals/assets/{slug}/`，在 `cover` 和 Markdown 正文中以 `./assets/{slug}/文件名.png` 的形式引用。支持 PNG、JPG、WebP 和 SVG；图片必须存在、属于本手册，且被内容引用。
5. 编辑完成后运行 `pnpm test` 和 `pnpm build`。确认内容、来源与图片可使用后，设置 `published: true` 并提供 `cover`。未发布手册可在开发环境通过 `/manuals/{slug}/` 查看，不会进入生产构建。

## 项目结构

| 路径 | 用途 |
| --- | --- |
| `src/data/manuals/` | 手册 YAML 和图片资源 |
| `src/lib/manual-schema.ts` | 手册字段与章节校验 |
| `src/pages/` | 目录、手册和其他页面 |
| `tests/` | 内容资源、结构和 Markdown 的自动验证 |
| `.github/workflows/ci.yml` | CI 测试与构建 |

发现翻译错误、版本差异或其他问题，可以在 [GitHub 仓库](https://github.com/eeracing/racedocs)提交反馈。

## 声明与许可

RaceDocs 是独立项目，与手册中提及的赛车品牌、汽车制造商、模拟平台及其他权利人没有隶属、认可或合作关系。相关名称、标识和商标归各自权利人所有。

项目源代码使用 [MIT License](LICENSE)。手册文字、图片和其他媒体内容不因源代码采用 MIT License 而自动获得相同授权；其权利与使用条件以各自来源和权利人的规定为准。
