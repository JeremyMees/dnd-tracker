import { speedMap, sightRangeMap, skillMap } from '~~/constants/dnd'

export function generateSpeedEntries(speed: DndSpeed): { label: string, val: string }[] {
  const entries: { label: string, val: string }[] = []
  if (speed.walk) entries.push({ label: speedMap.walk, val: `${speed.walk} ${speed.unit}` })
  if (speed.fly) entries.push({ label: speedMap.fly, val: `${speed.fly} ${speed.unit}` })
  if (speed.swim) entries.push({ label: speedMap.swim, val: `${speed.swim} ${speed.unit}` })
  if (speed.burrow) entries.push({ label: speedMap.burrow, val: `${speed.burrow} ${speed.unit}` })
  if (speed.climb) entries.push({ label: speedMap.climb, val: `${speed.climb} ${speed.unit}` })
  if (speed.crawl) entries.push({ label: speedMap.crawl, val: `${speed.crawl} ${speed.unit}` })
  return entries
}

export function generateSightEntries(sight: DndSight): { label: string, val: string }[] {
  const entries: { label: string, val: string }[] = []
  if (sight.normalSightRange) entries.push({ label: sightRangeMap.normalSightRange, val: `${sight.normalSightRange} ft` })
  if (sight.darkVisionRange) entries.push({ label: sightRangeMap.darkVisionRange, val: `${sight.darkVisionRange} ft` })
  if (sight.blindSightRange) entries.push({ label: sightRangeMap.blindSightRange, val: `${sight.blindSightRange} ft` })
  if (sight.tremorSenseRange) entries.push({ label: sightRangeMap.tremorSenseRange, val: `${sight.tremorSenseRange} ft` })
  if (sight.trueSightRange) entries.push({ label: sightRangeMap.trueSightRange, val: `${sight.trueSightRange} ft` })
  return entries
}

export function generateSkillEntries(skillBonuses: DndSkillBonuses): { key: DndSkill, label: string, val: number }[] {
  return (Object.keys(skillBonuses) as DndSkill[]).map(key => ({
    key,
    label: skillMap[key],
    val: skillBonuses[key],
  }))
}
