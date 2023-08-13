import { reactive } from "./reactive.js";

const counter = reactive({ count: 0 });
console.log(counter.count);
