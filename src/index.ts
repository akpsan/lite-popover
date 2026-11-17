// lite-popover
// Lightweight popover helper built on the native Popover API + CSS Anchor Positioning.
// The browser does the work: top layer, light dismiss, positioning and flipping.
// This file only wires an anchor to a popover and cleans up after itself.
// MIT © 2025 — https://github.com/akpsan/lite-popover

export type Placement = "top" | "bottom" | "left" | "right";

export interface PopoverOptions {
  /** Preferred placement. Default: 'bottom' */
  placement?: Placement;
  /** Gap between popover and anchor, in px. Default: 8 */
  offset?: number;
  /** Placements the browser tries, in order, when the preferred one overflows. Default: the other three sides */
  fallbacks?: Placement[];
}

export interface PopoverController {
  /** The popover element. Put your content in here. */
  readonly element: HTMLElement;
  /** False when the browser lacks the required APIs; show/hide/toggle then do nothing. */
  readonly supported: boolean;
  show(): void;
  hide(): void;
  toggle(): void;
  destroy(): void;
}

const PLACEMENTS: Placement[] = ["top", "bottom", "right", "left"];

/**
 * True when the browser has the Popover API and CSS Anchor Positioning.
 * Safe to call anywhere, including on the server (returns false).
 */
export function isSupported(): boolean {
  return (
    typeof HTMLElement !== "undefined" &&
    "popover" in HTMLElement.prototype &&
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("anchor-name: --a") &&
    CSS.supports("position-area: top") &&
    CSS.supports("position-try-fallbacks: --a")
  );
}

let counter = 0;

// anchor-name is a list, so several popovers (or the app's own CSS) can share an anchor.
function addAnchorName(anchor: HTMLElement, name: string) {
  const current = getComputedStyle(anchor).getPropertyValue("anchor-name").trim();
  anchor.style.setProperty(
    "anchor-name",
    current && current !== "none" ? `${current}, ${name}` : name
  );
}

function removeAnchorName(anchor: HTMLElement, name: string) {
  const rest = anchor.style
    .getPropertyValue("anchor-name")
    .split(",")
    .map((n) => n.trim())
    .filter((n) => n && n !== name)
    .join(", ");
  // Drop the inline value entirely if the stylesheet alone now gives the same result.
  anchor.style.removeProperty("anchor-name");
  const base = getComputedStyle(anchor).getPropertyValue("anchor-name").trim();
  if (rest && rest !== base) anchor.style.setProperty("anchor-name", rest);
}

function restoreAttr(el: HTMLElement, name: string, value: string | null) {
  if (value === null) el.removeAttribute(name);
  else el.setAttribute(name, value);
}

type ShowPopover = (options?: { source?: HTMLElement }) => void;

export function createPopover(
  anchor: HTMLElement,
  opts: PopoverOptions = {}
): PopoverController {
  const {
    placement = "bottom",
    offset = 8,
    fallbacks = PLACEMENTS.filter((p) => p !== placement),
  } = opts;

  const id = ++counter;
  const popover = document.createElement("div");
  popover.className = "lite-popover";
  popover.id = `lite-popover-${id}`;
  popover.dataset.placement = placement;

  // Unsupported browser: hand back an inert controller. The element is never
  // attached, so nothing renders unstyled or in the wrong place, and nothing throws.
  if (!isSupported()) {
    popover.hidden = true;
    const noop = () => {};
    return {
      element: popover,
      supported: false,
      show: noop,
      hide: noop,
      toggle: noop,
      destroy: noop,
    };
  }

  const anchorName = `--lite-popover-${id}`;
  const isOpen = () => popover.matches(":popover-open");
  const prevControls = anchor.getAttribute("aria-controls");
  const prevExpanded = anchor.getAttribute("aria-expanded");

  addAnchorName(anchor, anchorName);
  anchor.setAttribute("aria-controls", popover.id);
  anchor.setAttribute("aria-expanded", "false");

  popover.popover = "auto";
  popover.tabIndex = -1;
  popover.style.setProperty("position-anchor", anchorName);
  popover.style.setProperty("--offset", `${offset}px`);
  popover.style.setProperty(
    "position-try-fallbacks",
    fallbacks.map((p) => `--lite-popover-${p}`).join(", ") || "none"
  );

  // Fires for every open/close, including light dismiss (Esc, outside click).
  const onToggle = (e: Event) => {
    const open = (e as ToggleEvent).newState === "open";
    anchor.setAttribute("aria-expanded", String(open));
  };
  popover.addEventListener("toggle", onToggle);

  // Light dismiss closes the popover on pointerup, before the anchor's click
  // handlers run, so toggle() on click would see "closed" and reopen it.
  // Remember whether it was open when the press on the anchor started.
  let openAtPress = false;
  const onPress = () => {
    openAtPress = isOpen();
  };
  const onClick = () => {
    setTimeout(() => (openAtPress = false));
  };
  anchor.addEventListener("pointerdown", onPress);
  anchor.addEventListener("click", onClick);

  document.body.appendChild(popover);

  function show() {
    if (!popover.isConnected || isOpen()) return;
    // `source` makes the anchor the popover's invoker (accessibility tree, focus
    // order). Browsers that don't know the option ignore it.
    (popover.showPopover as ShowPopover).call(popover, { source: anchor });
  }

  function hide() {
    if (isOpen()) popover.hidePopover();
  }

  function toggle() {
    const wasOpen = isOpen() || openAtPress;
    openAtPress = false;
    if (wasOpen) hide();
    else show();
  }

  function destroy() {
    if (!popover.isConnected) return;
    popover.removeEventListener("toggle", onToggle);
    anchor.removeEventListener("pointerdown", onPress);
    anchor.removeEventListener("click", onClick);
    hide();
    popover.remove();
    removeAnchorName(anchor, anchorName);
    restoreAttr(anchor, "aria-controls", prevControls);
    restoreAttr(anchor, "aria-expanded", prevExpanded);
  }

  return { element: popover, supported: true, show, hide, toggle, destroy };
}
