# lite-popover

## 0.1.0

### Minor Changes

- First real release of `createPopover`, built on the native Popover API and CSS Anchor Positioning.

  - Placement, flipping (`fallbacks`) and keeping the popover inside the viewport are now handled by CSS (`position-area` + `position-try-fallbacks`). The JS measuring code, scroll/resize listeners and `update()` are gone.
  - Unsupported browsers get an inert controller: nothing throws, nothing renders. New `isSupported()` export and `controller.supported` flag.
  - Anchor gets `aria-controls` and a live `aria-expanded`, restored on `destroy()`.
  - Clicking the anchor with a `toggle()` handler now closes an open popover instead of reopening it.
  - Several popovers (and the app's own `anchor-name`) can share one anchor.
  - Replaces the `ping` stub.

## 0.0.2

### Patch Changes

- 4ae28c7: Add ping function, repo setup
