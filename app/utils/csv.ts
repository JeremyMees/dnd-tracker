function readQuoted(
  text: string,
  start: number,
): { value: string; end: number } {
  let value = ''
  let index = start

  while (index < text.length) {
    const char = text[index]!

    if (char !== '"') {
      value += char
      index++
    } else if (text[index + 1] === '"') {
      value += '"'
      index += 2
    } else {
      return { value, end: index + 1 }
    }
  }

  return { value, end: index }
}

export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let index = 0

  while (index < text.length) {
    const char = text[index]!

    if (char === '"') {
      const quoted = readQuoted(text, index + 1)

      field += quoted.value
      index = quoted.end
      continue
    }

    if (char === ',') {
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

    index++
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
