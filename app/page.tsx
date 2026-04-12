export default function LandingPage() {
  return (
    <main className="page-shell">
      <h1>LP（ランディングページ）</h1>
      <p>
        これは、Next.jsのApp Routerを使用して作成されたシンプルなランディングページの例です。
        将来的には、ここから3Dデモページへのリンクを追加する予定です。
      </p>
      <a href="/demo" className="demo-link">
        3Dデモを見る
      </a>
    </main>
  );
}
