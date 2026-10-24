import { describe, expect, it } from "vitest";
import { arrowStep, sanitizeDecimal } from "./numberInput";

describe("sanitizeDecimal", () => {
  it.each([
    ["05", 3, Infinity, "5"],
    ["0.5", 3, Infinity, "0.5"],
    [".5", 3, Infinity, "0.5"],
    ["5.", 3, Infinity, "5."],
    ["1.2.3", 3, Infinity, "1.23"],
    ["12a3", 3, Infinity, "123"],
    ["1234", 3, Infinity, "123"],
    ["0001234", 9, 2, "1234"],
    ["12.345", 9, 2, "12.34"],
    ["33.3333", 3, Infinity, "33.3333"],
    ["", 9, 2, ""],
  ])("%s (int %i, dec %s) -> %s", (input, maxInt, maxDec, out) => {
    expect(sanitizeDecimal(input, maxInt, maxDec)).toBe(out);
  });
});

describe("arrowStep", () => {
  const up = { key: "ArrowUp", shiftKey: false };
  const down = { key: "ArrowDown", shiftKey: false };

  it("ignores other keys", () => {
    expect(arrowStep({ key: "a", shiftKey: false }, 5, [1, 10], 3)).toBeNull();
  });

  it("steps fine, coarse with shift, and rounds float dust", () => {
    expect(arrowStep(up, 5, [1, 10], 3)).toBe(6);
    expect(arrowStep({ ...up, shiftKey: true }, 5, [1, 10], 3)).toBe(15);
    expect(arrowStep(up, 33.33333333333333, [1, 10], 3)).toBe(34.33);
  });

  it("clamps to zero and the digit ceiling", () => {
    expect(arrowStep(down, 0.5, [1, 10], 3)).toBe(0);
    expect(arrowStep(up, 999, [1, 10], 3)).toBe(999);
    expect(arrowStep(up, NaN, [100, 1000], 9)).toBe(100);
  });
});
