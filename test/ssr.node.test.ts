import { expect, test } from "vitest";
import { isSupported } from "../src/index";

test("importing and feature-detecting on the server does not throw", () => {
  expect(typeof document).toBe("undefined");
  expect(isSupported()).toBe(false);
});
