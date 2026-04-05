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

## Notes

- 現在の `/demo` は外部アセット不要の疑似ポイントクラウドです
- `components/three-scene.tsx` の `createPseudoSplatCloud` を実際の L3DGS ローダーへ置き換える想定です
