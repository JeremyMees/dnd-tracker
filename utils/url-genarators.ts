export function generateParams<T extends object>(data: T): string {
  return Object.keys(data)
    .map(key => `${key}=${data[key as keyof T]}`)
    .join('&')
}
