import { ClassProperty, Expression } from "@babel/types";
import { createMacro, MacroParams } from "babel-plugin-macros";

function isRecordProperty(node: ClassProperty) {
  return (
    !node.static &&
    !node.declare &&
    node.readonly &&
    node.accessibility === "public"
  );
}

function recordClassMacro({ references }: MacroParams): void {
  references.default.forEach((referencePath) => {
    const decorator = referencePath.parentPath;
    if (!decorator || !decorator.isDecorator()) {
      throw new Error();
    }
    const classDeclaration = referencePath.parentPath?.parentPath;
    if (!classDeclaration || !classDeclaration.isClassDeclaration()) {
      throw new Error();
    }
    classDeclaration.node.decorators = classDeclaration.node.decorators?.filter(
      (it) => it !== decorator.node
    );
    const properties = new Map<string, Expression | null | undefined>();
    classDeclaration.traverse({
      ClassProperty(property) {
        if (!isRecordProperty(property.node)) {
          return;
        }
        if (!property.node.optional && !property.node.value) {
          throw new Error();
        }
        const key = property.node.key;
        if (key.type !== "Identifier") {
          return;
        }
        const value = property.node.value;
        if (!value && !property.node.optional) {
          throw new Error();
        }
        properties.set(key.name, value);
        property.node.value = null;
      },
    });
  });
}

export = createMacro(recordClassMacro);
