import { NodePath, parse } from "@babel/core";
import template from "@babel/template";
import {
  ClassDeclaration,
  ClassMethod,
  ClassProperty,
  Expression,
  Statement,
} from "@babel/types";
import * as t from "@babel/types";

function isRecordProperty(node: ClassProperty) {
  return (
    !node.static &&
    !node.declare &&
    node.readonly &&
    node.accessibility === "public"
  );
}

const initStatementWithDefaultValue = template.statement(
  "this.NAME = partial.NAME ?? DEFAULT_VALUE;"
);

const initStatement = template.statement("this.NAME = partial.NAME;");

export class Processor {
  private readonly properties = new Map<
    string,
    Expression | null | undefined
  >();

  constructor(private readonly classDeclaration: NodePath<ClassDeclaration>) {}

  public process() {
    this.processProperties();
    this.processConstructor();
  }

  private processProperties() {
    this.classDeclaration.traverse({
      ClassProperty: (property) => {
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
        this.properties.set(key.name, value);
        property.node.value = null;
      },
    });
  }

  private processConstructor() {
    const constructor = this.classDeclaration.find(
      (it) => it.isClassMethod() && it.node.kind === "constructor"
    ) as NodePath<ClassMethod> | null;
    if (!constructor) {
      this.classDeclaration.node.body.body.push(this.createConstructor());
    }
  }

  private createConstructor(): ClassMethod {
    const file = parse(`
        class Foo {
          constructor(partial) {
          
          }
        }
      `);
    if (!file || file.type !== "File") {
      throw new Error();
    }
    const { program } = file;
    const classDeclaration = program.body[0];
    if (!classDeclaration || classDeclaration.type !== "ClassDeclaration") {
      throw new Error();
    }
    const constructor = classDeclaration.body.body[0];
    if (
      !constructor ||
      constructor.type !== "ClassMethod" ||
      constructor.kind !== "constructor"
    ) {
      throw new Error();
    }
    this.properties.forEach((value, name) => {
      let statement: Statement;
      if (value) {
        statement = initStatementWithDefaultValue({
          NAME: t.identifier(name),
          DEFAULT_VALUE: value,
        });
      } else {
        statement = initStatement({
          NAME: t.identifier(name),
        });
      }
      constructor.body.body.push(statement);
    });
    return constructor;
  }
}
