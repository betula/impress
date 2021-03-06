import { store, get, set, modify, extend, watch, update, group } from "../src";

test("Should create without params", () => {
  const a = store();
  expect(a.state).toBeUndefined();
});

test("Should create with params", () => {
  const a = store({
    a: { b: 12 }
  });
  expect(a.state.a.b).toBe(12);
});

test("Should create from another store and selector", () => {
  const a = store({
    a: { b: 12 }
  });
  const b = store(a, (state) => state.a.b);
  modify(a).a.b = 13;
  expect(b.state).toBe(13);
});

test("Should create from two stores and selector", () => {
  const a = store({
    a: { b: 12 }
  });
  const b = store(a, (state) => state.a.b + 5);
  const c = store(a, b, (s1, s2) => s1.a.b + "_" + s2);
  modify(a).a.b = 13;
  expect(c.state).toBe("13_18");
});

test("Should create from class without params", () => {
  class A {
    state = 10;
  }
  const a = store(A);
  expect(a.state).toBe(10);
  expect(a instanceof A).toBeTruthy();
});

test("Should create from class with params", () => {
  const fn = jest.fn();
  class A {
    state = 15;
    constructor(a: any, b: any) {
      fn(a, b);
    }
  }
  const a = store(A, 10, "A");
  expect(a.state).toBe(15);
  expect(fn).toBeCalledWith(10, "A");
});

test("Should create from function factory without params", () => {
  const m = store(10);
  const F = () => m;
  const f = store(F);
  expect(f.state).toBe(10);
  expect(f).toBe(m);
});

test("Should create from function factory with params", () => {
  const fn = jest.fn();
  const m = store(10);
  const F = (a, b) => {
    fn(a, b);
    return m;
  };
  const f = store(F, 10, "A");
  expect(f.state).toBe(10);
  expect(f).toBe(m);
  expect(fn).toBeCalledWith(10, "A");
});

test("Should work extend", () => {
  const a = store();
  const ex = extend(a, { m: 22 });
  expect(ex.m).toBe(22);
});

test("Should work watch", () => {
  const fn = jest.fn();
  const a = store(10);
  watch(a, fn);
  set(a, 11);
  expect(fn).toBeCalledWith(11, 10);
});

test("Should work watch from two stores", () => {
  const fn = jest.fn();
  const a = store("A");
  const b = store("B");
  watch(a, b, fn);
  set(a, "M");
  expect(fn).toHaveBeenNthCalledWith(1, "M", "B", "A", undefined);
  set(b, "L");
  expect(fn).toHaveBeenNthCalledWith(2, "M", "L", "A", "B");
  expect(fn).toBeCalledTimes(2);
});

test("Should work group", () => {
  const fn = jest.fn();
  const a = store("A");
  const b = store("B");
  watch(a, b, fn);
  group(() => {
    set(a, "M");
    set(b, "L");
  });
  expect(fn).toHaveBeenNthCalledWith(1, "M", "L", "A", "B");
  expect(fn).toBeCalledTimes(1);
});

test("Should resolve diamond problem in state part", () => {
  const fn = jest.fn();
  const a = store("A");
  const b = store(a, (state) => "_" + state);
  watch(a, b, fn);
  set(a, "B");
  expect(fn).toHaveBeenNthCalledWith(1, "B", "_B", "A", "_A");
});

test("Should work modify", () => {
  const m = { a: 10 };
  const a = store(m);
  modify(a).a = 11;
  expect(a.state).not.toBe(m);
  expect(a.state.a).toBe(11);
});

test("Should work update without callback", () => {
  const m = { a: 10, m: 9 };
  const a = store(m);
  update(a, { a: 11 });
  expect(a.state).not.toBe(m);
  expect(a.state.a).toBe(11);
  expect(a.state.m).toBe(9);
});

test("Should work update with callback", () => {
  const m = { a: 10, m: 9 };
  const a = store(m);
  update(a, () => ({ a: 11 }));
  expect(a.state).not.toBe(m);
  expect(a.state.a).toBe(11);
  expect(a.state.m).toBe(9);
});

test("Should work get", () => {
  expect(get(store(10))).toBe(10);
});

test("Should work set with value", () => {
  const a = store(10);
  set(a, 11);
  expect(a.state).toBe(11);
});

test("Should work set with callback", () => {
  const a = store(10);
  set(a, (s) => s + 1);
  expect(a.state).toBe(11);
});
