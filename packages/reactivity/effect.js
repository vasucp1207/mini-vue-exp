let activeEffect;
const targetMap = new WeakMap();
let shouldTrack = false;

class ReactiveEffect {
  _fn;
  deps = [];
  active = true;
  onStop;
  scheduler;

  constructor(fn, scheduler) {
    this._fn = fn;
    if (scheduler) this.scheduler = scheduler;
  }

  run() {
    if (!this.active) {
      return this._fn();
    }

    shouldTrack = true;
    activeEffect = this;
    const r = this._fn();

    shouldTrack = false;

    return r;
  }

  stop() {
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

function cleanupEffect(effect) {
  effect.deps.forEach((dep) => {
    // delete the effect refercences in targetMap
    dep.delete(effect);
  });

  effect.deps.length = 0;
}

export function track(target, key) {
  if (!isTracking()) return;
  // target -> key -> dep
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }

  if (dep.has(activeEffect)) return;

  dep.add(activeEffect);
  activeEffect.deps.push(dep);
}

function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}

export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);

  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

export function effect(fn, options = {}) {
  const _effect = new ReactiveEffect(fn, options.scheduler);

  Object.assign(_effect, options);

  _effect.run();

  // the this value within the function will always be _effect
  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

export function stop(runner) {
  runner.effect.stop();
}
