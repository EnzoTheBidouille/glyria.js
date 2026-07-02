import { describe, it, expect } from "vitest"
import { hexToNumber } from "../src/utils/hexToNumber.js"

describe("hexToNumber", () => {
  it("converts a 6-digit hex with #", () => {
    expect(hexToNumber("#5865F2")).toBe(0x5865f2)
  })

  it("converts a 6-digit hex without #", () => {
    expect(hexToNumber("57F287")).toBe(0x57f287)
  })

  it("expands 3-digit shorthand", () => {
    expect(hexToNumber("#FFF")).toBe(0xffffff)
    expect(hexToNumber("#F00")).toBe(0xff0000)
  })

  it("throws on invalid input", () => {
    expect(() => hexToNumber("not-a-color")).toThrow()
    expect(() => hexToNumber("#12345")).toThrow()
    expect(() => hexToNumber("")).toThrow()
  })
})
