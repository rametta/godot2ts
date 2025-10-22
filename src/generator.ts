import path from "node:path";
import ts from "typescript";

import factory = ts.factory;

const typeOnlyImports = ["Node2D", "Vector2", "Node", "RefCounted"] as const;

export function generate(output: string, _classes: unknown[]) {
  const statements = [
    generateValueOnlyImportStatement(),
    generateTypeOnlyImportStatement(),
    generateResourceMapperTypeAlias(),
    generateInstantiateGdScriptFunction(),
  ];

  const str = statementsToString(statements);
  ts.sys.writeFile(path.join(output, "generated.ts"), str);
}

function generateValueOnlyImportStatement(): ts.ImportDeclaration {
  return factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      undefined,
      undefined,
      factory.createNamedImports([
        factory.createImportSpecifier(false, undefined, factory.createIdentifier("ResourceLoader")),
      ]),
    ),
    factory.createStringLiteral("godot"),
    undefined,
  );
}

function generateTypeOnlyImportStatement(): ts.ImportDeclaration {
  return factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      ts.SyntaxKind.TypeKeyword,
      undefined,
      factory.createNamedImports(
        typeOnlyImports.map((typeImport) =>
          factory.createImportSpecifier(false, undefined, factory.createIdentifier(typeImport)),
        ),
      ),
    ),
    factory.createStringLiteral("godot"),
    undefined,
  );
}

function generateResourceMapperTypeAlias(): ts.TypeAliasDeclaration {
  return factory.createTypeAliasDeclaration(
    undefined,
    factory.createIdentifier("ResourceMapper"),
    undefined,
    factory.createTypeLiteralNode([
      factory.createPropertySignature(
        undefined,
        factory.createStringLiteral("res://godotSrc/gdscripts/distanceEmitter2D.gd"),
        undefined,
        factory.createTypeReferenceNode(factory.createIdentifier("DistanceEmitter2D"), undefined),
      ),
      factory.createPropertySignature(
        undefined,
        factory.createStringLiteral("res://godotSrc/gdscripts/squash_and_stretch.gd"),
        undefined,
        factory.createTypeReferenceNode(factory.createIdentifier("squash_and_stretch"), undefined),
      ),
    ]),
  );
}

function generateInstantiateGdScriptFunction(): ts.FunctionDeclaration {
  return factory.createFunctionDeclaration(
    [factory.createToken(ts.SyntaxKind.ExportKeyword)],
    undefined,
    factory.createIdentifier("instantiateGdScript"),
    [
      factory.createTypeParameterDeclaration(
        undefined,
        factory.createIdentifier("T"),
        factory.createTypeOperatorNode(
          ts.SyntaxKind.KeyOfKeyword,
          factory.createTypeReferenceNode(factory.createIdentifier("ResourceMapper"), undefined),
        ),
        undefined,
      ),
    ],
    [
      factory.createParameterDeclaration(
        undefined,
        undefined,
        factory.createIdentifier("path"),
        undefined,
        factory.createTypeReferenceNode(factory.createIdentifier("T"), undefined),
        undefined,
      ),
    ],
    factory.createIndexedAccessTypeNode(
      factory.createTypeReferenceNode(factory.createIdentifier("ResourceMapper"), undefined),
      factory.createTypeReferenceNode(factory.createIdentifier("T"), undefined),
    ),
    factory.createBlock(
      [
        factory.createReturnStatement(
          factory.createAsExpression(
            factory.createCallExpression(
              factory.createPropertyAccessExpression(
                factory.createCallExpression(
                  factory.createPropertyAccessExpression(
                    factory.createIdentifier("ResourceLoader"),
                    factory.createIdentifier("load"),
                  ),
                  undefined,
                  [factory.createIdentifier("path")],
                ),
                factory.createIdentifier("call"),
              ),
              undefined,
              [factory.createStringLiteral("new")],
            ),
            factory.createIndexedAccessTypeNode(
              factory.createTypeReferenceNode(factory.createIdentifier("ResourceMapper"), undefined),
              factory.createTypeReferenceNode(factory.createIdentifier("T"), undefined),
            ),
          ),
        ),
      ],
      true,
    ),
  );
}

function statementsToString(nodes: ts.Statement[]): string {
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

  const sourceFile = ts.factory.createSourceFile(
    nodes,
    ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
    ts.NodeFlags.None,
  );

  return printer.printFile(sourceFile);
}
