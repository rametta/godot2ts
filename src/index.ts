import fs from "node:fs/promises";
import path from "node:path";
import { command, option, run, string } from "cmd-ts";
import { glob } from "glob";
import packageJson from "../package.json";
import { generate } from "./generator";
import { parse } from "./parser";

const cmd = command({
  name: packageJson.name,
  description: packageJson.description,
  version: packageJson.version,
  args: {
    input: option({
      type: string,
      long: "input",
      short: "i",
      defaultValue: () => ".",
      description: "The input folder to scan for .gdscript files used for generating typescript. Default: '.'",
    }),
    output: option({
      type: string,
      long: "output",
      short: "o",
      defaultValue: () => "typings",
      description: "The output folder to place the generated typescript files. Default: 'typings'",
    }),
    ignore: option({
      type: string,
      long: "ignore",
      short: "ig",
      defaultValue: () => "node_modules/**",
      description: "Glob path to ignore when searching for gdscript files in the input. Default: 'node_modules/**'",
    }),
  },
  handler: async (args) => {
    console.time("godot2ts generation time")

    try {
      const globPath = path.join(args.input, "**/*.gd");
      const gdScriptPaths = await glob(globPath, { ignore: args.ignore });

      const results = gdScriptPaths.map(async (gdScriptPath) => {
        const gdScript = await fs.readFile(gdScriptPath, { encoding: "utf-8" });
        const parsed = parse(gdScript);
        return parsed;
      });

      const settled = await Promise.allSettled(results);
      generate()
      // console.log(settled);
      // TODO: finish
    } catch (err: unknown) {
      console.error("There was an unexpected error.", err);
    }

    console.timeEnd("godot2ts generation time")
  },
});

run(cmd, process.argv.slice(2));