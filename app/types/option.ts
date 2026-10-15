export interface Option<T> {
  label: string
  value: T
}

export interface ChoiceCardOption<T> extends Option<T> {
  icon: string
  iconClass?: string
  description?: string
}
