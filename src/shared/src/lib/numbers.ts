export type ClampRange = {
  min: number
  max: number
  default: number
}

export type ClampWarning = {
  field: string
  message: string
  requested: number
  applied: number
}

export function clampNumber(
  value: number | undefined,
  range: ClampRange,
  warnings: ClampWarning[],
  field: string
): number {
  const requested = value ?? range.default
  let applied = requested
  if (requested < range.min) {
    applied = range.min
  }
  if (requested > range.max) {
    applied = range.max
  }
  if (applied !== requested) {
    warnings.push({
      field,
      requested,
      applied,
      message: `${field} clamped to ${applied}`,
    })
  }
  return applied
}
