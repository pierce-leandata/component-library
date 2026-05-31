import { Classes, StyleObject, Styles } from './types'

export function generateId() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890'
  const id = new Array(8)
    .fill(null)
    .map(() => {
      return characters.at(Math.round(Math.random() * (characters.length - 1)))
    })
    .join('')

  return `pm-${id}`
}

/**
 * Extracts visible text from HTML, trimming and normalizing all spaces to ' '.
 */
export function extractTextFromHtml(html: HTMLElement) {
  return html.innerText.replaceAll(/\s+/g, ' ').trim()
}

/**
 * Get a string of classes from an item in a Classes object.
 * Can be used in a template with [class]="<return value>"
 */
export function getClassString<T extends string>(
  classes: Classes<T> | undefined,
  key: T,
): string | undefined {
  if (!classes?.[key]) return undefined
  if (typeof classes[key] === 'string') return classes[key]
  return Object.entries(classes[key])
    .filter(([, isApplied]) => isApplied)
    .map(([key]) => key)
    .join(' ')
}

/**
 * Get an object of styles from an item in a Styles object.
 * Can be used in a template with [style]="<return value>".
 * User-creates styles should be placed before any necessary component styles.
 */
export function getStyleObject<T extends string>(
  styles: Styles<T> | undefined,
  key: T,
): StyleObject {
  if (!styles?.[key]) return {}
  const s = styles[key]
  if (typeof s === 'object') return s

  // expect string to be in "key1: value1; key2: value2; ..." format
  return Object.fromEntries(
    s
      .replaceAll(/\s+/g, ' ')
      .replaceAll(/(([:;]) )/g, '$2')
      .split(';')
      .map((pair) => pair.split(':'))
      .filter((pair) => pair.length === 2 && !!pair[0] && !!pair[1]),
  )
}
