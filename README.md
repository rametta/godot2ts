[![Publish Package](https://github.com/rametta/godot2ts/actions/workflows/publish.yml/badge.svg)](https://github.com/rametta/godot2ts/actions/workflows/publish.yml)

# 🤖 Godot to TypeScript

This CLI tool generates TypeScript types and helpers based on Godot's GDScript files.

## Usage

Install

```sh
# local project
bun i godot2ts

# global
bun i -g godot2ts
```

Use

```sh
godot2ts --help
```

The default command with no arguments will scan the current working directory recursively for `.gd` files and will generate one typescript file with all gd scripts converted to typescript.


> [!IMPORTANT]
> This tool marks **TypeScript** as a **peer-dependency** and requires it to be available in `node_modules` at runtime. 

## Contributing

Install dependencies:

```sh
bun install
```

Create a build

```sh
bun run build
```

Run tests

```sh
bun run test
```

Format & Lint

```sh
bun run format
```