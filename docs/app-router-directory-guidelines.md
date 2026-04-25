# Next.js App Router ディレクトリ構成ガイドライン

このドキュメントは、本リポジトリで合意した App Router の責務分離ルールを明文化したものです。

## 方針

- `app/` はルーティングとページの入口に限定する
- ページ固有のコンポーネントは `app/**/_components/` に配置する
- 機能単位で再利用される UI / hooks / schema / type は `features/{feature}/` に配置する
- アプリ全体で使う汎用 UI は `components/ui/` に配置する
- レイアウト系の共通コンポーネントは `components/layout/` に配置する
- DBアクセス、Repository、UseCase、外部 API、認証・権限などサーバー専用処理は `server/` に配置する
- 業務ルールや Entity / ValueObject / Repository interface がある場合は `domain/` に配置する
- `server/` 配下のファイルには、必要に応じて `import "server-only";` を追加する

## 目標構成

```txt
app/
  ...
    page.tsx
    layout.tsx
    actions.ts
    _components/

features/
  {feature}/
    components/
    hooks/
    schemas/
    types.ts

components/
  ui/
  layout/

server/
  db/
  repositories/
  usecases/
  services/

domain/
  {feature}/
```

## 運用メモ

- ページ専用実装を `features/` に混在させない（再利用前提のものだけを `features/` へ）
- `app/` から `server/` を直接呼ぶ場合は責務を意識し、必要なら `usecases/` を経由する
- 新規機能追加時は、まず `features/{feature}` の責務を定義してから配置先を決める