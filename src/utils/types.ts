export type ConditionalClasses = Record<string, boolean>
export type Classes<T extends string> = Partial<Record<T, string | ConditionalClasses> | undefined>

export type StyleObject = Record<string, string | number>
export type Styles<T extends string> = Partial<Record<T, string | StyleObject>>
