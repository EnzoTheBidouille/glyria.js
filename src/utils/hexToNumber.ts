export const hexToNumber = (hex: string): number => {
  return Number.parseInt(hex.replace("#", ""), 16)
}
