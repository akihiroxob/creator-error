# Object Detail Display Plan

## Goal

Prepare the data model and visibility rules for placed-object detail popups in `/demo`
before implementing the actual in-scene popup UI.

## Data model

Placed GLB assets now carry a normalized detail payload:

- `productName`
- `modelNumber`
- `companyName`
- `rentalCostLabel`

Code references:

- `components/Splat.tsx` `PlacementObjectDetail`
- `components/Splat.tsx` `AssetItem.detail`
- `components/Splat.tsx` `PlacementObjectUserData.detail`

The detail payload lives on `object.userData.detail`, so the later popup task can read it
directly from the selected object rather than re-looking up the source asset list.

## Interaction and visibility rules

Placed objects now track two state fields in `userData`:

- `interactionMode`: `idle | selected | moving | rotating`
- `detailVisibility`: `visible | hidden`

Current rule:

- `selected` => `detailVisibility = visible`
- `idle`, `moving`, `rotating` => `detailVisibility = hidden`

This matches the intended UX:

1. Clicking an object selects it and is the only state that should allow detail display.
2. Drag-move hides details while the user is manipulating the object.
3. Shift-drag or bracket-key rotation also hides details during manipulation.
4. When manipulation ends, the object returns to `selected`, which is the point where a
   later popup implementation may show details again.

## Why this shape

- The popup task can render from the selected object without guessing whether details should
  be shown.
- The suppression rule is explicit and local to the object interaction lifecycle.
- Later UI work can map `detailVisibility === "visible"` to a 3D label, anchored tooltip,
  or screen-space popup without changing the interaction model again.
