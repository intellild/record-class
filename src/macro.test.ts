import plugin from "babel-plugin-macros";
import pluginTester from "babel-plugin-tester";

pluginTester({
  plugin,
  pluginName: "macro-record-class",
  babelOptions: {
    filename: __filename,
    plugins: [["@babel/plugin-syntax-decorators", { legacy: true }]],
    presets: ["@babel/preset-typescript"],
  },
  snapshot: true,
  tests: [
    `
      import record from "../macro";
      
      @record
      class SomeRecord {
        public readonly name?: string = "";
      }
    `,
  ],
});
