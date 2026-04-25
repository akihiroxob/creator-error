# Spark Initial Render Investigation

## Scope

This note documents why `/demo` can remain visually blank after `SplatMesh.initialized`
has resolved, and which completion signals are realistic candidates for replacing the
current fixed warmup loop in `features/spark-viewer/components/SparkScene.tsx`.

## Current `/demo` loading flow

1. `SplatLoader.loadAsync()` downloads and decodes `/3sdgs_room.ksplat`.
2. `new SplatMesh({ packedSplats }).initialized` waits for packed splat data and
   `updateGenerator()`.
3. The app adds the mesh to the scene and immediately starts a fixed warmup loop.
4. The loading overlay is closed after the warmup loop finishes.

Relevant app code:

- `features/spark-viewer/components/SparkScene.tsx:1136` downloads and decodes packed splats.
- `features/spark-viewer/components/SparkScene.tsx:1165` awaits `SplatMesh.initialized`.
- `features/spark-viewer/components/SparkScene.tsx:1215` starts the current time-based warmup.

## What `initialized` actually guarantees

From `node_modules/@sparkjsdev/spark/dist/spark.module.js`:

- `PackedSplats.asyncInitialize()` waits for file loading or unpacking only.
- `SplatMesh.asyncInitialize()` waits for `packedSplats.initialized` and then calls
  `updateGenerator()`.

That means `initialized` guarantees "GPU-ready splat data structures exist", but it does
not guarantee "the first visible frame has already been presented".

## Why the first visible frame is later than `initialized`

The remaining steps happen after `initialized` resolves:

1. `SplatMesh` adds an internal detection mesh which waits for the first
   `renderer.render(scene, camera)` call.
2. On that first render, the detection mesh auto-inserts a `SparkRenderer` into the scene
   if none exists yet.
3. `SparkRenderer.onBeforeRender()` calls `spark.update({ scene, viewToWorld })`.
4. `SparkRenderer.update()` defers `updateInternal()` through `setTimeout(..., 1)` when
   `preUpdate` is false, which is the default.
5. `SparkViewpoint.driveSort()` / `sortUpdate()` then perform GPU readback plus worker-side
   sorting before a `display.geometry` is produced for the viewpoint.
6. Only after `updateDisplay()` and a subsequent render pass do we reliably have a visible
   splat frame on screen.

So the blank interval is not just network or decode time. It is a second async pipeline:

- first render pass
- implicit SparkRenderer insertion
- deferred update tick
- GPU readback
- worker sort
- next render with the prepared display geometry

## Findings

1. The current fixed warmup is masking a real async boundary, not an arbitrary browser lag.
2. `SplatMesh.initialized` is too early to use as the loading-complete signal for `/demo`.
3. The most meaningful "render is actually ready" state lives on `SparkRenderer` /
   `SparkViewpoint.display`, not on `SplatLoader` or `SplatMesh`.
4. There is no obvious public callback in the Spark package that fires exactly when the first
   visible display geometry is ready, so a robust solution will likely need either:
   - a Spark internal state check, or
   - a render-backed heuristic layered on top of Spark.

## Completion signal candidates

### Candidate A: SparkRenderer display readiness

After the mesh is added to the scene, traverse the scene for `SparkRenderer` and wait until:

- `sparkRenderer.defaultView.display` is non-null
- `sparkRenderer.defaultView.display.geometry.instanceCount > 0`

Why it is strong:

- `display` is populated only after `sortUpdate()` finishes and `updateDisplay()` installs
  geometry for the current viewpoint.
- `instanceCount > 0` indicates the geometry for visible splats is actually prepared.

Tradeoff:

- This depends on Spark internals that are visible in the package types today, but still
  couple us to Spark implementation details.

### Candidate B: SparkRenderer geometry plus rendered frame boundary

Use Candidate A, then wait for one additional `requestAnimationFrame()` while continuing to
request a render.

Why it helps:

- Candidate A tells us the geometry is ready.
- An extra frame boundary makes it more likely the browser has presented the frame that uses
  that geometry, not just computed it.

Tradeoff:

- Still partly heuristic, but tighter than a fixed multi-second warmup.

### Candidate C: Purely external frame heuristic

Without reading Spark internals, keep the overlay until:

- a `SparkRenderer` instance appears in the scene, and
- at least two animation frames have elapsed after that point while renders are requested

Why it is weaker:

- It proves the Spark render path has started, but not that sorting/readback has completed.
- It is still timing-based, only with a better anchor than the current fixed delay.

## Recommended direction

For the follow-up task that replaces the fixed warmup:

1. Detect the auto-inserted `SparkRenderer` after the mesh is added.
2. Prefer `defaultView.display?.geometry.instanceCount > 0` as the completion signal.
3. After that signal is seen, wait one more animation frame before closing the overlay.
4. Keep a bounded timeout fallback so the UI cannot hang forever if Spark changes behavior.

This keeps the decision tied to real render preparation while limiting dependence on Spark
internals to the smallest practical surface.
