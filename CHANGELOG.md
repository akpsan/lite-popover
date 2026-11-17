# lite-popover

## 0.1.0

### Minor Changes

- Merge popover-lite into lite-popover: `createPopover` with placement, offset and fallbacks on the native Popover API + CSS Anchor Positioning. Fixes placement CSS never applying (data-side/--gap vs data-placement/--offset mismatch) and links popover to anchor via `anchor-name`/`position-anchor` instead of the non-standard `anchor` attribute. Replaces the `ping` stub.

## 0.0.2

### Patch Changes

- 4ae28c7: Add ping function, repo setup
