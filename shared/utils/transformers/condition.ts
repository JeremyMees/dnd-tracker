import { conditionHasLevels, mapConditionDescription } from './utils'

function mapConditionV1(dto: Open5eV1Item): DndCondition {
  const hasLevels = conditionHasLevels(dto.name)
  const level = parseIntegerFromText(dto.level, hasLevels ? 1 : 0)

  return {
    id: dto.slug,
    name: dto.name,
    desc: mapConditionDescription(dto.desc, dto.effects_desc),
    ...(hasLevels ? { hasLevels: true, level: level || 1 } : {}),
  }
}

function mapConditionV2(dto: Open5eCondition, preferredDocuments?: string[]): DndCondition {
  const hasLevels = conditionHasLevels(dto.name)

  const priority = preferredDocuments?.length ? preferredDocuments : ['srd-2024', 'srd-2014']
  const descEntry = priority
    .map(doc => dto.descriptions.find(d => d.document === doc))
    .find(Boolean) ?? dto.descriptions[0]

  return {
    id: dto.key,
    name: dto.name,
    desc: descEntry?.desc ?? '',
    ...(hasLevels ? { hasLevels: true, level: 1 } : {}),
  }
}

export function toCondition(dto: Open5eCondition | Open5eV1Item, preferredDocuments?: string[]): DndCondition {
  return 'slug' in dto ? mapConditionV1(dto) : mapConditionV2(dto, preferredDocuments)
}
