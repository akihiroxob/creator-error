"use client";

import { useEffect, useState, type DragEvent } from "react";
import {
  SAMPLE_OBJECTS,
  SAMPLE_OBJECT_TRANSFER_TYPE,
  SparkScene,
  type ViewerLoadingState,
} from "@/components/Splat";

export default function SparkDemoPage() {
  const [objectsReady, setObjectsReady] = useState(false);
  const [viewerLoading, setViewerLoading] = useState<ViewerLoadingState>({
    active: true,
    progress: 0,
    stage: "待機中",
    detail: "初期化を開始します",
  });

  const handleDragStart = (event: DragEvent<HTMLButtonElement>, sampleId: string) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(SAMPLE_OBJECT_TRANSFER_TYPE, sampleId);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setObjectsReady(true);
      setViewerLoading((current) => ({
        ...current,
        active: current.active || current.progress < 100,
        progress: Math.max(current.progress, 18),
        stage: current.progress >= 24 ? current.stage : "一覧準備中",
        detail: current.progress >= 24 ? current.detail : "配置可能な Object 一覧を構築しています",
      }));
    }, 120);

    return () => window.clearTimeout(timer);
  }, []);

  const progress = Math.max(viewerLoading.progress, objectsReady ? 18 : 6);
  const overlayActive = !objectsReady || viewerLoading.active;

  return (
    <main className="demo-page">
      {overlayActive ? (
        <div className="loading-overlay" role="status" aria-live="polite">
          <div className="loading-panel">
            <p className="loading-eyebrow">Viewer Loading</p>
            <h2>{progress}%</h2>
            <p className="loading-stage">
              {objectsReady ? viewerLoading.stage : "一覧準備中"}
            </p>
            <p className="loading-detail">
              {objectsReady ? viewerLoading.detail : "配置可能な Object 一覧を構築しています"}
            </p>
            <div className="loading-bar" aria-hidden="true">
              <span style={{ width: `${progress}%` }} />
            </div>
            <div className="loading-meta">
              <span>{objectsReady ? "Object 一覧: ready" : "Object 一覧: loading"}</span>
              <span>{viewerLoading.stage}</span>
            </div>
          </div>
        </div>
      ) : null}
      <header className="viewer-header">
        <div className="viewer-brand">
          <div className="viewer-logo-slot" aria-label="logo placeholder">
            <span>L</span>
          </div>
          <div className="viewer-brand-copy">
            <p className="viewer-brand-eyebrow">Logo Space</p>
            <strong>L3DGS Viewer Lab</strong>
            <span>ロゴやブランド名、プロジェクト識別子を配置できる領域</span>
          </div>
        </div>
        <div className="viewer-header-nav" aria-label="header placeholders">
          <span>Menu Slot A</span>
          <span>Menu Slot B</span>
          <span>Menu Slot C</span>
        </div>
      </header>
      <section className="viewer-layout">
        <aside className="info-card">
          <div className="sidebar-header">
            <p className="sidebar-eyebrow">Object Shelf</p>
            <h1>Sample Objects</h1>
            <p>
              サンプルをドラッグして右側の部屋へドロップすると、その位置に簡易オブジェクトを配置できます。
            </p>
          </div>

          <div className="sample-list">
            {SAMPLE_OBJECTS.map((sample) => (
              <button
                key={sample.id}
                className="sample-card"
                draggable
                onDragStart={(event) => handleDragStart(event, sample.id)}
                type="button"
              >
                <span className="sample-swatch" style={{ background: sample.color }} />
                <span className="sample-meta">
                  <strong>{sample.name}</strong>
                  <span>{sample.description}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="sidebar-note">
            <p>操作</p>
            <ul>
              <li>ドラッグして部屋へドロップ</li>
              <li>配置後も FPS 風移動を継続可能</li>
              <li>色と形で置いた位置を判別可能</li>
            </ul>
          </div>
        </aside>
        <div className="viewer-card">
          <SparkScene onLoadingStateChange={setViewerLoading} />
        </div>
      </section>
    </main>
  );
}
