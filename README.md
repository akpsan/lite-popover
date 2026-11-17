# lite-popover

A lightweight, pragmatic popover library built on the native Popover API and CSS Anchor Positioning. No dependencies, no framework lock-in, just simple popovers that work.

## Why lite-popover?

- **Tiny**: ~1KB gzipped, because your bundle size matters
- **Native**: The browser does the work. The Popover API gives you the top layer and light dismiss (Esc, outside click); CSS Anchor Positioning places, flips and keeps the popover on screen. No JS measuring, no scroll listeners.
- **Smart**: Flips to a fallback side when your preferred spot doesn't fit, and stays inside the viewport near edges
- **Safe**: In browsers without support it quietly does nothing instead of breaking your app
- **Zero dependencies**: No React, no jQuery, no drama
- **TypeScript**: Fully typed for better DX

## Installation

```bash
npm install lite-popover
```

## Quick Start

```javascript
import { createPopover } from "lite-popover";
import "lite-popover/style.css";

const button = document.querySelector("#my-button");
const popover = createPopover(button);

// Add your content
popover.element.innerHTML = "<p>Hello, world!</p>";

// Show it
button.addEventListener("click", () => popover.show());
```

That's it. No complex setup, no configuration hell.

## API Reference

### `createPopover(anchor, options)`

Creates a popover attached to an anchor element.

**Parameters:**

- `anchor: HTMLElement` - The element to attach the popover to
- `options: PopoverOptions` - Optional configuration

**Returns:** `PopoverController`

### PopoverOptions

```typescript
interface PopoverOptions {
  /** Preferred placement. Default: 'bottom' */
  placement?: "top" | "bottom" | "left" | "right";

  /** Gap between popover and anchor in pixels. Default: 8 */
  offset?: number;

  /** Placements the browser tries, in order, when the preferred one overflows.
   *  Default: the other three sides. Pass [] to never flip. */
  fallbacks?: Placement[];
}
```

### PopoverController

```typescript
interface PopoverController {
  readonly element: HTMLElement; // The popover element
  readonly supported: boolean; // false in unsupported browsers (see below)
  show(): void; // Show the popover
  hide(): void; // Hide the popover
  toggle(): void; // Toggle visibility
  destroy(): void; // Remove the popover and restore the anchor
}
```

Positioning is live: the browser keeps the popover attached through scrolling, resizing and content changes, so there is no `update()` to call.

### `isSupported()`

Returns `true` when the browser has everything lite-popover needs. Safe to call during server rendering (returns `false`).

### Accessibility

The anchor gets `aria-controls` pointing at the popover and an `aria-expanded` that stays in sync, including when the popover is closed with Esc or an outside click. Both are restored on `destroy()`.

## Examples

### Basic Tooltip

```javascript
const tooltip = createPopover(button, {
  placement: "top",
  offset: 4,
});

tooltip.element.textContent = "This is a tooltip";
tooltip.element.className = "tooltip";

button.addEventListener("mouseenter", () => tooltip.show());
button.addEventListener("mouseleave", () => tooltip.hide());
```

### Dropdown Menu

```javascript
const dropdown = createPopover(menuButton, {
  placement: "bottom",
  fallbacks: ["top"],
});

dropdown.element.innerHTML = `
  <ul class="menu">
    <li><a href="#profile">Profile</a></li>
    <li><a href="#settings">Settings</a></li>
    <li><a href="#logout">Logout</a></li>
  </ul>
`;

menuButton.addEventListener("click", () => dropdown.toggle());
```

### Smart Positioning

```javascript
// Prefers 'right'; if it overflows, the browser tries 'left', then 'top', then 'bottom'
const smartPopover = createPopover(element, {
  placement: "right",
  fallbacks: ["left", "top", "bottom"],
});
```

## CSS Styling

Import the base styles (`lite-popover/style.css`) and override as needed. The stylesheet is required: it holds the positioning rules. The popover gets the `lite-popover` class, a `data-placement` attribute with the preferred side, and an `--offset` custom property:

```css
.lite-popover {
  --popover-bg: #222;
  --popover-fg: #fff;
  --popover-border: transparent;
}

/* Style based on the preferred placement */
.lite-popover[data-placement="top"] {
}
```

Flipping happens in CSS, so `data-placement` is the side you asked for, not necessarily the side the browser chose.

## Browser Support

Requires the Popover API and CSS Anchor Positioning (`anchor-name`, `position-area`, `position-try-fallbacks`). See [caniuse: CSS Anchor Positioning](https://caniuse.com/css-anchor-positioning) for current support.

lite-popover ships no polyfill. In browsers without support, `createPopover` still returns a controller, but it is inert: `show()`, `hide()`, `toggle()` and `destroy()` do nothing, the element is never added to the page, and the anchor is left untouched. Nothing throws and nothing renders in the wrong place. Use `isSupported()` or `popover.supported` if you want to show an alternative:

```javascript
const popover = createPopover(button);
if (!popover.supported) {
  button.title = "Profile, Settings, Logout"; // or link to a page, etc.
}
```

## Framework Integration

### React

```jsx
import { useEffect, useRef } from "react";
import { createPopover } from "lite-popover";

function MyComponent() {
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    if (buttonRef.current) {
      const popover = createPopover(buttonRef.current);
      popoverRef.current = popover;

      return () => popover.destroy();
    }
  }, []);

  return (
    <button ref={buttonRef} onClick={() => popoverRef.current?.toggle()}>
      Click me
    </button>
  );
}
```

### Vue

```vue
<template>
  <button ref="button" @click="toggle">Click me</button>
</template>

<script>
import { createPopover } from "lite-popover";

export default {
  mounted() {
    this.popover = createPopover(this.$refs.button);
  },

  beforeUnmount() {
    this.popover?.destroy();
  },

  methods: {
    toggle() {
      this.popover?.toggle();
    },
  },
};
</script>
```

## Migrating from popover-lite

This package replaces `popover-lite`.

- Install `lite-popover` and change imports from `"popover-lite"` to `"lite-popover"`.
- The CSS class is now `.lite-popover` (was `.popover-lite`), and the stylesheet is `lite-popover/style.css`.
- Positioning now actually uses CSS Anchor Positioning (`anchor-name` / `position-anchor`) instead of the non-standard `anchor` attribute.

## Contributing

Found a bug? Want a feature? [Open an issue](https://github.com/akpsan/lite-popover/issues) or submit a PR.

## License

MIT © 2025

## Development

```bash
pnpm install
pnpm exec playwright install chromium   # once, for the browser tests
pnpm test                               # unit + real-browser tests (Vitest)
pnpm demo                               # interactive demo page
```
