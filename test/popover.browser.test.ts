import { afterEach, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createPopover, isSupported, type PopoverController } from "../src/index";
import "../src/style.css";

const cleanups: (() => void)[] = [];
afterEach(() => {
  cleanups.splice(0).forEach((fn) => fn());
  vi.restoreAllMocks();
});

function makeAnchor(style: Partial<CSSStyleDeclaration> = {}) {
  const btn = document.createElement("button");
  btn.textContent = "anchor";
  Object.assign(btn.style, { position: "fixed", width: "80px", height: "30px", ...style });
  document.body.appendChild(btn);
  cleanups.push(() => btn.remove());
  return btn;
}

function make(anchor: HTMLElement, ...args: Parameters<typeof createPopover> extends [any, ...infer R] ? R : never) {
  const p = createPopover(anchor, ...args);
  cleanups.push(() => p.destroy());
  return p;
}

function sized(p: PopoverController, w: number, h: number) {
  p.element.style.width = `${w}px`;
  p.element.style.height = `${h}px`;
  p.element.style.boxSizing = "border-box";
  return p;
}

const rect = (el: Element) => el.getBoundingClientRect();
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r(null)));

test("Chromium is supported", () => {
  expect(isSupported()).toBe(true);
});

test("bottom placement sits below the anchor with the offset gap, centred", async () => {
  const a = makeAnchor({ top: "200px", left: "300px" });
  const p = sized(make(a, { offset: 10 }), 120, 40);
  p.show();
  await nextFrame();
  const ar = rect(a), pr = rect(p.element);
  expect(pr.top).toBeCloseTo(ar.bottom + 10, 0);
  expect(pr.left + pr.width / 2).toBeCloseTo(ar.left + ar.width / 2, 0);
});

test.each([
  ["top", (a: DOMRect, p: DOMRect) => expect(p.bottom).toBeCloseTo(a.top - 8, 0)],
  ["left", (a: DOMRect, p: DOMRect) => expect(p.right).toBeCloseTo(a.left - 8, 0)],
  ["right", (a: DOMRect, p: DOMRect) => expect(p.left).toBeCloseTo(a.right + 8, 0)],
] as const)("%s placement", async (placement, check) => {
  const a = makeAnchor({ top: "250px", left: "350px" });
  const p = sized(make(a, { placement }), 60, 40);
  p.show();
  await nextFrame();
  check(rect(a), rect(p.element));
});

test("flips to top when there is no room below", async () => {
  const a = makeAnchor({ top: "540px", left: "300px" });
  const p = sized(make(a), 120, 100);
  p.show();
  await nextFrame();
  expect(rect(p.element).bottom).toBeCloseTo(rect(a).top - 8, 0);
});

test("respects the fallback order", async () => {
  // No room below or above; first fallback that fits is 'left'.
  const a = makeAnchor({ top: "250px", left: "400px", height: "100px" });
  const p = sized(make(a, { fallbacks: ["top", "left", "right"] }), 100, 300);
  p.show();
  await nextFrame();
  expect(rect(p.element).right).toBeCloseTo(rect(a).left - 8, 0);
});

test("stays inside the viewport on the cross axis near an edge", async () => {
  const a = makeAnchor({ top: "200px", left: "760px", width: "30px" });
  const p = sized(make(a), 200, 40);
  p.show();
  await nextFrame();
  const pr = rect(p.element);
  expect(pr.right).toBeLessThanOrEqual(800);
  expect(pr.top).toBeCloseTo(rect(a).bottom + 8, 0);
});

test("keeps the anchor reference while scrolling", async () => {
  const scroller = document.createElement("div");
  Object.assign(scroller.style, { position: "fixed", top: "0", left: "0", width: "400px", height: "300px", overflow: "auto" });
  scroller.innerHTML = `<div style="height:2000px;padding-top:100px"><button>in scroller</button></div>`;
  document.body.appendChild(scroller);
  cleanups.push(() => scroller.remove());
  const a = scroller.querySelector("button")!;
  const p = sized(make(a), 80, 30);
  p.show();
  scroller.scrollTop = 50;
  await nextFrame();
  await nextFrame();
  expect(rect(p.element).top).toBeCloseTo(rect(a).bottom + 8, 0);
});

test("show/hide/toggle and aria-expanded, including light dismiss", async () => {
  const a = makeAnchor({ top: "100px", left: "100px" });
  const p = make(a);
  expect(a.getAttribute("aria-controls")).toBe(p.element.id);
  expect(a.getAttribute("aria-expanded")).toBe("false");

  p.show();
  p.show(); // idempotent
  expect(p.element.matches(":popover-open")).toBe(true);
  await vi.waitFor(() => expect(a.getAttribute("aria-expanded")).toBe("true"));

  p.toggle();
  expect(p.element.matches(":popover-open")).toBe(false);
  p.hide(); // idempotent
  await vi.waitFor(() => expect(a.getAttribute("aria-expanded")).toBe("false"));

  p.show();
  await userEvent.keyboard("{Escape}");
  expect(p.element.matches(":popover-open")).toBe(false);
  await vi.waitFor(() => expect(a.getAttribute("aria-expanded")).toBe("false"));
});

test("clicking the anchor with a toggle handler closes an open popover", async () => {
  const a = makeAnchor({ top: "100px", left: "100px" });
  const p = make(a);
  a.addEventListener("click", () => p.toggle());
  await userEvent.click(a);
  expect(p.element.matches(":popover-open")).toBe(true);
  await userEvent.click(a);
  expect(p.element.matches(":popover-open")).toBe(false);
});

test("two popovers on one anchor, plus app CSS anchor-name, all coexist", async () => {
  const style = document.createElement("style");
  style.textContent = `.has-own-anchor { anchor-name: --app; }`;
  document.head.appendChild(style);
  cleanups.push(() => style.remove());

  const a = makeAnchor({ top: "250px", left: "350px" });
  a.className = "has-own-anchor";
  const p1 = sized(make(a, { placement: "bottom" }), 50, 30);
  const p2 = sized(make(a, { placement: "top" }), 50, 30);
  p1.element.popover = "manual"; // auto popovers close each other
  p2.element.popover = "manual";
  p1.show();
  p2.show();
  await nextFrame();
  expect(rect(p1.element).top).toBeCloseTo(rect(a).bottom + 8, 0);
  expect(rect(p2.element).bottom).toBeCloseTo(rect(a).top - 8, 0);
  expect(getComputedStyle(a).getPropertyValue("anchor-name")).toContain("--app");

  p1.destroy();
  p2.destroy();
  expect(a.style.getPropertyValue("anchor-name")).toBe("");
  expect(getComputedStyle(a).getPropertyValue("anchor-name")).toBe("--app");
});

test("destroy removes the element and restores the anchor", () => {
  const a = makeAnchor();
  a.setAttribute("aria-controls", "something-else");
  const p = createPopover(a);
  p.show();
  p.destroy();
  p.destroy(); // idempotent
  expect(p.element.isConnected).toBe(false);
  expect(a.getAttribute("aria-controls")).toBe("something-else");
  expect(a.hasAttribute("aria-expanded")).toBe(false);
  expect(a.style.getPropertyValue("anchor-name")).toBe("");
  expect(() => p.show()).not.toThrow();
});

test("unsupported browsers get an inert controller that never throws or renders", () => {
  vi.spyOn(CSS, "supports").mockReturnValue(false);
  const a = makeAnchor();
  const before = document.body.children.length;
  const p = createPopover(a);
  expect(isSupported()).toBe(false);
  expect(p.supported).toBe(false);
  p.element.innerHTML = "<p>content</p>";
  expect(() => {
    p.show();
    p.toggle();
    p.hide();
    p.destroy();
  }).not.toThrow();
  expect(p.element.isConnected).toBe(false);
  expect(document.body.children.length).toBe(before);
  expect(a.hasAttribute("aria-controls")).toBe(false);
  expect(a.style.getPropertyValue("anchor-name")).toBe("");
});

test("press-tracking does not swallow a later keyboard toggle", async () => {
  const a = makeAnchor({ top: "100px", left: "100px" });
  const p = make(a);
  p.show();
  await userEvent.click(a); // no click handler: light dismiss closes it
  expect(p.element.matches(":popover-open")).toBe(false);
  await new Promise((r) => setTimeout(r, 10));
  p.toggle();
  expect(p.element.matches(":popover-open")).toBe(true);
});
