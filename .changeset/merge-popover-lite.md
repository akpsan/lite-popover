---
"lite-popover": minor
---

Merge popover-lite into lite-popover: `createPopover` with placement, offset and fallbacks on the native Popover API + CSS Anchor Positioning. Fixes placement CSS never applying (data-side/--gap vs data-placement/--offset mismatch) and links popover to anchor via `anchor-name`/`position-anchor` instead of the non-standard `anchor` attribute. Replaces the `ping` stub.
