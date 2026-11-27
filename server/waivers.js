const passageLimit = 4000
const statuses = {
  policy_listed: 'Listed in policy. Confirm availability for the applicant’s intake.',
  conflicting_sources: 'Sources conflict. Confirm the rule with the DIU waiver office.',
  listed_details_unverified: 'The award is listed, but its details and current availability are unverified.',
  historical_not_current: 'Historical example only. This is not a current offer.',
}

const applicationLabels = {
  method: 'How to apply',
  required_documents: 'Required documents',
  deadline: 'Application deadline',
  minimum_semester_gpa: 'Minimum semester GPA to keep the waiver',
  minimum_credits: 'Minimum credits to keep the waiver',
  application_fee_bdt: 'Application fee (BDT)',
  annual_award_bdt: 'Annual award (BDT)',
  annual_minimum_credits: 'Annual minimum credits',
  monthly_stipend_bdt: 'Monthly stipend (BDT)',
  award_usd: 'Award (USD)',
}

function nonempty(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isUrl(value) {
  return nonempty(value) && value.startsWith('https://') && URL.canParse(value)
}

function isPercent(value) {
  return Number.isFinite(value) && value >= 0 && value <= 100
}

function formatPercentage(value) {
  if (value === null) return 'Unverified'
  if (isPercent(value)) return `${value}%`
  if (isPercent(value?.min) && isPercent(value?.max) && value.min <= value.max) {
    return `${value.min}% to ${value.max}%`
  }
  throw new Error('Expected a percentage, a percentage range, or null.')
}

function formatField(value) {
  if (value === null) return 'Unverified'
  if (Array.isArray(value) && value.every(nonempty)) return value.length ? value.join(', ') : 'None listed'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (nonempty(value) || (Number.isFinite(value) && value >= 0)) return String(value)
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const entries = Object.entries(value)
    if (entries.length) return entries.map(([label, detail]) =>
      `${label.replaceAll('_', ' ')}: ${formatField(detail)}`).join('; ')
  }
  throw new Error('Invalid waiver field value.')
}

function prepareRecord(record, seen) {
  const { id, name, who_qualifies: rules, what_it_covers: coverage, how_to_apply_and_keep: application,
    where_to_verify: source, notes } = record ?? {}
  if (!nonempty(id) || seen.has(id) || !nonempty(name) || !nonempty(rules?.applicant_category) ||
      !coverage || !application || !source || !isUrl(source.official_policy_url) ||
      !Object.hasOwn(statuses, source.status) ||
      (source.applicable_intake !== null && !nonempty(source.applicable_intake))) {
    throw new Error('Expected a unique waiver with eligibility, coverage, application details, and source status.')
  }

  seen.add(id)
  const programs = formatField(rules.eligible_programs)
  const intake = source.applicable_intake ?? 'Intake not specified. Check current availability.'
  const fields = [
    `Applicant category: ${rules.applicant_category}`,
    `Required grades: ${formatField(rules.required_grades)}`,
    `Policy-listed percentage: ${formatPercentage(coverage.percentage)}`,
    `Covered fees: ${formatField(coverage.covered_fees)}`,
    `Can combine with another waiver: ${formatField(coverage.combinable_with_other_waivers)}`,
    ...Object.entries(applicationLabels).filter(([field]) => application[field] !== undefined)
      .map(([field, label]) => `${label}: ${formatField(application[field])}`),
  ]
  if (notes !== null) fields.push(`Notes: ${formatField(notes)}`)
  return { name, programs, intake, status: source.status, text: fields.join('\n'), url: source.official_policy_url }
}

export function waiverPassages(data) {
  const policy = data?.general_rules
  if (!policy || !Array.isArray(data.waivers) || !data.waivers.length || data.record_count !== data.waivers.length ||
      !Array.isArray(policy.source_urls) || !policy.source_urls.length || !policy.source_urls.every(isUrl) ||
      !Array.isArray(policy.excluded_fees) || !Array.isArray(policy.conflicts)) {
    throw new Error('Expected general waiver rules, source URLs, and a matching waiver record count.')
  }

  const general = {
    section: 'General scholarship and waiver policy / tuition coverage and stacking',
    text: [
      `Ordinary tuition waivers cover: ${formatField(policy.ordinary_waivers_apply_to)}.`,
      `Fees excluded from ordinary waivers: ${formatField(policy.excluded_fees)}.`,
      `Combining or stacking waivers: ${formatField(policy.stacking)}.`,
      `English I and II minimum grade: ${formatField(policy.english_I_II_minimum_grade)}.`,
      `Credit rules: ${formatField(policy.credit_rules_note)}`,
      `Policy conflicts and scope: ${formatField(policy.conflicts)}`,
      `Missing information: ${formatField(policy.null_meaning)}`,
    ].join('\n'),
    urls: policy.source_urls,
  }

  const seen = new Set()
  const records = data.waivers.map((record, index) => {
    try {
      return prepareRecord(record, seen)
    } catch (error) {
      throw new Error(`Invalid waiver record ${index + 1}: ${error.message}`, { cause: error })
    }
  })
  const groups = Map.groupBy(records, ({ name, programs, intake, status }) => JSON.stringify([name, programs, intake, status]))
  const passages = [general]
  for (const group of groups.values()) {
    const { name, programs, intake, status } = group[0]
    const section = `Scholarships and waivers / ${name} / ${programs}`
    const header = `${name} waiver or scholarship. Programs listed: ${programs}. Intake: ${intake}. ${statuses[status]}`
    let text = header
    let urls = new Set()
    for (const record of group) {
      if (urls.size && text.length + record.text.length + 2 > passageLimit) {
        passages.push({ section, text, urls: [...urls] })
        text = header
        urls = new Set()
      }
      text += `\n\n${record.text}`
      urls.add(record.url)
    }
    passages.push({ section, text, urls: [...urls] })
  }
  return passages
}
