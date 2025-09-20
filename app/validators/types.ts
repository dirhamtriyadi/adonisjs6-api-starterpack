export type ValidationMeta = {
  currentUserId?: number
  currentRoleId?: number
  // Extend safely with future keys
  [key: string]: unknown
}

export function getValidationMeta(meta: unknown): ValidationMeta {
  const m = (meta ?? {}) as Record<string, unknown>
  return m as ValidationMeta
}

