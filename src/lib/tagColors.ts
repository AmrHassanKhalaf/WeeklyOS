/**
 * Deterministic color picker for tags to give them a premium neon styling
 * matching the theme.
 */
export interface TagStyle {
  backgroundColor: string
  borderColor: string
  color: string
}

export function getTagStyle(tag: string): TagStyle {
  const normalized = tag.trim().toLowerCase();
  
  // Custom mapping for specific known tags to ensure perfect design match
  const customMap: Record<string, TagStyle> = {
    flutter: {
      backgroundColor: 'rgba(56, 189, 248, 0.08)', // sky-400 at 8%
      borderColor: 'rgba(56, 189, 248, 0.25)',     // sky-400 at 25%
      color: '#38bdf8',                           // sky-400
    },
    'big data': {
      backgroundColor: 'rgba(129, 140, 248, 0.08)', // indigo-400
      borderColor: 'rgba(129, 140, 248, 0.25)',
      color: '#818cf8',
    },
    'da prog': {
      backgroundColor: 'rgba(232, 121, 249, 0.08)', // fuchsia-400
      borderColor: 'rgba(232, 121, 249, 0.25)',
      color: '#e879f9',
    },
    'dv lab': {
      backgroundColor: 'rgba(52, 211, 153, 0.08)', // emerald-400
      borderColor: 'rgba(52, 211, 153, 0.25)',
      color: '#34d399',
    },
  }

  if (customMap[normalized]) {
    return customMap[normalized]
  }

  // Hash-based selection for any other tags
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }

  const schemes: TagStyle[] = [
    // Blue / Sky
    {
      backgroundColor: 'rgba(56, 189, 248, 0.08)',
      borderColor: 'rgba(56, 189, 248, 0.25)',
      color: '#38bdf8',
    },
    // Indigo
    {
      backgroundColor: 'rgba(129, 140, 248, 0.08)',
      borderColor: 'rgba(129, 140, 248, 0.25)',
      color: '#818cf8',
    },
    // Fuchsia
    {
      backgroundColor: 'rgba(232, 121, 249, 0.08)',
      borderColor: 'rgba(232, 121, 249, 0.25)',
      color: '#e879f9',
    },
    // Emerald
    {
      backgroundColor: 'rgba(52, 211, 153, 0.08)',
      borderColor: 'rgba(52, 211, 153, 0.25)',
      color: '#34d399',
    },
    // Orange
    {
      backgroundColor: 'rgba(251, 146, 60, 0.08)',
      borderColor: 'rgba(251, 146, 60, 0.25)',
      color: '#fb923c',
    },
    // Rose
    {
      backgroundColor: 'rgba(251, 113, 133, 0.08)',
      borderColor: 'rgba(251, 113, 133, 0.25)',
      color: '#fb7185',
    },
    // Cyan
    {
      backgroundColor: 'rgba(34, 211, 238, 0.08)',
      borderColor: 'rgba(34, 211, 238, 0.25)',
      color: '#22d3ee',
    },
    // Violet
    {
      backgroundColor: 'rgba(167, 139, 250, 0.08)',
      borderColor: 'rgba(167, 139, 250, 0.25)',
      color: '#a78bfa',
    },
  ]

  const index = Math.abs(hash) % schemes.length;
  return schemes[index];
}
