const extend = Object.assign;

const isObject = (value) => {
  return value !== null && typeof value === "object";
};

const hasOwn = (val, key) =>
  Object.prototype.hasOwnProperty.call(val, key);

const camelize = (str) => {
  return str.replace(/-(\w)/g, (_, c) => {
    return c ? c.toUpperCase() : "";
  });
};

const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const toHandlerKey = (str) => {
  return str ? "on" + capitalize(str) : "";
};

const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
};

const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { setupState, props } = instance;

    if (hasOwn(setupState, key)) {
      return setupState[key];
    } else if (hasOwn(props, key)) {
      return props[key];
    }

    const publicGetter = publicPropertiesMap[key];
    if (publicGetter) {
      return publicGetter(instance);
    }
  },
};

const targetMap = new WeakMap();

function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);
  triggerEffects(dep);
}

function triggerEffects(dep) {
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);

function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver);

    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }

    if (shallow) {
      return res;
    }

    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }

    return res;
  };
}

function createSetter() {
  return function set(target, key, value, receiver) {
    const res = Reflect.set(target, key, value, receiver);

    // trigger the deps
    trigger(target, key);

    return res;
  };
}

const mutableHandlers = {
  get,
  set,
};

const readonlyHandlers = {
  get: readonlyGet,
  set(target, key) {
    console.warn(
      `key : "${String(key)}" set failed because target is of type readonly`
    );
    return true;
  },
};

const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
  get: shallowReadonlyGet,
});

const ReactiveFlags = {
  IS_REACTIVE: "__v_isReactive",
  IS_READONLY: "__v_isReadonly",
};

const reactiveMap = new WeakMap();

function reactive(target) {
  return crateReactiveObject(target, reactiveMap, mutableHandlers);
}

function readonly(target) {
  return crateReactiveObject(target, reactiveMap, readonlyHandlers);
}

function shallowReadonly(target) {
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

function initProps(instance, rawProps) {
  instance.props = rawProps || {};
}

function emit(instance, event, ...args) {
  const { props } = instance;
  const handlerName = toHandlerKey(camelize(event));
  const handler = props[handlerName];
  handler && handler(...args);
}

function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    emit: () => {},
  };

  component.emit = emit.bind(null, component);

  return component;
}

function setupComponent(instance) {
  initProps(instance, instance.vnode.props);

  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  const Component = instance.type;

  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);

  const { setup } = Component;

  if (setup) {
    const setupResult = setup(shallowReadonly(instance.props), {
      emit: instance.emit,
    });
    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance, setupResult) {
  if (typeof setupResult === "object") {
    instance.setupResult = setupResult;
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
  const Component = instance.type;

  instance.render = Component.render;
}

const ShapeFlags = {
  ELEMENT: 1, // 0001
  STATEFUL_COMPONENT: 1 << 1, // 0010
  TEXT_CHILDREN: 1 << 2, // 0100
  ARRAY_CHILDREN: 1 << 3, // 1000
};

function render(vnode, container) {
  patch(vnode, container);
}

function patch(vnode, container) {
  const { shapeFlag } = vnode;
  console.log(shapeFlag, "shapeFlag");
  if (shapeFlag & ShapeFlags.ELEMENT) {
    processElement(vnode, container);
  } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    processComponent(vnode, container);
  }
}

function processElement(vnode, container) {
  mountElement(vnode, container);
}

function mountElement(vnode, container) {
  const el = (vnode.el = document.createElement(vnode.type));

  const { children, shapeFlag } = vnode;

  // children
  console.log(shapeFlag, "flag in mountElement");
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
    mountChildren(vnode, el);
  }

  // props
  const { props } = vnode;
  for (const key in props) {
    const val = props[key];
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
      const event = key.slice(2).toLowerCase();
      el.addEventListener(event, val);
    } else {
      el.setAttribute(key, val);
    }
  }

  container.append(el);
}

function mountChildren(vnode, container) {
  vnode.children.forEach((v) => {
    patch(v, container);
  });
}

function processComponent(vnode, container) {
  mountComponent(vnode, container);
}

function mountComponent(initialVNode, container) {
  console.log(initialVNode.type, "vnode in mount component");
  const instance = createComponentInstance(initialVNode);
  console.log(instance, "instance");

  setupComponent(instance);
  setupRenderEffect(instance, initialVNode, container);
}

function setupRenderEffect(instance, initialVNode, container) {
  const { proxy } = instance;
  const subTree = instance.render.call(proxy);

  console.log(subTree, "subTree");
  patch(subTree, container);

  initialVNode.el = subTree.el;
}

function createVNode(type, props, children) {
  console.log(type, "type", props, "props", children, "children");
  const vnode = {
    type,
    props,
    children,
    shapeFlag: getShapeFlag(type),
    el: null,
  };

  if (typeof children === "string") {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }

  return vnode;
}

function getShapeFlag(type) {
  return typeof type === "string"
    ? ShapeFlags.ELEMENT
    : ShapeFlags.STATEFUL_COMPONENT;
}

function createApp(rootComponent) {
  return {
    mount(rootContainer) {
      console.log(rootComponent, "rootComponent");
      const vnode = createVNode(rootComponent);

      render(vnode, rootContainer);
    },
  };
}

function h(type, props, children) {
  return createVNode(type, props, children);
}

export { createApp, h };
