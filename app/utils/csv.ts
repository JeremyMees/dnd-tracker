export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let index = 0; index < text.length; index++) {
    const char = text[index]!

    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"'
        index++
      } else if (char === '"') {
        quoted = false
      } else {
        field += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }

  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter(cells => cells.some(cell => cell.trim()))
}

export function parseCsv(text: string): Record<string, string>[] {
  const [header, ...rows] = parseCsvRows(text.replace(/^\uFEFF/, ''))

  if (!header) return []

  const keys = header.map(key => key.trim().toLowerCase())

  return rows.map(cells =>
    Object.fromEntries(
      keys.map((key, index) => [key, cells[index]?.trim() ?? '']),
    ),
  )
}
