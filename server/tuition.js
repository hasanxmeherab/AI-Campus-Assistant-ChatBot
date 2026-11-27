import { terms } from './search.js'

const amount = new Intl.NumberFormat('en')
const feeFields = {
  total_cost: 'Total program cost',
  admission_payment: 'Payable at admission',
  average_semester_fee: 'Average semester fee',
  tuition_fee: 'Tuition portion',
  other_fees_calculated: 'Other fees (total minus tuition)',
}
const programFields = { credits: 'Credit hours', duration_years: 'Duration' }
const fieldLabels = { ...feeFields, ...programFields }
const aliases = {
  'Software Engineering (SWE)': ['software engineering', 'software engineer', 'swe'],
  'Computer Science & Engineering (CSE)': ['computer science', 'cse'],
  'Electrical & Electronic Engineering': ['eee', 'electrical engineering', 'electrical and electronics engineering'],
  'Information & Communication Engineering': ['ice'],
  'Multimedia & Creative Technology': ['mct'],
  'Computing & Information System': ['cis'],
  'Information Technology & Management': ['itm'],
  'Robotics & Mechatronics Engineering': ['rme', 'mechatronics'],
  'Nutrition & Food Engineering': ['nfe'],
  'Physical Education & Sports Science': ['pess'],
  'Law (LLB)': ['llb', 'll b'],
}

function formatValue(field, value) {
  if (value === null) return 'unavailable'
  if (field === 'duration_years') return `${amount.format(value)} years`
  if (field === 'credits') return amount.format(value)
  return `BDT ${amount.format(value)}`
}

export function tuitionPassages(data) {
  if (data?.currency !== 'BDT' || !Array.isArray(data.programs) || !data.programs.length ||
      !Array.isArray(data.notes) || !data.notes.every((note) => typeof note === 'string') ||
      !Array.isArray(data.reference_urls) || !data.reference_urls.every((url) => typeof url === 'string' && url.startsWith('https://'))) {
    throw new Error('Expected a BDT fee dataset with programs, notes, and HTTPS reference links.')
  }

  const session = typeof data.claimed_session === 'string' ? data.claimed_session : 'not confirmed'
  const seen = new Set()
  return data.programs.map((program, index) => {
    if (typeof program?.program !== 'string' || !program.program.trim() || seen.has(program.program.toLowerCase()) ||
        typeof program.faculty !== 'string' || !program.faculty.trim() || typeof program.status !== 'string' ||
        program.total_cost === null ||
        !Object.keys(fieldLabels).every((field) =>
          program[field] === null || (Number.isFinite(program[field]) && program[field] >= 0),
        )) {
      throw new Error(`Invalid or duplicate tuition entry at position ${index + 1}.`)
    }
    seen.add(program.program.toLowerCase())
    const feeConflict = program.program === 'Software Engineering (SWE)'
      ? data.notes.find((note) => /^SWE conflicting total reported:/i.test(note))
      : undefined
    const text = [
      `${program.program} (${program.faculty}) — local undergraduate fees in BDT before waivers.`,
      ...Object.entries(fieldLabels).map(([field, label]) => `${label}: ${formatValue(field, program[field])}`),
      `Session: ${session}. Status: ${program.status}.`,
      'Admission and average semester payments are included in the total program cost. Other fees are a calculated balance, and individual lab, library, registration, and exam fees are unavailable.',
      feeConflict,
    ].filter(Boolean).join('\n')
    return {
      section: `Undergraduate tuition fees / ${program.faculty} / ${program.program}`,
      text,
      urls: data.reference_urls,
      tuition: { ...program, session, feeConflict },
    }
  })
}

const feeQueryTerms = new Set(terms('tuition fee fees cost costs costing charge charges price pricing pay payment payable admission entry semester average total full breakdown detail details all complete other credit credits hour hours duration year years long bdt taka money local undergraduate department program course need much study upfront itemize itemized registration exam lab laboratory library overall'))
const feeIntentTerms = new Set(terms('tuition fee cost charge price pay payment semester total breakdown credits duration taka bdt upfront'))
const degreePrefixes = new Set(['bba', 'bsc', 'ba', 'bss'])

export function findProgramTuition(passages, query) {
  if (!query.some((term) => feeIntentTerms.has(term))) return null

  const programTerms = query.filter((term) => !feeQueryTerms.has(term))
  const possiblePrograms = passages.filter(({ tuition }) => tuition)
  if (!possiblePrograms.length) return null
  if (!programTerms.length) return { answer: 'Which program would you like the fees for?', passages: [] }

  const matches = possiblePrograms.flatMap((passage) => {
    const { program, faculty } = passage.tuition
    const prefixes = faculty === 'FBE' ? ['bba', 'ba'] : [...degreePrefixes].filter((prefix) => prefix !== 'bba')
    const names = [program, ...(aliases[program] || [])]
    const best = names.reduce((score, name) => {
      const nameTerms = new Set(terms(name))
      const requested = programTerms.filter((term) => !prefixes.includes(term) || nameTerms.has(term))
      if (!requested.length || !requested.every((term) => nameTerms.has(term))) return score
      return Math.max(score, requested.length === nameTerms.size ? 2 : 1)
    }, 0)
    return best ? [{ passage, score: best }] : []
  })
  if (!matches.length) return null

  const topScore = Math.max(...matches.map(({ score }) => score))
  const bestMatches = matches.filter(({ score }) => score === topScore).map(({ passage }) => passage)
  if (bestMatches.length > 1) {
    const options = bestMatches.map(({ tuition }) => tuition.program)
    return { answer: `Which program do you mean? ${options.join(', ')}.`, passages: [] }
  }

  const [passage] = bestMatches
  const { tuition } = passage
  const fields = [
    query.includes('total') && 'total_cost',
    query.some((term) => ['admission', 'upfront', 'entry'].includes(term)) && 'admission_payment',
    query.includes('semester') && 'average_semester_fee',
    query.includes('tuition') && 'tuition_fee',
    query.includes('other') && 'other_fees_calculated',
    query.includes('credit') && 'credits',
    query.some((term) => ['duration', 'year', 'long'].includes(term)) && 'duration_years',
  ].filter(Boolean)
  const asksItemized = query.some((term) => ['lab', 'laboratory', 'library', 'registration', 'exam', 'itemize', 'itemized'].includes(term))
  const breakdown = query.some((term) => ['breakdown', 'full', 'all', 'detail', 'complete'].includes(term))
  const shownFields = new Set(breakdown || (!fields.length && !asksItemized)
    ? [...Object.keys(feeFields), ...fields]
    : fields)
  const lines = [...shownFields].map((field) => `${fieldLabels[field]}: ${formatValue(field, tuition[field])}`)
  if (asksItemized) lines.push('Individual lab, library, registration, and exam fees are unavailable.')
  if (shownFields.size > 1 && (shownFields.has('admission_payment') || shownFields.has('average_semester_fee'))) {
    lines.push('Admission and semester payments are part of the total.')
  }
  if (tuition.feeConflict && shownFields.has('total_cost')) lines.push(tuition.feeConflict)
  return {
    answer: `Here’s what I have for ${tuition.program}:\n${lines.join('\n')}\n\nThese figures are before waivers. Confirm the amounts for your intake with DIU Admissions.`,
    passages: [passage],
  }
}
