const modules = import.meta.glob<{ default: Changelog }>('./*.json', {
  eager: true,
})

function parseVersion(version: string): number[] {
  return version.replaceAll('v', '').split('.').map(Number)
}

export const changelogs = Object.values(modules)
  .map(module => module.default)
  .sort((a, b) => {
    const versionA = parseVersion(a.version)
    const versionB = parseVersion(b.version)

    for (let i = 0; i < 3; i++) {
      const partA = versionA[i] ?? 0
      const partB = versionB[i] ?? 0

      if (partB !== partA) return partB - partA
    }

    return 0
  })
