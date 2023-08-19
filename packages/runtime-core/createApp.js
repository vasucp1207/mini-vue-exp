import { render } from "./render";
import { createVNode } from "./vnode";

export function createApp(rootComponent) {
  return {
    mount(rootContainer) {
      console.log(rootComponent, "rootComponent");
      const vnode = createVNode(rootComponent);

      render(vnode, rootContainer);
    },
  };
}
