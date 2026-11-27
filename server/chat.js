import { aiProvider, continueConversation, generateAnswer } from './ai.js'
import { listPassages, rankKeywordPassages, terms } from './search.js'
import { findProgramTuition } from './tuition.js'

const seedFilename = 'diu_knowledge_base.pdf'
const noEvidence = 'I’m not sure about that one. Can you tell me a little more about what you’re looking for?'
const replyUnavailable = 'I’m having trouble replying right now. Could you try again in a bit?'
const smallTalk = [
  [/^(?:hi+|hey+|hello+)(?: there)?$/i, 'Hey! What’s on your mind?'],
  [/^good (?:morning|afternoon|evening)$/i, 'Hello! How’s your day going?'],
  [/^(?:(?:hi|hey|hello),? )?(?:how are you|how’s it going|what’s up)$/i, 'I’m doing well! How about you?'],
  [/^(?:thanks(?: a lot)?|thank you(?: so much)?)$/i, 'You’re welcome!'],
  [/^(?:bye|goodbye|see you(?: later)?)$/i, 'See you later!'],
]
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
  [/\bhow much\b/g, 'cost'],
  [/\bbreak\s+down\b/g, 'breakdown'],
  [/\bb\.\s*sc\b/g, 'bsc'],
  [/\b(?:costs?|prices?)\b/g, 'cost'],
]

function normalizeQuestion(question) {
  let text = question.toLowerCase().replace(/^(?:hi+|hey+|hello+)[,.!]?[ \t]+/, '')
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
      answer: `${program} costs ${fee}. Check DIU’s fee schedule for the latest amounts.`,
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
  if (!hasRequestedEvidence) return null

  return text
    .replace(/^Library: Sat-Thu (\d{1,2}:\d{2})-(\d{1,2}:\d{2}); Friday (\d{1,2}:\d{2})-(\d{1,2}:\d{2})\.$/i,
      'The library is open $1–$2 from Saturday to Thursday and $3–$4 on Fridays.')
    .replace(/^Admissions: .*?Indexed tuition page shows (.+?) apply by (.+?) and admission test (.+?); confirm current notice\.$/i,
      'Apply by $2 for $1. The admission test is on $3. Check DIU’s current admissions notice to confirm.')
    .replace(/^Waiver overlap: FAQ says a student may enjoy one waiver category, highest applicable percentage\./i,
      'You can usually use one waiver, whichever gives you the highest percentage.')
    .replace(/^Waiver conditions: Financial aid portal says undergraduate students generally need/i,
      'Undergraduate students generally need')
}

function citePassage(passage, excerpt = displayText(passage.text)) {
  return {
    filename: passage.filename,
    page: passage.page ?? null,
    excerpt,
    links: passage.urls,
    pdfUrl: passage.filename === seedFilename ? '/api/sources/diu-knowledge-base' : null,
  }
}

export async function answerQuestion(database, question, history = []) {
  const casualMessage = question.trim().replaceAll("'", '’').replace(/\s+/g, ' ').replace(/[.!?,]+$/, '').trimEnd()
  const casualReply = smallTalk.find(([pattern]) => pattern.test(casualMessage))?.[1]
  if (casualReply) return { answer: casualReply, sources: [] }

  const signal = AbortSignal.timeout(35000)
  let searchQuestion = question
  let notice = aiProvider ? undefined : 'AI replies are currently disabled.'

  function useFallback(error) {
    const reason = Number.isInteger(error.status) ? `HTTP ${error.status}` : error.name
    console.warn(`${aiProvider.name} answer unavailable (${reason}). Using document search.`)
    notice = 'AI replies are temporarily unavailable.'
  }

  if (aiProvider) {
    try {
      const turn = await continueConversation(question, history, signal)
      if (turn.kind === 'general') return { answer: turn.answer, sources: [] }
      searchQuestion = turn.question
    } catch (error) {
      useFallback(error)
    }
  }

  const query = normalizeQuestion(searchQuestion)
  const keywordQuery = query.join(' ')
  const passages = await listPassages(database)
  if (!passages.length) return { answer: notice ? replyUnavailable : noEvidence, sources: [] }

  const detailedTuition = findProgramTuition(passages, query)
  const tuitionAnswer = detailedTuition
    ? { answer: detailedTuition.answer, sources: detailedTuition.passages.map((passage) => citePassage(passage)) }
    : findTuitionAnswer(passages, query)
  if (tuitionAnswer && !history.length && !notice) return tuitionAnswer

  if (aiProvider && !notice) {
    try {
      const result = await generateAnswer(passages, { question, searchQuestion, keywordQuery, history, signal })
      if (result.answer) {
        return {
          answer: result.answer,
          sources: result.citations.map(({ passage, excerpt }) => citePassage(passage, excerpt)),
        }
      }
    } catch (error) {
      useFallback(error)
    }
  }

  if (tuitionAnswer) return { ...tuitionAnswer, notice }

  for (const passage of rankKeywordPassages(passages, keywordQuery)) {
    const answer = answerFromPassage(passage, query)
    if (answer) return { answer, sources: [citePassage(passage)], notice }
  }

  return { answer: notice ? replyUnavailable : noEvidence, sources: [] }
}
