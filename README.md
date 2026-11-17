# lite-popover

A lightweight, pragmatic popover library built on the native Popover API and CSS Anchor Positioning. No dependencies, no framework lock-in, just simple popovers that work.

## Why lite-popover?

- **Tiny**: ~2KB minified, because your bundle size matters
- **Modern**: Uses native browser APIs (Popover API + CSS Anchor Positioning)
- **Smart**: Automatically finds the best placement when your preferred spot doesn't fit
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

  /** Fallback placements when preferred doesn't fit. Default: the other three sides */
  fallbacks?: Placement[];
}
```

### PopoverController

```typescript
interface PopoverController {
  readonly element: HTMLElement; // The popover element
  show(): void; // Show the popover
  hide(): void; // Hide the popover
  toggle(): void; // Toggle visibility
  update(): void; // Recalculate position
  destroy(): void; // Clean up everything
}
```

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
// This will try 'right' first, then fall back to 'left', 'top', 'bottom'
const smartPopover = createPopover(element, {
  placement: "right",
  fallbacks: ["left", "top", "bottom"],
});
```

## CSS Styling

Import the base styles (`lite-popover/style.css`) and override as needed. The popover gets the `lite-popover` class, a `data-placement` attribute with the side it actually landed on, and an `--offset` custom property:

```css
.lite-popover {
  --popover-bg: #222;
  --popover-fg: #fff;
  --popover-border: transparent;
}

/* Style based on the resolved placement, e.g. for an arrow */
.lite-popover[data-placement="top"] {
}
```

## Browser Support

Requires the Popover API and CSS Anchor Positioning (`anchor-name` / `position-anchor` / `anchor()`). Browsers without the Popover API fall back to a basic `display` show/hide; without anchor positioning the popover still opens but is not positioned next to its anchor.

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
