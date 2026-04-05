import Link from "next/link";

const highlights = [
  {
    title: "LPとデモを同居",
    description:
      "App Routerでマーケティング導線と実験用ビューアーを同じコードベースで管理できます。"
  },
  {
    title: "L3DGS差し替え前提",
    description:
      "今はThree.jsのサンプルシーンで確認し、あとから実データローダーに置き換えやすい構成です。"
  },
  {
    title: "TypeScript前提",
    description:
      "表示ロジック、ページ構成、今後のAPI追加まで同じ型システムで伸ばせます。"
  }
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">NEXT.JS + THREE.JS + TYPESCRIPT</p>
          <h1>L3DGS向けのWebデモとLPを同じアプリで運用する雛形</h1>
          <p className="lead">
            この雛形は、プロモーション用のランディングページと、Three.jsベースの表示検証ページを
            Next.js内でまとめて管理するための出発点です。
          </p>
          <div className="cta-row">
            <Link className="button button-primary" href="/demo">
              デモを見る
            </Link>
            <a
              className="button button-secondary"
              href="https://nextjs.org/docs/app"
              target="_blank"
              rel="noreferrer"
            >
              App Router Docs
            </a>
          </div>
        </div>
        <div className="hero-panel">
          <div className="metric-card">
            <span>Runtime</span>
            <strong>Next.js App Router</strong>
          </div>
          <div className="metric-card">
            <span>Viewer</span>
            <strong>Three.js Client Scene</strong>
          </div>
          <div className="metric-card">
            <span>Migration Path</span>
            <strong>L3DGS Loader Hook</strong>
          </div>
        </div>
      </section>

      <section className="section-grid">
        {highlights.map((item) => (
          <article className="feature-card" key={item.title}>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </article>
        ))}
      </section>

      <section className="timeline-card">
        <div>
          <p className="eyebrow">HOW TO USE</p>
          <h2>次にやること</h2>
        </div>
        <ol className="step-list">
          <li>まず `/demo` で描画パイプラインとカメラ制御を確認する</li>
          <li>疑似点群生成を実際のL3DGSデータローダーへ差し替える</li>
          <li>LPの文言とCTAをプロダクトに合わせて調整する</li>
        </ol>
      </section>
    </main>
  );
}
