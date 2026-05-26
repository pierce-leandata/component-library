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
