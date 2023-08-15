import {
  mutableHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
} from "./baseHandlers.js";

export const ReactiveFlags = {
  IS_REACTIVE: "__v_isReactive",
  IS_READONLY: "__v_isReadonly",
};

const reactiveMap = new WeakMap();

export function reactive(target) {
  return crateReactiveObject(target, reactiveMap, mutableHandlers);
}

export function readonly(target) {
  return crateReactiveObject(target, reactiveMap, readonlyHandlers);
}

export function isProxy(value) {
  return isReadonly(value) || isReactive(value);
}

export function isReactive(value) {
  return !!value[ReactiveFlags.IS_REACTIVE];
}

export function isReadonly(value) {
  return !!value[ReactiveFlags.IS_READONLY];
}

export function shallowReadonly(target) {
  return crateReactiveObject(target, reactiveMap, shallowReadonlyHandlers);
}

function crateReactiveObject(target, proxyMap, baseHandlers) {
  const exitingProxy = proxyMap.get(target);
  if (exitingProxy) {
    return exitingProxy;
  }

  const proxy = new Proxy(target, baseHandlers);

  proxyMap.set(proxy);
  return proxy;
}
