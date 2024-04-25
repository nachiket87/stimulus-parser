import { describe, test, expect } from "vitest"
import { setupProject } from "../helpers/setup"

const project = setupProject("vite-rails")

describe("System", () => {
  test("vite-rails", async () => {
    expect(project.controllersFile).toBeUndefined()
    expect(project.applicationFile).toBeUndefined()
    expect(project.registeredControllers.length).toEqual(0)

    await project.initialize()

    expect(project.applicationFile).toBeDefined()
    expect(project.applicationFile.localApplicationConstant).toEqual("application")
    expect(project.applicationFile.exportedApplicationConstant).toEqual("application")
    expect(project.relativePath(project.applicationFile.path)).toEqual("app/frontend/controllers/application.js")

    expect(project.controllersFile).toBeDefined()
    expect(project.controllersFile.applicationImport).toBeDefined()
    expect(project.controllersFile.localApplicationConstant).toEqual("application")
    expect(project.relativePath(project.controllersFile.path)).toEqual("app/frontend/controllers/index.js")

    expect(project.registeredControllers.length).toEqual(1)
    expect(project.registeredControllers.map(controller => [controller.identifier, controller.loadMode])).toEqual([["hello", "stimulus-vite-helpers"]])
    expect(Array.from(project.controllerRoots)).toEqual(["app/frontend/controllers"])
  })
})
