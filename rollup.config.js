import { readFileSync } from "fs";
const pkg = JSON.parse(readFileSync("package.json", { encoding: "utf8" }));

export default {
  input: "./packages/index.js",
  output: [
    // 1. cjs -> commonjs
    // 2. esm
    {
      format: "cjs",
      file: pkg.main,
    },
    {
      format: "es",
      file: pkg.module,
    },
  ],

  plugins: [],
};
