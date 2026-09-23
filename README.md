# RaceDocs

**English** | [简体中文](README_zh-CN.md)

RaceDocs is a bilingual manual library for Chinese-speaking sim racers. It turns vehicle manuals into web-friendly references that are easier to find, read, and compare in Chinese and English.

Read online: [racedocs.eeracing.com](https://racedocs.eeracing.com)

## Features

- Search manuals by title, brand, vehicle class, or sim platform, and narrow the catalog with filters.
- Switch between Chinese and English on a manual page and jump to sections from the table of contents. Missing translations are clearly marked.
- Read manuals with images and tables on desktop or mobile.

## Local development

RaceDocs is a static site built with Astro. Use Node.js 24 (`.nvmrc` specifies 24.21.0) and pnpm 11 (`package.json` specifies 11.26.0).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL shown in the terminal. Before submitting changes, run:

```sh
pnpm test
pnpm build
```

Use `pnpm preview` to inspect the production build. The output is written to `dist/`. CI runs the same tests and build.

## Add or edit a manual

Manuals live in [`src/data/manuals/`](src/data/manuals/), one `.yml` file per manual. Existing files are useful references. This small example is a starting point:

```yaml
slug: example-car
published: false
titleZh: 示例赛车用户手册
contentType: vehicle-manual
brand: Example Motors
vehicleClass: GT3
platform: iRacing
discipline: sports-car
source:
  type: synthetic
  title: Example source
  notice: Describe the source and usage rights here
sections:
  - id: introduction
    level: 2
    titleZh: 简介
    titleEn: Introduction
    bodyZh: |-
      在这里编写 Markdown 正文。
    bodyEn: |-
      Write Markdown content here.
```

Save it as `src/data/manuals/example-car.yml`, then replace the placeholders with real content. `source.type` can be `official` or `synthetic`. Optional `revision` and `publishedAt` fields record the source version and publication date. See [`manual-schema.ts`](src/lib/manual-schema.ts) for the complete field definitions and allowed category values.

Content rules:

1. `slug` must match the filename and contain only lowercase ASCII letters, digits, and hyphens. Section IDs follow the same format and must be unique within a manual.
2. Each manual needs at least one section. `level` must be `2` or `3`, and a level 3 section must follow a level 2 section.
3. `titleZh` is required for the manual; `titleEn` is optional. Each section needs a title or body in at least one language. The reader shows a notice when the other language's body is missing.
4. Put images in `src/data/manuals/assets/{slug}/` and reference them in `cover` or Markdown as `./assets/{slug}/filename.png`. PNG, JPG, WebP, and SVG are supported. Every image must exist, belong to that manual, and be referenced by its content.
5. Run `pnpm test` and `pnpm build` after editing. Once the content, source, and image rights are ready, set `published: true` and provide a `cover`. Unpublished manuals can be viewed at `/manuals/{slug}/` during development but are excluded from production builds.

## Project structure

| Path | Purpose |
| --- | --- |
| `src/data/manuals/` | Manual YAML files and images |
| `src/lib/manual-schema.ts` | Manual field and section validation |
| `src/pages/` | Catalog, manual, and other pages |
| `tests/` | Content inventory, schema, and Markdown checks |
| `.github/workflows/ci.yml` | CI tests and build |

Found a translation error, a version difference, or another issue? Share it in the [GitHub repository](https://github.com/eeracing/racedocs).

## Independence and licensing

RaceDocs is an independent project. It is not affiliated with, endorsed by, or partnered with the racing brands, vehicle manufacturers, simulation platforms, or other rights holders mentioned in the manuals. Their names, logos, and trademarks belong to their respective owners.

The project source code is licensed under the [MIT License](LICENSE). Manual text, images, and other media do not automatically receive the same license; their rights and terms of use are governed by their respective sources and rights holders.
