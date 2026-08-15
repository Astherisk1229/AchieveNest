/**
 * Utility helper for formatting and sorting names as: "Last Name, First Name Middle Name"
 */

export function parseFullName(fullName) {
  if (!fullName) return { lastName: '', firstMiddle: '', formatted: '' }

  const trimmed = String(fullName).trim()

  // If already formatted with a comma e.g. "Santos, Maria Clara"
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',')
    const lastName = parts[0].trim()
    const firstMiddle = parts.slice(1).join(',').trim()
    return {
      lastName,
      firstMiddle,
      formatted: firstMiddle ? `${lastName}, ${firstMiddle}` : lastName
    }
  }

  const tokens = trimmed.split(/\s+/)
  if (tokens.length === 1) {
    return { lastName: tokens[0], firstMiddle: '', formatted: tokens[0] }
  }

  // Common Philippine / Spanish compound last name prefixes
  const compoundPrefixes = ['dela', 'de la', 'de los', 'de las', 'del', 'de', 'san', 'santa', 'dos', 'van', 'von']

  let lastNameIndex = tokens.length - 1

  if (tokens.length >= 3) {
    const twoWordPrefix = `${tokens[tokens.length - 3]} ${tokens[tokens.length - 2]}`.toLowerCase()
    const oneWordPrefix = tokens[tokens.length - 2].toLowerCase()

    if (compoundPrefixes.includes(twoWordPrefix)) {
      lastNameIndex = tokens.length - 3
    } else if (compoundPrefixes.includes(oneWordPrefix)) {
      lastNameIndex = tokens.length - 2
    }
  } else if (tokens.length === 2) {
    const oneWordPrefix = tokens[0].toLowerCase()
    if (compoundPrefixes.includes(oneWordPrefix)) {
      lastNameIndex = 0
    }
  }

  const firstMiddle = tokens.slice(0, lastNameIndex).join(' ')
  const lastName = tokens.slice(lastNameIndex).join(' ')

  return {
    lastName,
    firstMiddle,
    formatted: firstMiddle ? `${lastName}, ${firstMiddle}` : lastName
  }
}

export function formatLastNameFirst(fullName) {
  return parseFullName(fullName).formatted
}
