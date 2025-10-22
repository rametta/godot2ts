import path from "node:path";
import ts from "typescript";

import factory = ts.factory;

import type { ClassInfo } from "./parser";

export function generate(_output: string, classes: ClassInfo[][]) {
  const statements = [
    createGodotImportStatement(),
    ...createInterfaces(classes),
    createResourceMapperTypeAlias(classes),
    createLoadGdScriptFunction(),
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

  interfaces.sort((a, b) => a.name.text.localeCompare(b.name.text));

  return interfaces;
}

function createInterface(info: ClassInfo): ts.InterfaceDeclaration {
  info.functions.sort((a, b) => a.name.localeCompare(b.name));

  return factory.createInterfaceDeclaration(
    undefined,
    factory.createIdentifier(info.name ?? filenameFromPath(info.path)),
    undefined,
    info.extendsClass
      ? [
          factory.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
            factory.createExpressionWithTypeArguments(
              factory.createPropertyAccessExpression(
                factory.createIdentifier("G"),
                factory.createIdentifier(info.extendsClass),
              ),
              undefined,
            ),
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
    func.returnType ? typeStringMapper(func.returnType) : factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
  );
}

function typeStringMapper(typeStr: string) {
  switch (typeStr) {
    case "int":
    case "float":
      return factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
    case "String":
    case "string":
      return factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
    case "bool":
      return factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
    case "void":
      return factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword);
    case "Array":
      return factory.createArrayTypeNode(factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword));
    default:
      return factory.createTypeReferenceNode(
        factory.createQualifiedName(factory.createIdentifier("G"), factory.createIdentifier(typeStr)),
        undefined,
      );
  }
}

function createGodotImportStatement(): ts.ImportDeclaration {
  return factory.createImportDeclaration(
    undefined,
    factory.createImportClause(undefined, undefined, factory.createNamespaceImport(factory.createIdentifier("G"))),
    factory.createStringLiteral("godot"),
    undefined,
  );
}

// Takes a path like: '/wefherf/erf/hello.gd' and return 'hello'
function filenameFromPath(filePath: string): string {
  return path.basename(filePath, path.extname(filePath));
}

function createResourceMapperTypeAlias(classes: ClassInfo[][]): ts.TypeAliasDeclaration {
  const propertySignatures: ts.PropertySignature[] = [];

  for (const cl of classes) {
    for (const c of cl) {
      propertySignatures.push(
        factory.createPropertySignature(
          undefined,
          factory.createStringLiteral(`res://${c.path}`),
          undefined,
          factory.createTypeReferenceNode(factory.createIdentifier(c.name ?? filenameFromPath(c.path)), undefined),
        ),
      );
    }
  }

  propertySignatures.sort((a, b) =>
    ts.isStringLiteral(a.name) && ts.isStringLiteral(b.name) ? a.name.text.localeCompare(b.name.text) : 0,
  );

  return factory.createTypeAliasDeclaration(
    undefined,
    factory.createIdentifier("ResourceMapper"),
    undefined,
    factory.createTypeLiteralNode(propertySignatures),
  );
}

function createLoadGdScriptFunction(): ts.FunctionDeclaration {
  return factory.createFunctionDeclaration(
    [factory.createToken(ts.SyntaxKind.ExportKeyword)],
    undefined,
    factory.createIdentifier("loadGdScript"),
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
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier("G"),
                      factory.createIdentifier("ResourceLoader"),
                    ),
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
