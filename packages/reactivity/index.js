import { reactive } from "./reactive.js";
import { ref, unRef } from "./ref.js";

const counter = reactive({ count: 0 });
const a = ref(1);
console.log(unRef(a));
