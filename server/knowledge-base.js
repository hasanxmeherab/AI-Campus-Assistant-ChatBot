function text(value) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Expected a nonempty text field.')
  return value.trim()
}

function url(value) {
  if (typeof value !== 'string' || !value.startsWith('https://') || !URL.canParse(value)) {
    throw new Error('Expected a valid HTTPS source URL.')
  }
  return value
}

function passage(section, content, entries) {
  return { section: text(section), text: text(content), urls: [...new Set(entries.map(({ source_url }) => url(source_url)))] }
}

function numberOrUnverified(value) {
  if (value === null) return 'unverified'
  if (!Number.isFinite(value) || value < 0) throw new Error('Expected a nonnegative number or null.')
  return String(value)
}

function rows(data, key) {
  if (!Array.isArray(data[key]) || !data[key].every((entry) => entry && typeof entry === 'object')) {
    throw new Error(`Expected a list of records in ${key}.`)
  }
  return data[key]
}

export function knowledgePassages(data) {
  if (!data?.metadata || !data.university || data.metadata.currency !== 'BDT') {
    throw new Error('Expected a DIU knowledge base with metadata, university information, and BDT fees.')
  }

  const { university } = data
  const overview = passage(
    'University overview and campus address',
    `${text(university.name)} was established in ${numberOrUnverified(university.established_year)}. The main campus is at ${text(university.campus_address)}.`,
    [university],
  )

  const departments = [...Map.groupBy(rows(data, 'departments'), (item) => text(item.faculty))].map(([faculty, items]) =>
    passage(`Departments / ${faculty}`, `${faculty} departments: ${items.map((item) => text(item.department)).join('; ')}.`, items),
  )
  const undergraduate = rows(data, 'undergraduate_programs_partial')
  const programs = undergraduate.length ? [
    passage('Undergraduate programs (partial list)',
      `This undergraduate program list is partial. Confirm program availability for your intake.\n${undergraduate.map((item) => text(item.program)).join('\n')}`,
      undergraduate),
  ] : []

  const fees = rows(data, 'tuition_fees_partial').map((item) => ({
    ...passage(`Sample tuition fees / ${text(item.program)}`, [
      `${item.program} fee figures in BDT. Confirm the amounts with DIU for your intake.`,
      `Total program fee: ${numberOrUnverified(item.total_program_fee_bdt)}.`,
      `Average semester fee: ${numberOrUnverified(item.average_semester_fee_bdt)}.`,
      `Admission fee: ${numberOrUnverified(item.admission_fee_bdt)}.`,
      `Tuition fee: ${numberOrUnverified(item.total_tuition_fee_bdt)}.`,
      `Credit hours: ${numberOrUnverified(item.credit_hours)}.`,
    ].join('\n'), [item]),
    legacyTuition: true,
  }))

  const waivers = [...Map.groupBy(rows(data, 'waiver_schemes'), (item) => text(item.group))].map(([group, items]) =>
    passage(`Scholarships and waivers / ${group}`, [
      ...items.map((item) => [
        text(item.scheme),
        item.percentage === null ? 'Percentage unverified' : `Percentage: ${numberOrUnverified(item.percentage)}%`,
        item.eligibility_details === null ? 'Eligibility details unverified' : text(item.eligibility_details),
      ].join('. ') + '.'),
      'Confirm the current policy with DIU before applying.',
    ].join('\n'), items),
  )

  const services = rows(data, 'services').map((item) =>
    passage(`Campus services / ${text(item.service)}`, `${item.service}: ${text(item.details).replace(/\.?$/, '.')}`, [item]),
  )
  const contacts = rows(data, 'contacts_partial').map((item) =>
    passage(`Contact email / ${text(item.office)}`, `You can email DIU’s ${item.office} at ${text(item.email)}.`, [item]),
  )
  const notes = rows(data, 'notes').map((item) =>
    passage(text(item.topic), `${item.topic}: ${text(item.detail)}`, [item]),
  )
  const references = rows(data, 'sources').map((item) => ({ topic: text(item.topic), url: url(item.url) }))
  const admission = references.find(({ topic }) => topic === 'admission')
  const portals = admission ? [{
    section: 'Online admission application portal',
    text: `You can apply online through DIU’s Applicant Portal at ${admission.url}.`,
    urls: [admission.url],
  }] : []

  return { passages: [overview, ...departments, ...programs, ...fees, ...waivers, ...services, ...contacts, ...notes, ...portals], references }
}
