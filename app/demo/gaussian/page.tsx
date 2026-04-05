import Link from "next/link";
import { GaussianScene } from "@/components/gaussian-scene";

export default function GaussianDemoPage() {
  return (
    <main className="demo-page">
      <section className="demo-header">
        <div>
          <p className="eyebrow">GAUSSIANSPLATS3D</p>
          <h1>KSPLAT Compare</h1>
          <p className="lead">
            `3sdgs_room.ksplat` を上下反転補正つきで読み込み、まずは固定の室内カメラから中の見え方を確認します。
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
          <GaussianScene />
        </div>
        <aside className="info-card">
          <h2>Config</h2>
          <ul className="note-list">
            <li>`RenderMode.Always`</li>
            <li>`ignoreDevicePixelRatio: true`</li>
            <li>`gpuAcceleratedSort: false`</li>
            <li>`sharedMemoryForWorkers: false`</li>
            <li>シーンは X 軸に 180 度回転</li>
            <li>`WASD` と `Space` / `Shift` で移動</li>
            <li>左ドラッグで向きを変更</li>
            <li>入力は `KSPLAT`</li>
          </ul>
        </aside>
      </section>
    </main>
  );
}
