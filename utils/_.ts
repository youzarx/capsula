import { html, Html } from "./html";

export const _ = (initialValue: any = html``, ...iter: any[]) => {
  return iter.reduce((acc, fn) => {
    if (typeof fn === "function") {
      return fn(acc);
    } else if (Array.isArray(fn) && typeof fn[0] === "function") {
      fn[0](acc);
      return acc;
    }
    return acc;
  }, initialValue);
};

export const each = (fn: (item: any) => void) => {
  return [(arr: any[]) => arr.forEach(fn)];
};

export const map = (fn: (item: any) => any) => {
  return (val: any[]) => val.map(fn);
};

export const append = (a: any) => {
  return (val: any) => {
    if (val instanceof Html) {
      return val.append(a);
    }
    return val;
  };
};

export const appendIf = (condition: boolean, a: any) => {
  return (val: any) => {
    if (val instanceof Html) {
      return val.appendIf(condition, a);
    }
    return val;
  };
};

