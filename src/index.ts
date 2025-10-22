import fs from "node:fs/promises";
import path from "node:path";
import { command, number, option, run, string } from "cmd-ts";
import { glob } from "glob";
import ts from "typescript";
import { description, name, version } from "../package.json";
import { generate } from "./generator";
import { parse } from "./parser";

const logIfVerbose = (cond: number, err: unknown) => (cond ? console.error(err) : null);

const cmd = command({
  name,
  description,
  version,
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
      defaultValue: () => ".",
      description: "The output folder to place the generated typescript file. Default: '.'",
    }),
    ignore: option({
      type: string,
      long: "ignore",
      short: "ig",
      defaultValue: () => "node_modules/**",
      description: "Glob path to ignore when searching for gdscript files in the input. Default: 'node_modules/**'",
    }),
    verbose: option({
      type: number,
      long: "verbose",
      short: "v",
      defaultValue: () => 0,
      description: "If extra verbose logs should be printed when errors occur. Example: -v 1. Default: 0",
    }),
  },
  handler: async (args) => {
    console.time("godot2ts generation time");

    const globPath = path.join(args.input, "**/*.gd");

    let gdScriptPaths: string[] = [];

    try {
      gdScriptPaths = await glob(globPath, { ignore: args.ignore });
    } catch (err: unknown) {
      console.error("There was an error with the input glob path");
      logIfVerbose(args.verbose, err);
    }

    const results = gdScriptPaths.map(async (gdScriptPath) => {
      let gdScript: string | null = null;

      try {
        gdScript = await fs.readFile(gdScriptPath, { encoding: "utf-8" });
      } catch (err: unknown) {
        console.error(`There was an error reading the file: ${gdScriptPath}`);
        logIfVerbose(args.verbose, err);
      }

      if (gdScript) {
        const parsed = parse(gdScriptPath, gdScript);
        return parsed;
      }

      return [];
    });

    let classes: ReturnType<typeof parse>[] = [];
    try {
      classes = await Promise.all(results);
    } catch (err: unknown) {
      console.error("There was an error trying to parse the result set");
      logIfVerbose(args.verbose, err);
    }

    const typeScriptCode = generate(args.output, classes);
    ts.sys.writeFile(path.join(args.output, "generated.ts"), typeScriptCode);
    console.timeEnd("godot2ts generation time");
  },
});

run(cmd, process.argv.slice(2));
