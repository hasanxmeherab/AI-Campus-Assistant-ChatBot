import { terms } from './search.js'

const requirementFields = {
  general_requirements: 'General requirements',
  english_medium_requirements: 'English-medium requirements (O Level and A Level)',
  diploma_requirements: 'Diploma requirements',
  notes: 'Additional conditions',
}
const programAliases = {
  'BSc CSE': ['Computer Science and Engineering', 'Computer Science'],
  'MSc CSE': ['Master of Science in Computer Science and Engineering', 'Computer Science and Engineering', 'Computer Science'],
  'BSc CIS': ['Computing and Information System', 'Computing and Information Systems'],
  'BSc EEE': ['Electrical and Electronic Engineering', 'Electrical Engineering'],
  'BBA': ['Business Administration'],
  'BBA Marketing': ['Marketing'],
  'Software Engineering (including majors)': ['Software Engineering', 'SWE'],
}

const eligibilityTerms = ['eligibility', 'eligible', 'qualify', 'require', 'requirement', 'criteria', 'criterion']
const applicationTerms = ['admission', 'apply', 'application', 'applying', 'admit']
const qualificationTerms = ['gpa', 'cgpa', 'diploma']
const admissionsTerms = [...eligibilityTerms, ...applicationTerms, ...qualificationTerms]
const otherTopics = ['fee', 'cost', 'tuition', 'waiver', 'scholarship', 'deadline', 'test', 'date', 'payment']
const selectionWords = ['admission', 'department', 'dept', 'program', 'degree', 'undergraduate', 'postgraduate', 'bachelor', 'master', 'diploma', 'english', 'medium', 'mean']
const genericWords = new Set([
  ...admissionsTerms, ...selectionWords, 'applicant', 'get', 'take', 'minimum',
  'need', 'student', 'study', 'university', 'general', 'basic', 'hsc', 'ssc', 'subject', 'grade', 'bsc', 'msc',
])
export const askAdmissionProgram = 'Which department or program are you applying to?'

function aliasesFor(passage) {
  const { program, level } = passage.admission
  const department = level === 'undergraduate' && passage.section.match(/\(([^() ]+) department\)$/)?.[1]
  return [program, program.replace(/^(?:BSc|MSc|BSS|MSS|BBA)\s+/i, ''), ...(programAliases[program] ?? []), department].filter(Boolean)
}

export function needsAdmissionProgram(query) {
  const askingEligibility = eligibilityTerms.some((term) => query.includes(term)) ||
    (applicationTerms.some((term) => query.includes(term)) && qualificationTerms.some((term) => query.includes(term)))
  return askingEligibility &&
    query.every((term) => genericWords.has(term) || /^\d+$/.test(term))
}

function nonempty(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function sourceUrl(value) {
  return nonempty(value) && value.startsWith('https://') && URL.canParse(value)
}

function hasChecklist(items) {
  return Array.isArray(items) && items.length > 0 && items.every(nonempty)
}

export function admissionPassages(data) {
  if (!Array.isArray(data?.programs) || !data.programs.length || data.program_count !== data.programs.length ||
      !Array.isArray(data.unverified_programs) || !sourceUrl(data.source) || !sourceUrl(data.documents?.source_url) ||
      !hasChecklist(data.documents.domestic_in_person) || !hasChecklist(data.documents.online) ||
      (data.admission_cycle !== null && !nonempty(data.admission_cycle))) {
    throw new Error('Expected an admissions dataset with program records, source links, and both document checklists.')
  }

  const cycle = data.admission_cycle
    ? `Admission cycle: ${data.admission_cycle}.`
    : 'These requirements are not confirmed for a specific intake.'
  const programs = data.programs.map((entry, index) => {
    if (!nonempty(entry?.program) || !nonempty(entry.department_code) ||
        !['undergraduate', 'postgraduate'].includes(entry.level) || !sourceUrl(entry.source_url) ||
        !nonempty(entry.general_requirements) ||
        !Object.keys(requirementFields).every((field) => entry[field] === null || nonempty(entry[field]))) {
      throw new Error(`Invalid admissions program at position ${index + 1}.`)
    }

    const fields = Object.entries(requirementFields)
      .filter(([field]) => field !== 'notes' || entry.notes)
      .map(([field, label]) => `${label}: ${entry[field] ?? 'Not confirmed.'}`)
    return {
      section: `Admission eligibility / ${entry.level} / ${entry.program} (${entry.department_code.toUpperCase()} department)`,
      text: [`${entry.program} (${entry.level}) admission eligibility.`, ...fields, cycle].join('\n'),
      urls: [entry.source_url],
      admission: { program: entry.program, level: entry.level, fields, cycle },
    }
  })

  const unverified = data.unverified_programs.map((entry, index) => {
    if (!nonempty(entry?.program) || entry.requirements !== null) {
      throw new Error(`Invalid unverified admissions program at position ${index + 1}.`)
    }
    return {
      section: `Admission eligibility / ${entry.program}`,
      text: `The admission requirements for ${entry.program} have not been verified. Ask DIU Admissions to confirm eligibility for the program and intake.`,
      urls: [data.source],
      admission: { program: entry.program, level: 'undergraduate' },
    }
  })

  const checklists = [
    ['in-person', 'In-person admission document checklist for domestic applicants', data.documents.domestic_in_person],
    ['online', 'Online admission application document checklist', data.documents.online],
  ].map(([channel, section, items]) => ({
    section,
    text: [`${section}.`, ...items.map((item) => item.replace(/\.?$/, '.'))].join('\n'),
    urls: [data.documents.source_url],
    admission: { channel, items },
  }))

  return [...programs, ...unverified, ...checklists]
}

export function findAdmissionAnswer(passages, query, originalEligibilityQuery) {
  const candidates = passages.filter(({ admission }) => admission)
  if (!candidates.length) return null
  const words = new Set(query)
  if (!originalEligibilityQuery && (words.has('document') || words.has('checklist'))) {
    const channel = words.has('online') ? 'online' : words.has('person') || words.has('domestic') ? 'in-person' : null
    if (!channel) return { answer: 'Are you applying online or bringing your documents in person?', passages: [] }
    const passage = candidates.find(({ admission }) => admission.channel === channel)
    if (!passage) return null
    return {
      answer: `Here’s what to prepare for ${channel === 'online' ? 'the online application' : 'in-person admission'}:\n${passage.admission.items.map((item) => `• ${item}`).join('\n')}`,
      passages: [passage],
    }
  }

  if ((!originalEligibilityQuery && !admissionsTerms.some((word) => words.has(word))) ||
      otherTopics.some((word) => words.has(word))) return null

  const context = new Set([...(originalEligibilityQuery ?? []), ...words])
  const postgraduate = ['postgraduate', 'master', 'msc', 'mss', 'mba'].some((word) => context.has(word))
  const undergraduate = ['undergraduate', 'bachelor', 'bsc', 'bss'].some((word) => context.has(word))
  const level = postgraduate ? 'postgraduate' : undergraduate ? 'undergraduate' : null
  const matches = candidates.flatMap((passage) => {
    const { program, level: entryLevel } = passage.admission
    if (!program || (level && entryLevel !== level) || (program === 'English' && words.has('medium'))) return []
    const nameLength = Math.max(0, ...aliasesFor(passage).map((alias) => {
      const tokens = terms(alias)
      const matchesName = tokens.every((token) => words.has(token))
      if (!matchesName || (originalEligibilityQuery &&
          !query.every((token) => tokens.includes(token) || selectionWords.includes(token)))) return 0
      return tokens.length
    }))
    return nameLength ? [{ passage, nameLength }] : []
  })
  if (!matches.length) return null

  const best = Math.max(...matches.map(({ nameLength }) => nameLength))
  let selected = matches.filter(({ nameLength }) => nameLength === best).map(({ passage }) => passage)
  if (originalEligibilityQuery && !level && selected.some(({ admission }) => admission.level === 'undergraduate')) {
    selected = selected.filter(({ admission }) => admission.level === 'undergraduate')
  }
  if (selected.length > 1) {
    return { answer: `Which program do you mean: ${selected.map(({ admission }) => admission.program).join(' or ')}?`, passages: [] }
  }

  const [passage] = selected
  const { program, fields, cycle } = passage.admission
  if (!fields) return { answer: passage.text, passages: [passage] }
  const qualification = context.has('diploma') ? 'Diploma requirements:' :
    context.has('medium') ? 'English-medium requirements' : null
  const requirements = qualification ? fields.filter((field) => field.startsWith(qualification)) : fields
  return {
    answer: `Here’s what I have for ${program}:\n${requirements.join('\n')}\n\n${cycle} Check with DIU Admissions to confirm your eligibility.`,
    passages: [passage],
  }
}
