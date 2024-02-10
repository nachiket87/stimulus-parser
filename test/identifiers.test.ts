import { expect, test } from "vitest"
import { Project, ControllerDefinition } from "../src"

const project = new Project(process.cwd())

test("top-level", () => {
  const controller = new ControllerDefinition(project, "some_controller.js")

  expect(controller.identifier).toEqual("some")
})

test("top-level underscored", () => {
  const controller = new ControllerDefinition(project, "some_underscored_controller.js")

  expect(controller.identifier).toEqual("some-underscored")
})

test("top-level dasherized", () => {
  const controller = new ControllerDefinition(project, "some-underscored_controller.js")

  expect(controller.identifier).toEqual("some-underscored")
})

test("namespaced", () => {
  const controller = new ControllerDefinition(project, "namespaced/some_controller.js")

  expect(controller.identifier).toEqual("namespaced--some")
})

test("deeply nested", () => {
  const controller = new ControllerDefinition(project, "a/bunch/of/levels/some_controller.js")

  expect(controller.identifier).toEqual("a--bunch--of--levels--some")
})

test("deeply nested underscored", () => {
  const controller = new ControllerDefinition(project, "a/bunch/of/levels/some_underscored_controller.js")

  expect(controller.identifier).toEqual("a--bunch--of--levels--some-underscored")
})

test("deeply nested dasherized", () => {
  const controller = new ControllerDefinition(project, "a/bunch/of/levels/some-underscored_controller.js")

  expect(controller.identifier).toEqual("a--bunch--of--levels--some-underscored")
})

test("deeply nested all dasherized", () => {
  const controller = new ControllerDefinition(project, "a/bunch/of/levels/some-underscored-controller.js")

  expect(controller.identifier).toEqual("a--bunch--of--levels--some-underscored")
})

// TODO: update implementation once this gets released
// https://github.com/hotwired/stimulus-webpack-helpers/pull/3
test("nested with only controller", () => {
  const controller1 = new ControllerDefinition(project, "a/bunch/of/levels/controller.js")
  const controller2 = new ControllerDefinition(project, "a/bunch/of/levels/controller.ts")

  expect(controller1.identifier).toEqual("a--bunch--of--levels")
  expect(controller2.identifier).toEqual("a--bunch--of--levels")
})

test("without controller suffix", () => {
  const controller1 = new ControllerDefinition(project, "something.js")
  const controller2 = new ControllerDefinition(project, "something.ts")

  expect(controller1.identifier).toEqual("something")
  expect(controller2.identifier).toEqual("something")
})

test("nested without controller suffix", () => {
  const controller1 = new ControllerDefinition(project, "a/bunch/of/levels/something.js")
  const controller2 = new ControllerDefinition(project, "a/bunch/of/levels/something.ts")

  expect(controller1.identifier).toEqual("a--bunch--of--levels--something")
  expect(controller2.identifier).toEqual("a--bunch--of--levels--something")
})

test("controller with dashes and underscores", () => {
  const controller1 = new ControllerDefinition(project, "some-thing_controller.js")
  const controller2 = new ControllerDefinition(project, "some-thing_controller.ts")
  const controller3 = new ControllerDefinition(project, "some_thing-controller.js")
  const controller4 = new ControllerDefinition(project, "some_thing-controller.ts")

  expect(controller1.identifier).toEqual("some-thing")
  expect(controller2.identifier).toEqual("some-thing")
  expect(controller3.identifier).toEqual("some-thing")
  expect(controller4.identifier).toEqual("some-thing")
})

test("controller with dasherized name", () => {
  const controller1 = new ControllerDefinition(project, "some-thing-controller.js")
  const controller2 = new ControllerDefinition(project, "some-thing-controller.ts")

  expect(controller1.identifier).toEqual("some-thing")
  expect(controller2.identifier).toEqual("some-thing")
})

test("nested controller with dasherized name", () => {
  const controller1 = new ControllerDefinition(project, "a/bunch-of/levels/some-thing-controller.js")
  const controller2 = new ControllerDefinition(project, "a/bunch-of/levels/some-thing-controller.ts")

  expect(controller1.identifier).toEqual("a--bunch-of--levels--some-thing")
  expect(controller2.identifier).toEqual("a--bunch-of--levels--some-thing")
})
