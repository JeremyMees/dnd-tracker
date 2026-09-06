import { conditionHasLevels } from './utils'

export function toCondition(
  dto: Open5eCondition,
  preferredDocuments?: string[],
): DndCondition {
  const hasLevels = conditionHasLevels(dto.name)

  const priority = preferredDocuments?.length
    ? preferredDocuments
    : ['srd-2024', 'srd-2014']
  const descEntry =
    priority
      .map(doc => dto.descriptions.find(d => d.document === doc))
      .find(Boolean) ?? dto.descriptions[0]

  return {
    id: dto.key,
    name: dto.name,
    desc: descEntry?.desc ?? '',
    ...(hasLevels ? { hasLevels: true, level: 1 } : {}),
  }
}
