import { expect, test } from "vitest";
import { generate } from "../src/generator";
import type { ClassInfo } from "../src/parser";

const sampleInput: ClassInfo[] = [
  {
    path: "lorem/ipsum/other.gd",
    extendsClass: "Node",
    exports: [],
    variables: [],
    functions: [],
  },
  {
    path: "something/something/camera_shake_core.gd",
    name: "CameraShakeCore",
    extendsClass: "RefCounted",
    exports: [
      {
        defaultValue: "20.0",
        name: "default_intensity",
        type: "float",
      },
      {
        defaultValue: "25.0",
        name: "default_speed",
        type: "float",
      },
      {
        defaultValue: "0.40",
        name: "default_duration",
        type: "float",
      },
      {
        defaultValue: "0.05",
        name: "default_fade_in",
        type: "float",
      },
      {
        defaultValue: "0.10",
        name: "default_fade_out",
        type: "float",
      },
    ],
    variables: [
      {
        defaultValue: "false",
        isPrivate: true,
        name: "_active",
        type: "bool",
      },
      {
        defaultValue: "0.0",
        isPrivate: true,
        name: "_t",
        type: "float",
      },
      {
        defaultValue: "0.0",
        isPrivate: true,
        name: "_duration",
        type: "float",
      },
      {
        defaultValue: "0.0",
        isPrivate: true,
        name: "_intensity",
        type: "float",
      },
      {
        defaultValue: "0.0",
        isPrivate: true,
        name: "_speed",
        type: "float",
      },
      {
        defaultValue: "0.0",
        isPrivate: true,
        name: "_fade_in",
        type: "float",
      },
      {
        defaultValue: "0.0",
        isPrivate: true,
        name: "_fade_out",
        type: "float",
      },
      {
        defaultValue: "0.0",
        isPrivate: true,
        name: "_noise_time",
        type: "float",
      },
      {
        defaultValue: undefined,
        isPrivate: true,
        name: "_noise",
        type: "FastNoiseLite",
      },
      {
        defaultValue: "Vector2.ZERO",
        isPrivate: true,
        name: "_base_pos",
        type: "Vector2",
      },
      {
        defaultValue: undefined,
        isPrivate: true,
        name: "_host_weak",
        type: "WeakRef",
      },
      {
        defaultValue: "false",
        isPrivate: true,
        name: "_bound",
        type: "bool",
      },
      {
        defaultValue: "0",
        isPrivate: true,
        name: "_last_usec",
        type: "int",
      },
    ],
    functions: [
      {
        name: "_init",
        parameters: [],
        returnType: "void",
      },
      {
        name: "bind",
        parameters: [
          {
            name: "other",
          },
          {
            defaultValue: undefined,
            name: "host",
            type: "Node2D",
          },
          {
            defaultValue: "true",
            name: "process_during_pause",
            type: undefined,
          },
          {
            defaultValue: "true",
            name: "last",
            type: "bool",
          },
        ],
        returnType: "void",
      },
      {
        name: "unbind",
        parameters: [],
        returnType: "void",
      },
      {
        name: "_on_process_frame",
        parameters: [],
        returnType: "void",
      },
      {
        name: "shake",
        parameters: [
          {
            defaultValue: "default_intensity",
            name: "intensity",
            type: "float",
          },
          {
            defaultValue: "default_speed",
            name: "speed",
            type: "float",
          },
          {
            defaultValue: "default_duration",
            name: "duration",
            type: "float",
          },
          {
            defaultValue: "default_fade_in",
            name: "fade_in",
            type: "float",
          },
          {
            defaultValue: "default_fade_out",
            name: "fade_out",
            type: "float",
          },
          {
            defaultValue: "false",
            name: "additive",
            type: "bool",
          },
        ],
        returnType: "void",
      },
      {
        name: "stop",
        parameters: [],
        returnType: "void",
      },
      {
        name: "is_active",
        parameters: [],
        returnType: "bool",
      },
    ],
  },
];

const expectedCode = `// THIS IS A GENERATED FILE. DO NOT EDIT MANUALLY.
// Courtesy of Godot2TS.

import * as G from "godot";
interface other extends G.Node {
}
interface CameraShakeCore extends G.RefCounted {
    call(fn: "_init"): void;
    call(fn: "bind", other: unknown, host: G.Node2D, process_during_pause: unknown, last: boolean): void;
    call(fn: "unbind"): void;
    call(fn: "_on_process_frame"): void;
    call(fn: "shake", intensity: number, speed: number, duration: number, fade_in: number, fade_out: number, additive: boolean): void;
    call(fn: "stop"): void;
    call(fn: "is_active"): boolean;
}
type ResourceMapper = {
    "res://lorem/ipsum/other.gd": other;
    "res://something/something/camera_shake_core.gd": CameraShakeCore;
};
export function instantiateGdScript<T extends keyof ResourceMapper>(path: T): ResourceMapper[T] {
    return G.ResourceLoader.load(path).call("new") as ResourceMapper[T];
}
`;

test("generate", () => {
  const typescriptCode = generate("test/path", [sampleInput]);
  expect(typescriptCode).toStrictEqual(expectedCode);
});
