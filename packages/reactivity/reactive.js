import { mutableHandlers } from "./baseHandlers.js";

const reactiveMap = new WeakMap();

export function reactive(target) {
  return crateReactiveObject(target, reactiveMap, mutableHandlers);
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
