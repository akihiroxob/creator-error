# creator-error

`Next.js + TypeScript + Three.js` で、LP と 3D デモページを同居させるための雛形です。

## Pages

- `/`: LP
- `/demo`: Three.js ベースの L3DGS viewer scaffold

## Setup

```bash
npm install
npm run dev
```

## Cloudflare Workers

Cloudflare Dashboard で `Build command` を `npm run build` のままにすると、
OpenNext 用の成果物が作られず deploy に失敗します。

Cloudflare 用には次を使ってください。

```bash
npm run build:cf
```

Deploy command は次です。

```bash
npm run deploy:cf
```

または 1 コマンドでまとめるなら次でも動きます。

```bash
npm run deploy
```

## Notes

- 現在の `/demo` は外部アセット不要の疑似ポイントクラウドです
- `components/three-scene.tsx` の `createPseudoSplatCloud` を実際の L3DGS ローダーへ置き換える想定です
