[![Publish Package](https://github.com/rametta/godot2ts/actions/workflows/publish.yml/badge.svg)](https://github.com/rametta/godot2ts/actions/workflows/publish.yml)

# 🤖 Godot to TypeScript

This CLI tool generates TypeScript types and helpers based on Godot's GDScript files.

> *Usage instructions coming soon...*

> [!IMPORTANT]
> This tool marks **TypeScript** as a **peer-dependency** and requires it to be available in `node_modules` at runtime. 
>
> This is to keep the binary smaller and flexible with whichever version of Typescript used in your project, or your global TypeScript installation.

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