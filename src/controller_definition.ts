import path from "path"

import { identifierForContextKey } from "@hotwired/stimulus-webpack-helpers"

import { Project } from "./project"
import { ClassDeclaration } from "./class_declaration"
import { ParseError } from "./parse_error"

import { dasherize, uncapitalize } from "./util/string"

import { MethodDefinition, ValueDefinition, ClassDefinition, TargetDefinition } from "./controller_property_definition"

export class ControllerDefinition {
  readonly path: string
  readonly project: Project
  readonly classDeclaration: ClassDeclaration

  public isTyped: boolean = false
  public anyDecorator: boolean = false

  readonly errors: ParseError[] = []
  readonly methods: Array<MethodDefinition> = []
  readonly targets: Array<TargetDefinition> = []
  readonly classes: Array<ClassDefinition> = []
  readonly values: { [key: string]: ValueDefinition } = {}

  static controllerPathForIdentifier(identifier: string, fileExtension: string = "js"): string {
    const path = identifier.replace(/--/g, "/").replace(/-/g, "_")

    return `${path}_controller.${fileExtension}`
  }

  constructor(project: Project, path: string, classDeclaration: ClassDeclaration) {
    this.project = project
    this.path = path
    this.classDeclaration = classDeclaration
  }

  get hasErrors() {
    return this.errors.length > 0
  }

  get methodNames() {
    return this.methods.map(method => method.name)
  }

  get targetNames() {
    return this.targets.map(target => target.name)
  }

  get classNames() {
    return this.classes.map(klass => klass.name)
  }

  get valueDefinitions() {
    return Object.fromEntries(Object.entries(this.values).map(([key, def]) => [key, def.definition]))
  }

  get controllerPath() {
    return this.project.relativeControllerPath(this.path)
  }

  get isExported(): boolean {
    return this.classDeclaration.isExported
  }

  get isStimulusExport(): boolean {
    return this.classDeclaration.isStimulusExport
  }

  get identifier() {
    const className = this.classDeclaration?.className
    const hasMoreThanOneController = this.classDeclaration?.sourceFile.classDeclarations.filter(klass => klass.isStimulusDescendant).length > 1
    const isProjectFile = this.classDeclaration?.sourceFile.path.includes("node_modules")

    if (className && ((isProjectFile && hasMoreThanOneController) || (!isProjectFile))) {
      return dasherize(uncapitalize(className.replace("Controller", "")))
    }

    const folder = path.dirname(this.controllerPath)
    const extension = path.extname(this.controllerPath)
    const file = path.basename(this.controllerPath)
    const filename = path.basename(this.controllerPath, extension)

    if (file === `controller${extension}`) {
      return identifierForContextKey(`${folder}_${file}${extension}`) || ""
    } else if (!filename.endsWith("controller")) {
      return identifierForContextKey(`${folder}/${filename}_controller${extension}`) || ""
    } else {
      return identifierForContextKey(this.controllerPath) || ""
    }
  }

  get isNamespaced() {
    return this.identifier.includes("--")
  }

  get namespace() {
    const splits = this.identifier.split("--")

    return splits.slice(0, splits.length - 1).join("--")
  }

  get type() {
    const splits = this.path.split(".")
    const extension = splits[splits.length - 1]

    if (Project.javascriptExtensions.includes(extension)) return "javascript"
    if (Project.typescriptExtensions.includes(extension)) return "typescript"

    return "javascript"
  }

  addTargetDefinition(targetDefinition: TargetDefinition): void {
    if (this.targetNames.includes(targetDefinition.name)) {
      this.errors.push(new ParseError("LINT", `Duplicate definition of Stimulus target "${targetDefinition.name}"`, targetDefinition.loc))
    }

    this.targets.push(targetDefinition)
  }

  addClassDefinition(classDefinition: ClassDefinition) {
    if (this.classNames.includes(classDefinition.name)) {
      this.errors.push(new ParseError("LINT", `Duplicate definition of Stimulus class "${classDefinition.name}"`, classDefinition.loc))
    }

    this.classes.push(classDefinition)
  }

  addValueDefinition(valueDefinition: ValueDefinition) {
    if (this.values[valueDefinition.name]) {
      const error = new ParseError("LINT", `Duplicate definition of Stimulus value "${valueDefinition.name}"`, valueDefinition.loc)

      this.errors.push(error)
    } else {
      this.values[valueDefinition.name] = valueDefinition
    }
  }
}
