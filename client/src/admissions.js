const diu = 'https://daffodilvarsity.edu.bd'

export const links = {
  university: diu,
  admissions: `${diu}/admission`,
  programs: `${diu}/admission/undergraduate-information`,
  fees: `${diu}/tuition-fees`,
  aid: `${diu}/scholarships`,
  contact: `${diu}/admission-contact`,
  transport: `${diu}/transport`,
  housing: 'https://hall.daffodilvarsity.edu.bd',
  students: 'https://studentshub.daffodilvarsity.edu.bd',
  apply: 'https://admission.daffodilvarsity.edu.bd',
  checklist: 'https://webbackend.daffodilvarsity.edu.bd/photos/pdf/admission-checklist.pdf',
}

export const resources = [
  { icon: 'book', title: 'Programs & eligibility', description: 'Explore degree programs and check entry requirements for your chosen subject.', link: links.programs, action: 'Browse programs' },
  { icon: 'wallet', title: 'Tuition & fees', description: 'Compare what you pay at admission, average semester fees, and full program costs.', link: links.fees, action: 'See fee breakdowns' },
  { icon: 'award', title: 'Scholarships & waivers', description: 'Find out what financial support is available and how to request it.', link: links.aid, action: 'Explore financial aid' },
]

export const steps = [
  { title: 'Choose a program', description: 'Compare degrees and confirm the grades and subjects you need for your preferred program.' },
  { title: 'Prepare your documents', description: 'Gather your SSC and HSC or equivalent certificates and transcripts, and check DIU’s document list.' },
  { title: 'Submit your application', description: 'Complete the form in the DIU Applicant Portal and follow the portal’s fee and submission instructions.' },
  { title: 'Check your next steps', description: 'Watch for DIU’s test or interview instructions and follow the enrollment directions if selected.' },
]

export const categories = ['Applying', 'Fees & aid', 'Campus life']

export const faqs = [
  {
    category: 'Applying', question: 'How do I apply to DIU?',
    answer: 'Choose a program, check its entry requirements, and fill out the form in the official DIU Applicant Portal. Follow the portal’s instructions for documents and any applicable application fee. Keep your application details handy to check for updates.',
    link: links.apply, source: 'Open the DIU Applicant Portal',
  },
  {
    category: 'Applying', question: 'What are the minimum admission requirements?',
    answer: 'Requirements depend on the program and your educational background. Check the minimum SSC and HSC or equivalent results and any required subjects for your degree. If you have O Levels, A Levels, a diploma, or overseas qualifications, confirm how DIU will assess them before applying.',
    link: links.programs, source: 'Check undergraduate admission information',
  },
  {
    category: 'Applying', question: 'What documents do I need to apply?',
    answer: 'Prepare your academic certificates or testimonials and marksheets or transcripts. DIU asks applicants to bring originals for verification. Check the official checklist for photos, identification, and any additional documents for your application type.',
    link: links.checklist, source: 'View DIU’s admission checklist',
  },
  {
    category: 'Applying', question: 'When is the application deadline?',
    answer: 'Application deadlines depend on the intake and program. Check the latest admission announcement for your semester and confirm the deadline with the Admissions Office if your program has a different schedule.',
    link: links.fees, source: 'Check DIU’s admission announcements',
  },
  {
    category: 'Applying', question: 'Will I have to take an admission test?',
    answer: 'The test or interview instructions depend on your intake and program. Check the current admission notice and follow the Applicant Portal’s instructions for the admit card, schedule, and results.',
    link: links.apply, source: 'Check the Applicant Portal',
  },
  {
    category: 'Applying', question: 'How can international students apply?',
    answer: 'Contact DIU’s International Admission team before applying. They can confirm how your qualifications are assessed, which documents you need, your fees, and any visa or enrollment steps. The university lists international counselors on its admission contact page.',
    link: links.contact, source: 'Find international admissions contacts',
  },
  {
    category: 'Fees & aid', question: 'How much will my degree cost?',
    answer: 'The cost depends on the program. DIU’s fee table shows what is payable at admission, the average semester fee, total tuition, and total program fees. Use total program fees to budget for your degree, and allow separately for housing and travel.',
    link: links.fees, source: 'Compare official tuition and fees',
  },
  {
    category: 'Fees & aid', question: 'Does DIU offer scholarships or tuition waivers?',
    answer: 'Yes. DIU lists merit-based waivers, need-based assistance, and other scholarship categories. Check which categories you qualify for, what evidence you need, and the conditions you must meet to keep the award after enrollment.',
    link: links.aid, source: 'Review scholarships and waivers',
  },
  {
    category: 'Fees & aid', question: 'Does a tuition waiver cover every fee?',
    answer: 'DIU’s financial aid guidance applies tuition waivers to tuition charges. Budget for other charges such as admission, semester, and lab fees. Ask the Admissions Office for an itemized estimate after your waiver.',
    link: 'https://financialaid.daffodilvarsity.edu.bd/?app=home&cmd=Eligibility', source: 'Read DIU’s financial aid conditions',
  },
  {
    category: 'Campus life', question: 'Where is the DIU campus?',
    answer: 'The campus is at Daffodil Smart City, Birulia, Savar, Dhaka 1216. If you’re planning a visit, contact the Admissions Office to confirm where to go and when a counselor is available.',
    link: links.contact, source: 'Get campus and admissions contact details',
  },
  {
    category: 'Campus life', question: 'Can I get a hostel room?',
    answer: 'DIU offers student residence halls. Check the hall website for room options, the application process, and charges. Confirm availability before making your housing plans.',
    link: links.housing, source: 'Explore DIU residence halls',
  },
  {
    category: 'Campus life', question: 'Does DIU provide student transport?',
    answer: 'DIU runs student buses serving Dhaka and nearby areas. Check current routes, stops, and timetables before choosing your commute.',
    link: links.transport, source: 'Check DIU transport information',
  },
  {
    category: 'Campus life', question: 'What can I do outside class?',
    answer: 'DIU’s Students Hub lists clubs, events, sports, and volunteering opportunities. Browse it for student activities and support services before you arrive.',
    link: links.students, source: 'Explore the DIU Students Hub',
  },
]
