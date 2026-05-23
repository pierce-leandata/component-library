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
