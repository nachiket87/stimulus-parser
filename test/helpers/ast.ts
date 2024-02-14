import type { ClassDeclaration } from "../../src/class_declaration"
import type { ImportDeclaration } from "../../src/import_declaration"
import type { ExportDeclaration } from "../../src/export_declaration"

export const stripNodeField = (object: any): any => {
  if (object?.node) {
    delete object.node
  }
}

// export const stripSuperClassField = (object: any): any => {
//   if (object?.superClass) {
//     object.superClass = { className: object.superClass?.className }
//   }
// }

export const nodelessCompare = (objects: (ImportDeclaration | ExportDeclaration)[]): (ImportDeclaration | ExportDeclaration)[] => {
  objects.forEach(stripNodeField)

  return objects
}

export const stripSuperClasses = (objects: any[]): any[] => {
  return objects.map(object => {
    stripNodeField(object)
    stripNodeField(object.importDeclaration)
    stripNodeField(object.exportDeclaration)

    // @ts-ignore
    delete object.sourceFile
    delete object?.controllerDefinition

    // @ts-ignore
    delete object?.importDeclaration?.sourceFile
    // @ts-ignore
    delete object?.exportDeclaration?.sourceFile

    if (object.superClass) {
      stripSuperClasses([object.superClass])
    }

    return object
  })
}
