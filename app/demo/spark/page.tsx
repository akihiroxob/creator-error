import Link from "next/link";
import { SparkScene } from "@/components/spark-scene";

export default function SparkDemoPage() {
  return (
    <main className="demo-page">
      <section className="demo-header">
        <div>
          <p className="eyebrow">SPARK</p>
          <h1>PLY Direct Load</h1>
          <p className="lead">
            生の `3sdgs_room.ply` を Spark に直接読ませ、解像度とレンダリング負荷を抑えた構成です。
          </p>
        </div>
        <div className="cta-row">
          <Link className="button button-secondary" href="/demo">
            比較一覧へ
          </Link>
        </div>
      </section>

      <section className="viewer-layout">
        <div className="viewer-card">
          <SparkScene />
        </div>
        <aside className="info-card">
          <h2>Config</h2>
          <ul className="note-list">
            <li>`antialias: false`</li>
            <li>`renderer.setPixelRatio(1)`</li>
            <li>OrbitControls の変更時だけ再描画</li>
            <li>入力は生の `PLY`</li>
          </ul>
        </aside>
      </section>
    </main>
  );
}
