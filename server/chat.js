import { openAiApiKey } from './config.js'
import { generateAnswer } from './openai.js'
import { listPassages, rankKeywordPassages, terms } from './search.js'

const seedFilename = 'diu_knowledge_base.pdf'
const noEvidence = 'I couldn’t find enough information in the available DIU documents to answer that question.'
const money = new Intl.NumberFormat('en')
const filler = new Set(['about', 'current', 'give', 'information', 'know', 'listed', 'official', 'only', 'want'])
const feeTerms = new Set(['amount', 'bdt', 'cost', 'fee', 'pay', 'per', 'price', 'semester', 'total', 'tuition'])
const tuitionHeader = 'Program | Semester BDT | Total BDT'
const intentRules = [
  [/\b(?:library opening|library closing|library schedule)\b/g, 'library hours'],
  [/\b(?:when (?:does|is) (?:the )?library (?:open|close)|what time (?:does|is) (?:the )?library (?:open|close))\b/g, 'library hours'],
  [/\b(?:combine|stack|multiple|more than one|at the same time)\b/g, 'overlap'],
  [/\b(?:located|location|address)\b/g, 'campus'],
  [/\b(?:application|applying) deadline\b/g, 'admission deadline'],
  [/\b(?:costs?|prices?)\b/g, 'cost'],
]

function normalizeQuestion(question) {
  let text = question.toLowerCase()
  for (const [pattern, replacement] of intentRules) text = text.replace(pattern, replacement)
  return [...new Set(terms(text).filter((term) => !filler.has(term)))]
}

function displayText(text) {
  return text.replace(/\s*Source:\s*https?:\/\/\S+/gi, '').trim()
}

function findTuitionAnswer(passages, query) {
  if (!query.length) return null
  const programTerms = query.filter((term) => !feeTerms.has(term))

  for (const passage of passages) {
    const [header, ...lines] = displayText(passage.text).split('\n')
    if (header !== tuitionHeader) continue

    if (!programTerms.length) {
      return {
        answer: 'Which program’s tuition fees would you like to check?',
        sources: [],
      }
    }

    const matches = lines.map((line) => line.split(' | ')).filter(([program, semester, total]) =>
      /^\d[\d,]*$/.test(semester) && /^\d[\d,]*$/.test(total) &&
      programTerms.every((term) => terms(program).includes(term)),
    )
    if (!matches.length) continue

    const excerpt = [header, ...matches.map((row) => row.join(' | '))].join('\n')
    const sources = [citePassage(passage, excerpt)]
    if (matches.length > 1) {
      const programs = matches.map(([program]) => program)
      return { answer: `Which program do you mean: ${programs.join(' or ')}?`, sources }
    }

    const [[program, semester, total]] = matches
    const perSemester = `BDT ${money.format(Number(semester.replaceAll(',', '')))} per semester`
    const inTotal = `BDT ${money.format(Number(total.replaceAll(',', '')))} in total`
    const wantsSemester = query.includes('semester')
    const wantsTotal = query.includes('total')
    const fee = wantsSemester === wantsTotal ? `${perSemester} and ${inTotal}` : wantsSemester ? perSemester : inTotal
    return {
      answer: `The available PDF lists ${program} at ${fee}. Check the official fee schedule for the latest amounts.`,
      sources,
    }
  }

  return null
}

function answerFromPassage(passage, query) {
  const text = displayText(passage.text)
  if (text.split('\n', 1)[0] === tuitionHeader) return null

  if (/^(?:scope warning|coverage limitations|remaining program fees):/i.test(text)) return null

  const evidenceTerms = new Set(terms(`${passage.section} ${text}`))
  const hasRequestedEvidence = query.every((term) => {
    if (term === 'hour' && /\b\d{1,2}:\d{2}\b/.test(text)) return true
    if (term === 'deadline' && /\bapply by\b/i.test(text)) return true
    return evidenceTerms.has(term)
  })
  return hasRequestedEvidence ? text : null
}

function citePassage(passage, excerpt = displayText(passage.text)) {
  return {
    filename: passage.filename,
    page: passage.page,
    excerpt,
    links: passage.urls,
    pdfUrl: passage.filename === seedFilename ? '/api/sources/diu-knowledge-base' : null,
  }
}

export async function answerQuestion(database, question) {
  const query = normalizeQuestion(question)
  const keywordQuery = query.join(' ')
  const passages = await listPassages(database)
  if (!passages.length) return { answer: noEvidence, sources: [] }

  const tuitionAnswer = findTuitionAnswer(passages, query)
  if (tuitionAnswer) return tuitionAnswer

  let notice = 'AI is not configured. This response uses document search.'
  if (openAiApiKey) {
    try {
      const result = await generateAnswer(passages, question, keywordQuery)
      return {
        answer: result.answer || noEvidence,
        sources: result.citations.map(({ passage, excerpt }) => citePassage(passage, excerpt)),
      }
    } catch (error) {
      const reason = Number.isInteger(error.status) ? `HTTP ${error.status}` : error.name
      console.warn(`AI answer unavailable (${reason}). Using document search.`)
      notice = 'AI is temporarily unavailable. This response uses document search.'
    }
  }

  for (const passage of rankKeywordPassages(passages, keywordQuery)) {
    const answer = answerFromPassage(passage, query)
    if (answer) return { answer, sources: [citePassage(passage)], notice }
  }

  return { answer: noEvidence, sources: [], notice }
}
