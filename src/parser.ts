import Parser from "tree-sitter";
import GDScript from "tree-sitter-gdscript";

type Meta = { name: string; type?: string; defaultValue?: string };

type ClassInfo = {
  name?: string;
  extendsClass?: string;
  exports: Meta[];
  variables: Array<Meta & { isPrivate: boolean }>;
  functions: Array<{ name: string; returnType?: string; parameters: Meta[] }>;
};

export function parse(gdscript: string) {
  const parser = new Parser();
  parser.setLanguage(GDScript as Parser.Language);

  const tree = parser.parse(gdscript);
  return extractClasses(tree);
}

function extractClasses(tree: Parser.Tree): ClassInfo[] {
  const classes: ClassInfo[] = [];
  let insideFunction = false;

  function traverse(node: Parser.SyntaxNode): void {
    const wasInsideFunction = insideFunction;

    // Check for class_name declaration
    if (isClassNameStatement(node)) {
      const nameNode = node.namedChildren.find(isNameNode);
      if (nameNode) {
        let classInfo = classes.find((c) => c.name === nameNode.text);
        if (!classInfo) {
          classInfo = {
            name: nameNode.text,
            extendsClass:
              node.previousNamedSibling && isExtendsStatement(node.previousNamedSibling)
                ? node.previousNamedSibling.namedChildren.find(isTypeNode)?.text
                : undefined,
            exports: [],
            variables: [],
            functions: [],
          };
          classes.push(classInfo);
        }
      }
    }

    // Mark when we're inside a function to avoid capturing local variables
    if (isFunctionDefinitionNode(node) || isConstructorDefinitionNode(node)) {
      insideFunction = true;
    }

    // Check for variables (only at class level, not inside functions)
    if (isVariableStatementNode(node) && !insideFunction) {
      const hasExportAnnotation = node.children.some(
        (child) =>
          child.type === "annotations" &&
          child.children.some(
            (annotation) =>
              annotation.type === "annotation" &&
              annotation.children.some((id) => isIdentifierNode(id) && id.text === "export"),
          ),
      );

      const nameNode = node.namedChildren.find(isNameNode);
      const typeNode = node.children.find(isTypeNode);

      if (nameNode) {
        const variable = {
          name: nameNode.text,
          type: typeNode?.children?.find(isIdentifierNode)?.text ?? node.valueNode?.type,
          defaultValue: node.valueNode?.text,
          isPrivate: nameNode.text.startsWith("_"),
        };

        // Add to the current class (create if none exists)
        if (classes.length === 0) {
          classes.push({
            exports: [],
            variables: [],
            functions: [],
          });
        }

        const currentClass = classes[classes.length - 1];
        if (currentClass) {
          if (hasExportAnnotation) {
            currentClass.exports.push({
              name: variable.name,
              type: variable.type,
              defaultValue: variable.defaultValue,
            });
          } else {
            currentClass.variables.push(variable);
          }
        }
      }
    }

    // Check for functions (including constructors)
    if (isFunctionDefinitionNode(node) || isConstructorDefinitionNode(node)) {
      const paramsNode = node.children.find(isParametersNode);

      // For constructors, the name is '_init'
      const funcName = isConstructorDefinitionNode(node) ? "_init" : node.nameNode.text;

      if (funcName) {
        const parameters: Meta[] = [];

        // Extract parameters
        if (paramsNode) {
          paramsNode.children.forEach((child) => {
            if (isTypedParameterNode(child)) {
              parameters.push({
                name: child.namedChildren.find(isIdentifierNode)?.text ?? "UNKNOWN_NAME",
                type: child.typeNode.text,
                defaultValue: child.children.find(isValueNode)?.text,
              });
            } else if (isDefaultParameterNode(child)) {
              parameters.push({
                name: child.namedChildren.find(isIdentifierNode)?.text ?? "UNKNOWN_NAME",
                // TODO: this type here probably won't ever populate - probably need to infer the type somehow
                type: child.children.find(isTypeNode)?.children?.find(isIdentifierNode)?.text,
                defaultValue: child.valueNode.text,
              });
            } else if (isTypedDefaultParameterNode(child)) {
              parameters.push({
                name: child.namedChildren.find(isIdentifierNode)?.text ?? "UNKNOWN_NAME",
                type: child.typeNode.text,
                defaultValue: child.valueNode.text,
              });
            } else if (isIdentifierNode(child)) {
              parameters.push({ name: child.text });
            }
          });
        }

        const func = {
          name: funcName,
          returnType: node.returnTypeNode.children?.find(isIdentifierNode)?.text,
          parameters,
        };

        // Add to the current class (create if none exists)
        if (classes.length === 0) {
          classes.push({
            exports: [],
            variables: [],
            functions: [],
          });
        }

        const currentClass = classes[classes.length - 1];
        if (currentClass) {
          currentClass.functions.push(func);
        }
      }
    }

    // Recursively traverse child nodes
    for (const child of node.children) {
      traverse(child);
    }

    // Restore the insideFunction state
    insideFunction = wasInsideFunction;
  }

  traverse(tree.rootNode);

  // Merge anonymous class with named class if both exist
  if (classes.length > 1) {
    const namedClass = classes.find((c) => c.name);
    const anonymousClass = classes.find((c) => !c.name);
    if (namedClass && anonymousClass) {
      namedClass.exports = [...anonymousClass.exports, ...namedClass.exports];
      namedClass.variables = [...anonymousClass.variables, ...namedClass.variables];
      namedClass.functions = [...anonymousClass.functions, ...namedClass.functions];
      return [namedClass];
    }
  }

  return classes;
}

interface VariableStatementNode extends Parser.SyntaxNode {
  type: "variable_statement";
  valueNode: Parser.SyntaxNode;
  typeNode: Parser.SyntaxNode;
}

interface TypeNode extends Parser.SyntaxNode {
  type: "type";
}

interface ValueNode extends Parser.SyntaxNode {
  type: "value";
}

interface NameNode extends Parser.SyntaxNode {
  type: "name";
}

interface ConstructorDefinitionNode extends Parser.SyntaxNode {
  type: "constructor_definition";
  returnTypeNode: TypeNode;
}

interface FunctionDefinitionNode extends Parser.SyntaxNode {
  type: "function_definition";
  returnTypeNode: TypeNode;
  nameNode: NameNode;
}

interface DefaultParameterNode extends Parser.SyntaxNode {
  type: "default_parameter";
  valueNode: ValueNode;
}

interface TypedParameterNode extends Parser.SyntaxNode {
  type: "typed_parameter";
  typeNode: TypeNode;
}

interface TypedDefaultParameterNode extends Parser.SyntaxNode {
  type: "typed_default_parameter";
  typeNode: TypeNode;
  valueNode: Parser.SyntaxNode;
}

interface IdentifierNode extends Parser.SyntaxNode {
  type: "identifier";
}

interface ParametersNode extends Parser.SyntaxNode {
  type: "parameters";
}

interface ClassNameStatementNode extends Parser.SyntaxNode {
  type: "class_name_statement";
}

interface ExtendsStatementNode extends Parser.SyntaxNode {
  type: "extends_statement";
}

function isVariableStatementNode(node: Parser.SyntaxNode): node is VariableStatementNode {
  return node.type === "variable_statement";
}

function isConstructorDefinitionNode(node: Parser.SyntaxNode): node is ConstructorDefinitionNode {
  return node.type === "constructor_definition";
}

function isFunctionDefinitionNode(node: Parser.SyntaxNode): node is FunctionDefinitionNode {
  return node.type === "function_definition";
}

function isDefaultParameterNode(node: Parser.SyntaxNode): node is DefaultParameterNode {
  return node.type === "default_parameter";
}

function isTypedParameterNode(node: Parser.SyntaxNode): node is TypedParameterNode {
  return node.type === "typed_parameter";
}

function isTypedDefaultParameterNode(node: Parser.SyntaxNode): node is TypedDefaultParameterNode {
  return node.type === "typed_default_parameter";
}

function isIdentifierNode(node: Parser.SyntaxNode): node is IdentifierNode {
  return node.type === "identifier";
}

function isTypeNode(node: Parser.SyntaxNode): node is TypeNode {
  return node.type === "type";
}

function isNameNode(node: Parser.SyntaxNode): node is NameNode {
  return node.type === "name";
}

function isValueNode(node: Parser.SyntaxNode): node is ValueNode {
  return node.type === "value";
}

function isParametersNode(node: Parser.SyntaxNode): node is ParametersNode {
  return node.type === "parameters";
}

function isClassNameStatement(node: Parser.SyntaxNode): node is ClassNameStatementNode {
  return node.type === "class_name_statement";
}

function isExtendsStatement(node: Parser.SyntaxNode): node is ExtendsStatementNode {
  return node.type === "extends_statement";
}
