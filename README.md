# Hereit!

`Next.js + TypeScript + Three.js` で、LP と 3D デモページを同居させるための雛形です。

## Pages

- `/`: LP
- `/demo`: Three.js ベースの L3DGS viewer scaffold

## Setup

```bash
npm install
npm run dev
```

## Cloudflare Pages

このアプリは現状、SSR や API Route を使っていないため、
Cloudflare Workers ではなく静的 export を Cloudflare Pages へ配信する構成にしています。

無料プランの `Workers 3 MiB` 制限を避けるため、通常のデプロイは次を使ってください。

```bash
npm run build
npm run deploy
```

ローカルで Pages 配信を確認する場合は次です。

```bash
npm run preview:pages
```

## Cloudflare Workers

`@opennextjs/cloudflare` を使う Workers 向けスクリプトは残していますが、
Next.js 16 系ではバンドルが大きくなりやすく、無料プランの `3 MiB` 制限を超えることがあります。

必要な場合のみ次を使ってください。

```bash
npm run build:cf
npm run deploy:cf
```

## Notes

- 現在の `/demo` は外部アセット不要の疑似ポイントクラウドです
- `components/three-scene.tsx` の `createPseudoSplatCloud` を実際の L3DGS ローダーへ置き換える想定です
