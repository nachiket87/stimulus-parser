import { describe, expect, test } from "vitest"
import { Project, SourceFile } from "../../src"
import { nodelessCompare, stripSuperClasses } from "../helpers/ast"

const project = new Project(process.cwd())

describe("SourceFile", () => {
  describe("class exports", () => {
    test("export named class", () => {
      const code = `
        class Something {}
        export { Something }
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      const exportDeclaration = {
        exportedName: "Something",
        localName: "Something",
        isStimulusExport: false,
        type: "named",
        source: undefined,
      }

      expect(nodelessCompare(sourceFile.exportDeclarations)).toEqual([exportDeclaration])

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([{
        className: "Something",
        isStimulusDescendant: false,
        superClass: undefined,
        exportDeclaration
      }])
    })

    test("import and export named class", () => {
      const code = `
        import { SuperClass } from "./super_class"

        class Something extends SuperClass {}

        export { Something }
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      const importDeclaration = {
        isStimulusImport: false,
        localName: "SuperClass",
        originalName: "SuperClass",
        source: "./super_class"
      }

      const exportDeclaration = {
        exportedName: "Something",
        localName: "Something",
        isStimulusExport: false,
        type: "named",
        source: undefined,
      }

      expect(nodelessCompare(sourceFile.importDeclarations)).toEqual([importDeclaration])
      expect(nodelessCompare(sourceFile.exportDeclarations)).toEqual([exportDeclaration])

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([{
        className: "Something",
        isStimulusDescendant: false,
        superClass: {
          className: "SuperClass",
          isStimulusDescendant: false,
          importDeclaration
        },
        exportDeclaration
      }])
    })

    test("import and export named Controller", () => {
      const code = `
        import { Controller } from "@hotwired/stimulus"

        class Something extends Controller {}

        export { Something }
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      const importDeclaration = {
        isStimulusImport: true,
        localName: "Controller",
        originalName: "Controller",
        source: "@hotwired/stimulus"
      }

      const exportDeclaration = {
        exportedName: "Something",
        localName: "Something",
        isStimulusExport: true,
        type: "named",
        source: undefined,
      }

      expect(nodelessCompare(sourceFile.importDeclarations)).toEqual([importDeclaration])
      expect(nodelessCompare(sourceFile.exportDeclarations)).toEqual([exportDeclaration])

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([{
        className: "Something",
        isStimulusDescendant: true,
        superClass: {
          className: "Controller",
          isStimulusDescendant: true,
          importDeclaration
        },
        exportDeclaration
      }])
    })

    test("import and export named Controller with alias", () => {
      const code = `
        import { Controller } from "@hotwired/stimulus"

        class Something extends Controller {}

        export { Something as SomethingController }
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      const importDeclaration = {
        isStimulusImport: true,
        localName: "Controller",
        originalName: "Controller",
        source: "@hotwired/stimulus"
      }

      const exportDeclaration = {
        exportedName: "SomethingController",
        localName: "Something",
        isStimulusExport: true,
        type: "named",
        source: undefined,
      }

      expect(nodelessCompare(sourceFile.importDeclarations)).toEqual([importDeclaration])
      expect(nodelessCompare(sourceFile.exportDeclarations)).toEqual([exportDeclaration])

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([{
        className: "Something",
        isStimulusDescendant: true,
        superClass: {
          className: "Controller",
          isStimulusDescendant: true,
          importDeclaration
        },
        exportDeclaration
      }])
    })

    test("import and export default Controller", () => {
      const code = `
        import { Controller } from "@hotwired/stimulus"

        class Something extends Controller {}

        export default Something
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      const importDeclaration = {
        isStimulusImport: true,
        localName: "Controller",
        originalName: "Controller",
        source: "@hotwired/stimulus"
      }

      const exportDeclaration = {
        exportedName: undefined,
        localName: "Something",
        isStimulusExport: true,
        type: "default",
      }

      expect(nodelessCompare(sourceFile.importDeclarations)).toEqual([importDeclaration])
      expect(nodelessCompare(sourceFile.exportDeclarations)).toEqual([exportDeclaration])

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([{
        className: "Something",
        isStimulusDescendant: true,
        superClass: {
          className: "Controller",
          isStimulusDescendant: true,
          importDeclaration
        },
        exportDeclaration
      }])
    })

    test("import and export default Controller in single statement", () => {
      const code = `
        import { Controller } from "@hotwired/stimulus"

        export default class Something extends Controller {}
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      const importDeclaration = {
        isStimulusImport: true,
        localName: "Controller",
        originalName: "Controller",
        source: "@hotwired/stimulus"
      }

      const exportDeclaration = {
        exportedName: undefined,
        localName: "Something",
        isStimulusExport: true,
        type: "default"
      }

      expect(nodelessCompare(sourceFile.importDeclarations)).toEqual([importDeclaration])
      expect(nodelessCompare(sourceFile.exportDeclarations)).toEqual([exportDeclaration])

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([{
        className: "Something",
        isStimulusDescendant: true,
        superClass: {
          className: "Controller",
          isStimulusDescendant: true,
          importDeclaration
        },
        exportDeclaration
      }])
    })

    test("import and export default anonymous Controller class in single statement", () => {
      const code = `
        import { Controller } from "@hotwired/stimulus"

        export default class extends Controller {}
      `

      const sourceFile = new SourceFile("abc.js", code, project)
      sourceFile.analyze()

      const importDeclaration = {
        isStimulusImport: true,
        localName: "Controller",
        originalName: "Controller",
        source: "@hotwired/stimulus"
      }

      const exportDeclaration = {
        exportedName: undefined,
        localName: undefined,
        isStimulusExport: true,
        type: "default"
      }

      expect(nodelessCompare(sourceFile.importDeclarations)).toEqual([importDeclaration])
      expect(nodelessCompare(sourceFile.exportDeclarations)).toEqual([exportDeclaration])

      expect(stripSuperClasses(sourceFile.classDeclarations)).toEqual([{
        className: undefined,
        isStimulusDescendant: true,
        superClass: {
          className: "Controller",
          isStimulusDescendant: true,
          importDeclaration
        },
        exportDeclaration
      }])
    })

  })
})
