import { describe, expect, it } from "vitest";
import { EMPTY, evaluate, press, show, usable } from "./calculator";
import type { CalcKey, CalcState } from "./calculator";

/** Press each key in turn, "12+3" style; keys are single characters. */
const type = (keys: string, from: CalcState = EMPTY) =>
  [...keys].reduce((s, k) => press(s, k as CalcKey), from);

describe("evaluate", () => {
  it("does × and ÷ before + and −", () => {
    expect(evaluate("2+3×4")).toBe(14);
    expect(evaluate("10−6÷2")).toBe(7);
  });
  it("ignores a trailing operator while the next number is typed", () => {
    expect(evaluate("120+")).toBe(120);
  });
  it("drops float noise", () => {
    expect(evaluate("0.1+0.2")).toBe(0.3);
  });
  it("handles a negative first number", () => {
    expect(evaluate("−5+2")).toBe(-3);
  });
  it("is unusable after dividing by zero", () => {
    expect(usable(evaluate("5÷0"))).toBe(false);
  });
  it("is null with nothing to work out", () => {
    expect(evaluate("")).toBeNull();
    expect(evaluate("−")).toBeNull();
  });
});

describe("press", () => {
  it("builds a sum and works it out", () => {
    expect(type("120+45.5=")).toEqual({ expr: "165.5", done: true });
  });
  it("carries the result on into the next operator", () => {
    expect(type("2+3=×2").expr).toBe("5×2");
  });
  it("starts a new sum on a digit after =", () => {
    expect(type("2+3=7").expr).toBe("7");
  });
  it("replaces an operator typed twice", () => {
    expect(type("5+×").expr).toBe("5×");
  });
  it("starts from 0 when an operator comes first", () => {
    expect(type("+5=").expr).toBe("5");
  });
  it("flips the sign of the number being typed with ±", () => {
    expect(type("5×3±").expr).toBe("5×−3");
    expect(type("5×3±=").expr).toBe("−15");
    expect(type("5−3±=").expr).toBe("8");
    expect(type("5×3±±").expr).toBe("5×3");
  });
  it("flips a result after =", () => {
    expect(type("2+3=±").expr).toBe("−5");
  });
  it("takes % of what came before after + or −, like iOS", () => {
    expect(type("200+10%=").expr).toBe("220");
    expect(type("200−10%=").expr).toBe("180");
  });
  it("divides by 100 with % anywhere else", () => {
    expect(type("50%").expr).toBe("0.5");
    expect(type("200×10%=").expr).toBe("20");
  });
  it("keeps one point per number and pads a bare one", () => {
    expect(type(".5.5").expr).toBe("0.55");
    expect(type("1.5+.2").expr).toBe("1.5+0.2");
  });
  it("drops leading zeros", () => {
    expect(type("005").expr).toBe("5");
  });
  it("leaves the sum alone on = after ÷ 0", () => {
    expect(type("5÷0=")).toEqual({ expr: "5÷0", done: false });
  });
  it("clears, and backspaces one key", () => {
    expect(type("12+3C")).toEqual(EMPTY);
    expect(type("12+3⌫").expr).toBe("12+");
  });
  it("shows a negative result with a minus sign and grouping", () => {
    expect(type("1−1000=").expr).toBe("−999");
    expect(show(-1234.5)).toBe("−1,234.5");
  });
});
