import { describe, test, expect } from "vitest";
import { reactive } from "../packages/reactivity/reactive.js";

describe("basic reactive test", () => {
  test("object", () => {
    const original = { foo: 1 };
    const observed = reactive(original);
    expect(observed).not.toBe(original);

    expect(observed.foo).toBe(1);
  });
});
