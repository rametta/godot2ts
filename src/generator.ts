import ts from "typescript";

import factory = ts.factory;

import type { ClassInfo } from "./parser";

const typeOnlyImports = ["Node2D", "Vector2", "Node", "RefCounted"] as const;

export function generate(output: string, classes: ClassInfo[][]) {
  const statements = [
    createValueOnlyImportStatement(),
    createTypeOnlyImportStatement(),
    ...createInterfaces(classes),
    createResourceMapperTypeAlias(classes),
    createInstantiateGdScriptFunction(),
  ];

  const str = statementsToString(statements);

  const disclaimer = `// THIS IS A GENERATED FILE. DO NOT EDIT MANUALLY.
// Courtesy of Godot2TS.

`;

  return disclaimer + str;
}

function createInterfaces(classes: ClassInfo[][]): ts.InterfaceDeclaration[] {
  const interfaces: ts.InterfaceDeclaration[] = [];

  for (const cl of classes) {
    for (const c of cl) {
      interfaces.push(createInterface(c));
    }
  }

  return interfaces;
}

function createInterface(info: ClassInfo): ts.InterfaceDeclaration {
  return factory.createInterfaceDeclaration(
    undefined,
    factory.createIdentifier(info.name ?? "UNKNOWN_NAME"),
    undefined,
    info.extendsClass
      ? [
        factory.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
          factory.createExpressionWithTypeArguments(factory.createIdentifier(info.extendsClass), undefined),
        ]),
      ]
      : [],
    info.functions.map(createInterfaceMethod),
  );
}

function createInterfaceMethod(func: ClassInfo["functions"][number]) {
  return factory.createMethodSignature(
    undefined,
    factory.createIdentifier("call"),
    undefined,
    undefined,
    [
      factory.createParameterDeclaration(
        undefined,
        undefined,
        factory.createIdentifier("fn"),
        undefined,
        factory.createLiteralTypeNode(factory.createStringLiteral(func.name)),
        undefined,
      ),
      ...func.parameters.map((param) =>
        factory.createParameterDeclaration(
          undefined,
          undefined,
          factory.createIdentifier(param.name),
          undefined,
          param.type ? typeStringMapper(param.type) : factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword),
          undefined,
        ),
      ),
    ],
    func.returnType
      ? typeStringMapper(func.returnType)
      : factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
  );
}

function typeStringMapper(typeStr: string) {
  switch (typeStr) {
    case 'int':
    case 'float':
      return factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    case 'String':
    case 'string':
      return factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
    case 'bool':
      return factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
    case 'variant':
      return factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
    default:
      return factory.createTypeReferenceNode(factory.createIdentifier(typeStr))
  }
}

function createValueOnlyImportStatement(): ts.ImportDeclaration {
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

function createTypeOnlyImportStatement(): ts.ImportDeclaration {
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

function createResourceMapperTypeAlias(classes: ClassInfo[][]): ts.TypeAliasDeclaration {
  const propertySignatures: ts.PropertySignature[] = []

  for (const cl of classes) {
    for (const c of cl) {
      propertySignatures.push(
        factory.createPropertySignature(
          undefined,
          factory.createStringLiteral("res://something/something/another.gd"),
          undefined,
          factory.createTypeReferenceNode(factory.createIdentifier(c.name ?? 'UNKNOWN_NAME'), undefined),
        )
      )
    }
  }

  return factory.createTypeAliasDeclaration(
    undefined,
    factory.createIdentifier("ResourceMapper"),
    undefined,
    factory.createTypeLiteralNode(propertySignatures),
  );
}

function createInstantiateGdScriptFunction(): ts.FunctionDeclaration {
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
