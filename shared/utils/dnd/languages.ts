export function parseDndLanguages(languages: DndLanguage[]): string[] {
  return languages.map(language => language.name)
}
