import User from '#models/user'

export async function getEffectivePermissionSlugs(actor: User): Promise<Set<string>> {
  await actor.load('permissions')
  await actor.load('roles', (q) => q.preload('permissions'))

  const slugs = new Set<string>()
  for (const p of actor.permissions) slugs.add(p.slug)
  for (const r of actor.roles) for (const p of r.permissions) slugs.add(p.slug)
  return slugs
}

