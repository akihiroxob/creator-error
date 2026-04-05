import Link from "next/link";

const demos = [
  {
    href: "/demo/spark",
    title: "Spark Light",
    description: "Spark で生の PLY を軽量設定で描画して、操作感を確認します。"
  },
  {
    href: "/demo/gaussian",
    title: "Gaussian KSPLAT",
    description: "GaussianSplats3D で KSPLAT を描画して、推奨フォーマット時の体感を比較します。"
  }
];

export default function DemoIndexPage() {
  return (
    <main className="demo-page">
      <section className="demo-header">
        <div>
          <p className="eyebrow">VIEWER COMPARISON</p>
          <h1>Spark と GaussianSplats3D を分けて比較</h1>
          <p className="lead">
            同じルームアセットを、Spark の軽量設定と GaussianSplats3D の KSPLAT 表示で別URL比較できるようにしています。
          </p>
        </div>
        <div className="cta-row">
          <Link className="button button-secondary" href="/">
            LPへ戻る
          </Link>
        </div>
      </section>

      <section className="section-grid">
        {demos.map((demo) => (
          <article className="feature-card" key={demo.href}>
            <h2>{demo.title}</h2>
            <p>{demo.description}</p>
            <div className="cta-row">
              <Link className="button button-primary" href={demo.href}>
                開く
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
