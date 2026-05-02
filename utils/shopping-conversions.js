const DENSITY_BY_KEYWORD = [
  { match: /aceite|oil/i, gramsPerMl: 0.92 },
  { match: /miel|honey/i, gramsPerMl: 1.42 },
  { match: /leche|milk|caldo|zumo|agua|vinagre|salsa/i, gramsPerMl: 1 },
  { match: /yogur|nata|crema/i, gramsPerMl: 1.03 },
]

const PIECE_WEIGHTS = [
  { match: /huevo/i, grams: 60 },
  { match: /cebolla/i, grams: 150 },
  { match: /ajo/i, grams: 5 },
  { match: /tomate/i, grams: 125 },
  { match: /pimiento/i, grams: 160 },
  { match: /zanahoria/i, grams: 75 },
  { match: /lechuga/i, grams: 300 },
  { match: /pan/i, grams: 250 },
  { match: /yogur/i, grams: 125 },
  { match: /fruta|manzana|pera|naranja/i, grams: 180 },
]

const TABLESPOON_ML = 15
const TEASPOON_ML = 5

export function convertToGrams({ name = '', quantity = 0, unitType = 'g' }) {
  const amount = Number(quantity) || 0
  const unit = normalizeUnit(unitType)

  if (amount <= 0) {
    return ambiguous(0, 'Cantidad no positiva.')
  }

  if (unit === 'g') {
    return exact(amount, 'Ya estaba en gramos.')
  }

  if (unit === 'kg') {
    return exact(amount * 1000, 'Convertido desde kg.')
  }

  if (unit === 'ml') {
    const density = densityFor(name)
    return density.known
      ? estimated(amount * density.gramsPerMl, `Densidad usada: ${density.gramsPerMl} g/ml.`)
      : ambiguous(amount, 'Densidad desconocida; se asume 1 g/ml hasta editar.')
  }

  if (unit === 'l') {
    const density = densityFor(name)
    return density.known
      ? estimated(amount * 1000 * density.gramsPerMl, `Densidad usada: ${density.gramsPerMl} g/ml.`)
      : ambiguous(amount * 1000, 'Densidad desconocida; se asume 1 g/ml hasta editar.')
  }

  if (unit === 'cucharada' || unit === 'tbsp') {
    const density = densityFor(name)
    return density.known
      ? estimated(amount * TABLESPOON_ML * density.gramsPerMl, 'Convertido desde cucharadas.')
      : ambiguous(amount * TABLESPOON_ML, 'Cucharada ambigua; se asume 15 g hasta editar.')
  }

  if (unit === 'cucharadita' || unit === 'tsp') {
    const density = densityFor(name)
    return density.known
      ? estimated(amount * TEASPOON_ML * density.gramsPerMl, 'Convertido desde cucharaditas.')
      : ambiguous(amount * TEASPOON_ML, 'Cucharadita ambigua; se asume 5 g hasta editar.')
  }

  if (unit === 'ud' || unit === 'unidad' || unit === 'pieza' || unit === 'pack') {
    const piece = pieceWeightFor(name)
    return piece
      ? estimated(amount * piece, `Peso medio usado: ${piece} g por unidad.`)
      : ambiguous(amount * 100, 'Unidad ambigua; se asume 100 g hasta editar.')
  }

  return ambiguous(amount, `Unidad "${unitType}" no reconocida.`)
}

export function formatGrams(value) {
  const grams = Number(value) || 0
  return `${Math.round(grams)} g`
}

export function buildShoppingListText(items) {
  return items
    .map((item) => {
      const mark = item.purchased ? 'x' : ' '
      const name = item.item_name || item.ingredients?.name || 'Artículo'
      return `- [${mark}] ${name}: ${formatGrams(item.quantity_grams ?? item.quantity_needed)}`
    })
    .join('\n')
}

export function buildShoppingCsv(items) {
  const rows = [['nombre', 'gramos', 'comprado', 'conversion']]
  for (const item of items) {
    rows.push([
      item.item_name || item.ingredients?.name || 'Artículo',
      Math.round(Number(item.quantity_grams ?? item.quantity_needed) || 0),
      item.purchased ? 'si' : 'no',
      item.conversion_status || 'exact',
    ])
  }
  return rows.map((row) => row.map(csvEscape).join(',')).join('\n')
}

function normalizeUnit(unit) {
  return String(unit || 'g').trim().toLowerCase()
}

function densityFor(name) {
  const found = DENSITY_BY_KEYWORD.find((entry) => entry.match.test(name))
  return found ? { known: true, gramsPerMl: found.gramsPerMl } : { known: false, gramsPerMl: 1 }
}

function pieceWeightFor(name) {
  return PIECE_WEIGHTS.find((entry) => entry.match.test(name))?.grams || null
}

function exact(grams, note) {
  return result(grams, 'exact', note)
}

function estimated(grams, note) {
  return result(grams, 'estimated', note)
}

function ambiguous(grams, note) {
  return result(grams, 'ambiguous', note)
}

function result(grams, status, note) {
  return {
    grams: Math.max(1, Math.round((Number(grams) || 0) * 10) / 10),
    status,
    note,
  }
}

function csvEscape(value) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}
