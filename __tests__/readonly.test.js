import { readonly, isReadonly, isProxy } from "../packages/reactivity/reactive";
import { describe, test, expect, vi } from "vitest";

describe("readonly", () => {
  test("should make nested values readonly", () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped = readonly(original);

    expect(isReadonly(wrapped)).toBe(true);
    expect(isReadonly(original)).toBe(false);

    expect(isReadonly(wrapped.bar)).toBe(true);
    expect(isReadonly(original.bar)).toBe(false);

    expect(wrapped).not.toBe(original);
    expect(wrapped.foo).toBe(1);

    expect(isProxy(wrapped)).toBe(true);
  });

  test("should call console.warn when set", () => {
    console.warn = vi.fn();
    const user = readonly({
      age: 10,
    });

    user.age = 11;
    expect(console.warn).toHaveBeenCalledTimes(1);
  });
});
