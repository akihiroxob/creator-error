"use client";

import { useEffect, useState, type DragEvent } from "react";
import {
  ASSET_ITEMS,
  ASSET_ITEM_TRANSFER_TYPE,
  SparkScene,
  type ViewerLoadingState,
} from "@/components/Splat";

export default function SparkDemoPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [objectsReady, setObjectsReady] = useState(false);
  const [viewerLoading, setViewerLoading] = useState<ViewerLoadingState>({
    active: true,
    progress: 0,
    stage: "待機中",
    detail: "初期化を開始します",
  });

  const handleDragStart = (event: DragEvent<HTMLButtonElement>, assetId: string) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(ASSET_ITEM_TRANSFER_TYPE, assetId);
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
        <div className="viewer-header-nav" aria-label="header menu">
          <button
            className="hamburger-button"
            type="button"
            aria-expanded={isMenuOpen}
            aria-controls="asset-menu"
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>
      <section className="viewer-stage">
        <div className="viewer-card viewer-card-fullscreen">
          <SparkScene onLoadingStateChange={setViewerLoading} />
        </div>
        <aside
          id="asset-menu"
          className={`info-card info-card-floating${isMenuOpen ? " is-open" : ""}`}
        >
          <div className="sidebar-header">
            <p className="sidebar-eyebrow">Asset Library</p>
            <h1>Real Assets</h1>
            <p>
              ハンバーガーメニューから実アセット一覧を開き、画像をドラッグすると Canvas 上へ板ポリとして配置します。
            </p>
          </div>

          <div className="sample-list">
            {ASSET_ITEMS.map((asset) => (
              <button
                key={asset.id}
                className="sample-card"
                draggable
                onDragStart={(event) => handleDragStart(event, asset.id)}
                type="button"
              >
                <span
                  className="asset-thumb"
                  style={{ backgroundImage: `url(${asset.previewSrc})` }}
                />
                <span className="sample-meta">
                  <strong>{asset.name}</strong>
                  <span>{asset.type === "glb" ? "3D model" : asset.type}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="sidebar-note">
            <p>操作</p>
            <ul>
              <li>右上のハンバーガーで一覧を開閉</li>
              <li>GLB をドラッグして Canvas へドロップ</li>
              <li>配置後も移動操作を継続可能</li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}
