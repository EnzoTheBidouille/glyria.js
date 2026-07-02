export const hexToNumber = (hex: string): number => {
  let value = hex.replace("#", "")

  // expand shorthand ("FFF" -> "FFFFFF")
  if (/^[0-9a-fA-F]{3}$/.test(value)) {
    value = value
      .split("")
      .map((c) => c + c)
      .join("")
  }

  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    throw new Error(`hexToNumber: invalid hex color "${hex}"`)
  }

  return Number.parseInt(value, 16)
}
