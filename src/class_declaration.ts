import { simple } from "acorn-walk"

import * as ast from "./util/ast"
import * as decorators from "./util/decorators"
import * as properties from "./util/properties"

import { ParseError } from "./parse_error"
import { SourceFile } from "./source_file"
import { ControllerDefinition } from "./controller_definition"
import { ImportDeclaration } from "./import_declaration"
import { ExportDeclaration } from "./export_declaration"
import { MethodDefinition } from "./controller_property_definition"

import type { TSESTree } from "@typescript-eslint/typescript-estree"
import type { ClassDeclarationNode } from "./types"

export class ClassDeclaration {
  public readonly sourceFile: SourceFile
  public readonly className?: string
  public readonly superClass?: ClassDeclaration
  public readonly node?: ClassDeclarationNode

  // public isStimulusDescendant: boolean = false

  public importDeclaration?: ImportDeclaration // TODO: technically a class can be imported more than once
  public exportDeclaration?: ExportDeclaration // TODO: technically a class can be exported more than once
  public controllerDefinition?: ControllerDefinition

  constructor(className: string | undefined, superClass: ClassDeclaration | undefined, sourceFile: SourceFile, node?: ClassDeclarationNode | undefined) {
    this.className = className
    this.superClass = superClass
    this.sourceFile = sourceFile
    // this.isStimulusDescendant = superClass?.isStimulusDescendant || false
    this.node = node

    // if (this.shouldParse) {
      this.controllerDefinition = new ControllerDefinition(this.sourceFile.project, this.sourceFile.path, this)
    // }
  }

  get shouldParse() {
    return true
    // return this.isStimulusDescendant
  }

  get isStimulusDescendant() {
    return this.ancestors.reverse()[0].importDeclaration?.isStimulusImport
  }

  get isExported(): boolean {
    return !!this.exportDeclaration
  }

  get isStimulusExport(): boolean {
    if (!this.exportDeclaration) return false

    return this.exportDeclaration.isStimulusExport
  }

  get highestAncestor(): ClassDeclaration {
    if (this.superClass) {
      return this.superClass.highestAncestor
    }

    return this
  }

  get ancestors(): ClassDeclaration[] {
    const ancestors: ClassDeclaration[] = []

    let previous: ClassDeclaration | undefined = this

    while (previous !== undefined) {
      ancestors.push(previous)

      previous = previous.resolveNextClassDeclaration
    }

    return ancestors.filter(ancestor => ancestor)
  }

  get resolveNextClassDeclaration(): ClassDeclaration | undefined {
    if (this.superClass) {
      if (this.superClass.importDeclaration) {
        return this.superClass.resolveNextClassDeclaration
      }
      return this.superClass
    }

    if (this.importDeclaration) {
      return this.importDeclaration.resolveNextClassDeclaration
    }

    return
  }

  analyze() {
    if (!this.shouldParse) return

    this.analyzeClassDecorators()
    this.analyzeMethods()
    this.analyzeDecorators()
    this.analyzeStaticProperties()

    this.validate()
  }

  analyzeClassDecorators() {
    if (!this.node) return
    if (!this.controllerDefinition) return

    this.controllerDefinition.isTyped = !!decorators.extractDecorators(this.node).find(decorator =>
      (decorator.expression.type === "Identifier") ? decorator.expression.name === "TypedController" : false
    )
  }

  analyzeMethods() {
    if (!this.node) return

    simple(this.node, {
      MethodDefinition: node => {
        if (!this.controllerDefinition) return
        if (node.kind !== "method") return
        if (node.key.type !== "Identifier" && node.key.type !== "PrivateIdentifier") return

        const tsNode = (node as unknown as TSESTree.MethodDefinition)
        const methodName = ast.extractIdentifier(node.key) as string
        const isPrivate = node.key.type === "PrivateIdentifier" || tsNode.accessibility === "private"
        const name = isPrivate ? `#${methodName}` : methodName

        this.controllerDefinition.methods.push(new MethodDefinition(name, node.loc, "static"))
      },

      PropertyDefinition: node => {
        if (!this.controllerDefinition) return
        if (node.key.type !== "Identifier") return
        if (!node.value || node.value.type !== "ArrowFunctionExpression") return

        this.controllerDefinition.methods.push(new MethodDefinition(node.key.name, node.loc, "static"))
      },
    })
  }

  analyzeStaticProperties() {
    if (!this.node) return

    simple(this.node, {
      PropertyDefinition: node => {
        if (!node.value) return
        if (!node.static) return
        if (node.key.type !== "Identifier") return

        properties.parseStaticControllerProperties(this.controllerDefinition, node.key, node.value)
      }
    })
  }

  analyzeDecorators() {
    if (!this.node) return

    simple(this.node, {
      PropertyDefinition: _node => {
        const node = _node as unknown as TSESTree.PropertyDefinition

        decorators.extractDecorators(_node).forEach(decorator => {
          if (node.key.type !== "Identifier") return

          decorators.parseDecorator(this.controllerDefinition, node.key.name, decorator, node)
        })
      }
    })
  }

  public validate() {
    if (!this.controllerDefinition) return

    if (this.controllerDefinition.anyDecorator && !this.controllerDefinition.isTyped) {
      this.controllerDefinition.errors.push(
        new ParseError("LINT", "Controller needs to be decorated with @TypedController in order to use decorators.", this.node?.loc),
      )
    }

    if (!this.controllerDefinition.anyDecorator && this.controllerDefinition.isTyped) {
      this.controllerDefinition.errors.push(
        new ParseError("LINT", "Controller was decorated with @TypedController but Controller didn't use any decorators.", this.node?.loc),
      )
    }
  }
}
