const stopWords = new Set(
  'a an and are at be by can could did do does for from had has have how i in is it many me much of on or please s should tell than that the their this to was were what when where which who will with would you your diu university'.split(' '),
)

export function terms(text) {
  const words = text.toLowerCase().match(/[a-z]+|\d+/g) || []

  return words.filter((word) => !stopWords.has(word)).map((word) => {
    if (word.length > 4 && word.endsWith('ies')) return word.slice(0, -3) + 'y'
    if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
    return word
  })
}

export async function listPassages(database) {
  const documents = await database.collection('knowledgeSources')
    .find({}, { projection: { filename: 1, passages: 1 }, maxTimeMS: 2000, sort: { _id: 1 } })
    .toArray()

  const passages = documents.flatMap(({ filename, passages }) =>
    passages.map((passage) => ({ filename, ...passage })),
  )
  if (!passages.some(({ tuition }) => tuition)) return passages
  return passages.filter(({ filename, text }) =>
    filename !== 'diu_knowledge_base.pdf' || !text.startsWith('Program | Semester BDT | Total BDT\n'),
  )
}

export function rankKeywordPassages(passages, query, limit = 3) {
  const queryTerms = [...new Set(terms(query))]
  if (!queryTerms.length) return []

  const candidates = passages.map((passage) => ({
    result: passage,
    body: new Set(terms(passage.text.replace(/https?:\/\/\S+/g, ''))),
    heading: new Set(terms(passage.section)),
  }))

  const weights = new Map(queryTerms.map((term) => {
    const frequency = candidates.filter(({ body, heading }) => body.has(term) || heading.has(term)).length
    return [term, Math.log1p(candidates.length / (frequency + 1))]
  }))

  return candidates.map(({ result, body, heading }) => {
    const score = queryTerms.reduce((total, term) => {
      if (body.has(term)) return total + weights.get(term)
      if (heading.has(term)) return total + weights.get(term) * 0.5
      return total
    }, 0)
    return { result, score }
  })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map(({ result }) => result)
}

export async function searchPassages(database, query) {
  if (!terms(query).length) return []
  return rankKeywordPassages(await listPassages(database), query)
}
