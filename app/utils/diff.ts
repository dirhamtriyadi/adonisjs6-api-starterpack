export function computeChangedFields(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined
): string[] {
  try {
    const b = before ?? {}
    const a = after ?? {}
    const keys = new Set<string>([...Object.keys(b), ...Object.keys(a)])
    const changed: string[] = []
    for (const key of keys) {
      const bv = (b as Record<string, unknown>)[key]
      const av = (a as Record<string, unknown>)[key]
      if (JSON.stringify(bv) !== JSON.stringify(av)) changed.push(key)
    }
    return changed
  } catch {
    return []
  }
}

