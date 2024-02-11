import { simple } from "acorn-walk"

import * as Acorn from "acorn"
import { Project } from "./project"
import { ControllerDefinition } from "./controller_definition"

import type { AST } from "@typescript-eslint/typescript-estree"
import type { ParserOptions, ImportDeclaration, ExportDeclaration, IdentifiableNode } from "./types"

export class SourceFile {
  readonly path: string
  readonly content: string
  readonly project: Project

  public ast?: AST<ParserOptions>
  public controllerDefinitions: ControllerDefinition[] = []
  public importDeclarations: ImportDeclaration[] = []
  public exportDeclarations: ExportDeclaration[] = []

  constructor(path: string, content: string, project: Project) {
    this.path = path
    this.content = content
    this.project = project

    this.parse()
  }

  parse() {
    this.ast = this.project.parser.parse(this.content, this.path)
  }

  analyze() {
    this.analyzeImportDeclarations()
    this.analyzeExportDeclarations()

    const controllerDefinitions = this.project.parser.parseSourceFile(this)
    const controllerDefinition = this.project.parser.parseController(this.content, this.path)

    this.project.controllerDefinitions.push(controllerDefinition)
    this.project.controllerDefinitions.push(...controllerDefinitions)
  }

  analyzeImportDeclarations() {
    simple(this.ast as any, {
      ImportDeclaration: (node: Acorn.ImportDeclaration) => {
        node.specifiers.forEach(specifier => {
          this.importDeclarations.push({
            originalName: (specifier.type === "ImportSpecifier" && specifier.imported.type === "Identifier") ? specifier.imported.name : undefined,
            localName: specifier.local.name,
            source: this.extractLiteral(node.source) || "",
            node
          })
        })
      },
    })
  }

  analyzeExportDeclarations() {
    simple(this.ast as any, {
      ExportNamedDeclaration: (node: Acorn.ExportNamedDeclaration) => {
        const { specifiers, declaration } = node

        specifiers.forEach(specifier => {
          this.exportDeclarations.push({
            exportedName: this.extractIdentifier(specifier.exported),
            localName: this.extractIdentifier(specifier.local),
            source: this.extractLiteral(node.source),
            type: "named",
            node
          })
        })

        if (!declaration) return

        if (declaration.type === "FunctionDeclaration" || declaration.type === "ClassDeclaration") {
          this.exportDeclarations.push({
            exportedName: declaration.id.name,
            localName: declaration.id.name,
            type: "named",
            node
          })
        }

        if (declaration.type === "VariableDeclaration") {
          declaration.declarations.forEach(declaration => {
            this.exportDeclarations.push({
              exportedName: this.extractIdentifier(declaration.id),
              localName: this.extractIdentifier(declaration.id),
              type: "named",
              node
            })
          })
        }
      },

      ExportDefaultDeclaration: (node: Acorn.ExportDefaultDeclaration) => {
        type declarable = Acorn.ClassDeclaration | Acorn.FunctionDeclaration

        const name = this.extractIdentifier(node.declaration)
        const nameFromId = this.extractIdentifier((node.declaration as declarable).id)
        const nameFromAssignment = this.extractIdentifier((node.declaration as Acorn.AssignmentExpression).left)

        this.exportDeclarations.push({
          exportedName: undefined,
          localName: name || nameFromId || nameFromAssignment,
          type: "default",
          node
        })
      },

      ExportAllDeclaration: (node: Acorn.ExportAllDeclaration) => {
        this.exportDeclarations.push({
          exportedName: this.extractIdentifier(node.exported),
          localName: undefined,
          source: this.extractLiteral(node.source),
          type: "namespace",
          node
        })
      },

    })
  }

  private extractIdentifier(node: IdentifiableNode): string | undefined {
    return (node && node.type === "Identifier") ? node.name : undefined
  }

  private extractLiteral(node: Acorn.Literal | null | undefined): string | undefined {
    const isLiteral = node && node.type === "Literal"

    if (!isLiteral) return undefined
    if (!node.value) return undefined

    return node.value.toString()
  }
}
