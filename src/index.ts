// lite-popover
// Lightweight popover helper built on the native Popover API + CSS Anchor Positioning.
// MIT © 2025 — https://github.com/akpsan/lite-popover

/*************************************************
 *              Public Types & API               *
 *************************************************/
export type Placement = "top" | "bottom" | "left" | "right";

export interface PopoverOptions {
  /** Preferred placement. If it doesn't fit, we'll try others. Default: 'bottom' */
  placement?: Placement;
  /** Gap between popover and anchor, in px. Default: 8 */
  offset?: number;
  /** Fallback order when preferred placement doesn't fit. Default: the other three sides */
  fallbacks?: Placement[];
}

export interface PopoverController {
  readonly element: HTMLElement;
  show(): void;
  hide(): void;
  toggle(): void;
  update(): void;
  destroy(): void;
}

/*************************************************
 *                 Helper utils                  *
 *************************************************/
let anchorCounter = 0;

function setPlacement(el: HTMLElement, placement: Placement) {
  el.dataset.placement = placement;
}

function getScrollParents(el: HTMLElement): (HTMLElement | Window)[] {
  const parents: (HTMLElement | Window)[] = [];
  let current: HTMLElement | null = el.parentElement;

  while (current && current !== document.documentElement) {
    const style = getComputedStyle(current);
    const overflow = style.overflow + style.overflowX + style.overflowY;
    if (/auto|scroll|overlay/.test(overflow)) {
      parents.push(current);
    }
    current = current.parentElement;
  }

  // Document scrolling fires on window, not on <html>.
  parents.push(window);
  return parents;
}

/*************************************************
 *            Simple placement logic             *
 *************************************************/
function getAvailableSpace(anchor: HTMLElement, placement: Placement): number {
  const rect = anchor.getBoundingClientRect();
  switch (placement) {
    case "top":
      return rect.top;
    case "bottom":
      return window.innerHeight - rect.bottom;
    case "left":
      return rect.left;
    case "right":
      return window.innerWidth - rect.right;
  }
}

function findBestPlacement(
  anchor: HTMLElement,
  popover: HTMLElement,
  offset: number,
  preferred: Placement,
  fallbacks: Placement[]
): Placement {
  const fits = (p: Placement) => {
    const required =
      (p === "top" || p === "bottom" ? popover.offsetHeight : popover.offsetWidth) +
      offset;
    return getAvailableSpace(anchor, p) >= required;
  };

  const candidates = [preferred, ...fallbacks];
  const firstFit = candidates.find(fits);
  if (firstFit) return firstFit;

  // Nothing fits, use the side with the most space.
  return candidates.reduce((best, current) =>
    getAvailableSpace(anchor, current) > getAvailableSpace(anchor, best)
      ? current
      : best
  );
}

/*************************************************
 *                createPopover                  *
 *************************************************/
export function createPopover(
  anchor: HTMLElement,
  opts: PopoverOptions = {}
): PopoverController {
  const {
    placement = "bottom",
    offset = 8,
    fallbacks = (["top", "bottom", "right", "left"] as Placement[]).filter(
      (p) => p !== placement
    ),
  } = opts;

  // Link popover to anchor with CSS Anchor Positioning.
  const anchorName = `--lite-popover-${++anchorCounter}`;
  const previousAnchorName = anchor.style.getPropertyValue("anchor-name");
  anchor.style.setProperty("anchor-name", anchorName);

  const popover = document.createElement("div");
  popover.setAttribute("popover", "auto");
  popover.className = "lite-popover";
  popover.tabIndex = -1;
  popover.style.setProperty("position-anchor", anchorName);
  popover.style.setProperty("--offset", `${offset}px`);
  setPlacement(popover, placement);

  document.body.appendChild(popover);

  const supportsPopover = typeof popover.showPopover === "function";

  const isOpen = () =>
    supportsPopover
      ? popover.matches(":popover-open")
      : popover.style.display === "block";

  function update() {
    // Hidden popovers measure 0x0, so only re-place while open.
    if (!isOpen()) return;
    setPlacement(
      popover,
      findBestPlacement(anchor, popover, offset, placement, fallbacks)
    );
  }

  function show() {
    if (supportsPopover) {
      popover.showPopover();
    } else {
      popover.style.display = "block";
    }
    update();
  }

  function hide() {
    if (supportsPopover) {
      popover.hidePopover();
    } else {
      popover.style.display = "none";
    }
  }

  function toggle() {
    isOpen() ? hide() : show();
  }

  // Reactive updates
  const resizeObserver = new ResizeObserver(update);
  resizeObserver.observe(anchor);
  resizeObserver.observe(popover);

  const scrollParents = getScrollParents(anchor);
  scrollParents.forEach((parent) =>
    parent.addEventListener("scroll", update, { passive: true })
  );
  window.addEventListener("resize", update, { passive: true });

  function destroy() {
    resizeObserver.disconnect();
    scrollParents.forEach((parent) =>
      parent.removeEventListener("scroll", update)
    );
    window.removeEventListener("resize", update);
    if (anchor.style.getPropertyValue("anchor-name") === anchorName) {
      if (previousAnchorName) {
        anchor.style.setProperty("anchor-name", previousAnchorName);
      } else {
        anchor.style.removeProperty("anchor-name");
      }
    }
    popover.remove();
  }

  return {
    element: popover,
    show,
    hide,
    toggle,
    update,
    destroy,
  };
}
