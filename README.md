[![Publish Package](https://github.com/rametta/godot2ts/actions/workflows/publish.yml/badge.svg)](https://github.com/rametta/godot2ts/actions/workflows/publish.yml)

# 🤖 Godot to TypeScript

This CLI tool generates TypeScript types and helpers based on Godot's GDScript files.

## Usage

Install

```sh
bun i godot2ts
```

Use

```sh
godot2ts
```

> *More usage instructions coming soon...*


> [!IMPORTANT]
> This tool marks **TypeScript** & **tree-sitter** as a **peer-dependency** and requires it to be available in `node_modules` at runtime. 
> 
> Tree sitter requires platform specific binaries to be prebuilt.

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