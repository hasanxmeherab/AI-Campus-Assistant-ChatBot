import { useState } from 'react'
import { categories, faqs, links, resources, steps } from './admissions.js'

const container = 'mx-auto w-full max-w-[78rem] px-4 sm:px-6'
const section = 'scroll-mt-4 py-14 lg:py-20'
const kicker = 'text-[.825rem] leading-snug font-extrabold tracking-[.13em] uppercase'
const heading = 'mt-2 text-[clamp(2.15rem,4vw,3.3rem)] leading-[1.1] font-extrabold tracking-[-.062em]'
const subheading = 'text-lg leading-snug font-extrabold tracking-tight'
const muted = 'text-[#5b526c]'
const button = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-transparent px-5 py-2.5 text-center text-[.94rem] leading-tight font-bold motion-safe:transition-colors'
const purpleButton = `${button} bg-[#643bc5] text-white hover:bg-[#4d28a2]`
const brightButton = `${button} bg-[#dbceff] text-[#27164c] hover:bg-[#f0e8ff]`
const iconTile = 'inline-grid size-11 shrink-0 place-items-center rounded-xl'
const textLink = 'w-fit text-[.94rem] font-extrabold text-[#5530a1] underline-offset-4 hover:underline'
const navLink = 'text-[.925rem] font-bold hover:text-[#643bc5]'

const icons = {
  cap: 'm2 10 10-5 10 5-10 5L2 10Zm4 2v5c3 3 9 3 12 0v-5m4-2v7',
  book: 'M12 6v15m0-15C9 3 5 3 2 4v14c4-1 7 0 10 3 3-3 6-4 10-3V4c-3-1-7-1-10 2Z',
  wallet: 'M20 8V5H6a3 3 0 0 0 0 6h14a2 2 0 0 1 2 2v6H6a3 3 0 0 1-3-3V8m19 6h-5v3h5',
  award: 'M8 13 5 21l4-1 2 2 2-7m3-2 3 8-4-1-2 2m5-13a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z',
  pin: 'M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Zm-5 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  search: 'M16 16l5 5m-3-10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z',
  chat: 'M21 11a8 8 0 0 1-8 8H9l-5 3v-6a8 8 0 0 1 7-13h2a8 8 0 0 1 8 8ZM8 10h8m-8 4h5',
  phone: 'M8 3H4c-1 0-1 1-1 2a16 16 0 0 0 16 16c1 0 2 0 2-1v-4l-5-2-2 2a13 13 0 0 1-6-6l2-2-2-5Z',
  mail: 'M3 5h18v14H3V5Zm0 1 9 7 9-7',
}

function Icon({ name }) {
  return (
    <svg className="size-5 shrink-0" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
      <path d={icons[name]} />
    </svg>
  )
}

function Brand() {
  return (
    <a className="inline-flex shrink-0 items-center gap-3 leading-tight" href="#home" aria-label="DIU Admissions Guide home">
      <span className={`${iconTile} bg-[#643bc5] text-white`}><Icon name="cap" /></span>
      <span>
        <strong className="block font-extrabold tracking-tight">DIU Admissions</strong>
        <small className={`mt-0.5 block text-[.82rem] ${muted}`}>Applicant Guide</small>
      </span>
    </a>
  )
}

function FaqSection() {
  const [category, setCategory] = useState('All topics')
  const [query, setQuery] = useState('')
  const search = query.trim().toLowerCase()
  const results = faqs.filter((faq) => (
    (category === 'All topics' || category === faq.category)
    && search.split(/\s+/).every((word) => `${faq.question} ${faq.answer} ${faq.category}`.toLowerCase().includes(word))
  ))

  return (
    <section className={section} id="faq" aria-labelledby="faq-title">
      <div className={`${container} grid gap-8 md:grid-cols-[minmax(14rem,.72fr)_minmax(0,1.32fr)] lg:gap-16`}>
        <div>
          <p className={`${kicker} text-[#6036b9]`}>Applicant FAQs</p>
          <h2 className={heading} id="faq-title">Have a question?</h2>
          <p className={`mt-4 max-w-xl ${muted}`}>Find answers about applying, paying for your degree, and getting to campus.</p>
          <div className="mt-7 rounded-2xl border border-[#eae1fa] bg-[#f8f4ff] p-5 md:max-w-sm">
            <span className={`${iconTile} bg-[#eee8ff] text-[#5832ab]`}><Icon name="chat" /></span>
            <h3 className={`mt-4 ${subheading}`}>Need more help?</h3>
            <p className={`mt-2 ${muted}`}>Ask the campus assistant or talk to an admissions counselor.</p>
            <a href="#chat" className={`mt-2 block ${textLink}`}>Open campus assistant</a>
            <a href="#contact" className={`mt-2 block ${textLink}`}>Contact admissions</a>
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2.5 rounded-xl border border-[#d9cde8] px-3.5 text-[#6c568c] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#9068f0]">
            <Icon name="search" />
            <span className="sr-only">Search frequently asked questions</span>
            <input className="w-full min-w-0 py-3 text-[#201735] outline-none placeholder:text-[#6b6079] focus-visible:outline-none!" type="search" placeholder="Search questions…" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <div className="mt-3.5 mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter FAQs by topic">
            {['All topics', ...categories].map((topic) => (
              <button className="min-h-10 cursor-pointer rounded-full border border-[#e4ddef] px-3 text-sm font-bold text-[#5b526c] hover:bg-[#f7f1ff] aria-pressed:border-[#dac7ff] aria-pressed:bg-[#ede3ff] aria-pressed:text-[#48228f]" type="button" key={topic} aria-pressed={category === topic} onClick={() => setCategory(topic)}>{topic}</button>
            ))}
          </div>
          <p className="sr-only" role="status">{results.length} {results.length === 1 ? 'question' : 'questions'} found</p>
          <div className="border-t border-[#e4ddef]">
            {results.map(({ question, answer, link, source }) => (
              <details className="group border-b border-[#e4ddef]" key={question} name="admission-faq">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-1 py-3.5 font-bold hover:text-[#5530a1] group-open:text-[#5530a1] [&::-webkit-details-marker]:hidden">
                  {question}
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#f1eaff] text-[#5932aa]" aria-hidden="true">
                    <span className="group-open:hidden">+</span><span className="hidden group-open:inline">−</span>
                  </span>
                </summary>
                <div className="pr-8 pb-4 pl-1">
                  <p className={`mb-2 ${muted}`}>{answer}</p>
                  <a className={textLink} href={link}>{source}</a>
                </div>
              </details>
            ))}
            {!results.length && <p className={`py-4 ${muted}`}>No questions match. Try a different keyword or select All topics.</p>}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function AdmissionsHome() {
  return (
    <div className="bg-white font-sans leading-relaxed text-[#201735] [&_:focus-visible]:outline-3 [&_:focus-visible]:outline-offset-4 [&_:focus-visible]:outline-[#9068f0]" id="home">
      <a className="absolute top-2 left-2 z-10 -translate-y-[170%] rounded bg-white px-4 py-2 focus:translate-y-0" href="#main-content">Skip to content</a>
      <header>
        <div className={`${container} flex min-h-20 flex-wrap items-center justify-between gap-x-4 gap-y-3 py-3 lg:gap-6`}>
          <Brand />
          <nav className="order-last flex w-full flex-wrap items-center gap-x-5 gap-y-2 md:order-0 md:w-auto lg:gap-9" aria-label="Main navigation">
            <a className={navLink} href="#about">About DIU</a>
            <a className={navLink} href="#apply">How to apply</a>
            <a className={navLink} href="#faq">FAQs</a>
            <a className={navLink} href="#contact">Contact</a>
          </nav>
          <a className={`${purpleButton} min-h-11! px-3.5!`} href="#chat"><Icon name="chat" /> Ask Assistant</a>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className="isolate overflow-hidden bg-[#201436] bg-[radial-gradient(ellipse_at_78%_105%,#48267d_0%,transparent_58%)] text-white" aria-labelledby="hero-title">
          <div className={`${container} grid items-center gap-7 pt-11 pb-8 md:grid-cols-2 md:py-16 lg:gap-14 lg:py-20`}>
            <div>
              <p className={`${kicker} text-[#dac7ff]`}>Daffodil International University</p>
              <h1 className="mt-4 mb-5 text-[clamp(2.85rem,9vw,4.5rem)] leading-none font-extrabold tracking-[-.07em] md:text-[clamp(2.85rem,5.8vw,5.4rem)]" id="hero-title">
                Your guide to<br className="hidden lg:block" /> <em className="text-[#c8afff] not-italic">DIU admissions.</em>
              </h1>
              <p className="max-w-md text-[#e1d8ef] lg:text-lg">Explore degree options, get your application ready, and find answers to common admissions questions.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a className={brightButton} href="#apply">How to apply</a>
                <a className={`${button} border-white/45! bg-white/5 hover:border-white! hover:bg-white/10`} href="#faq">Browse FAQs</a>
              </div>
            </div>
            <figure className="relative aspect-[1.55] overflow-hidden rounded-3xl border border-[#af8aeb5c] bg-[#402766] shadow-2xl shadow-[#150d2a65] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-1/2 after:bg-linear-to-t after:from-[#1b132c86] md:aspect-[1.32]">
              <img className="size-full object-cover" src={`${import.meta.env.BASE_URL}diu-campus.jpg`} alt="Aerial view of academic buildings and the main green at Daffodil International University" fetchPriority="high" />
              <figcaption className="absolute bottom-4 left-4 z-10 flex items-center gap-2.5 rounded-xl bg-[#241737ef] px-3 py-2 leading-snug">
                <span className="text-[#cfb8ff]"><Icon name="pin" /></span>
                <span><strong className="block text-sm">Daffodil Smart City</strong><small className="block text-[.82rem] text-[#e4d8f3]">Birulia, Savar, Dhaka</small></span>
              </figcaption>
            </figure>
          </div>
        </section>

        <section className={section} id="about" aria-labelledby="about-title">
          <div className={container}>
            <div className="mb-7 grid gap-4 md:mb-9 md:grid-cols-[1fr_1.32fr] md:items-end md:gap-6">
              <div>
                <p className={`${kicker} text-[#6036b9]`}>About the university</p>
                <h2 className={heading} id="about-title">Get to know DIU</h2>
              </div>
              <p className={`max-w-xl ${muted}`}>Founded in 2002, Daffodil International University is a private university in Bangladesh. Its Daffodil Smart City campus offers undergraduate and postgraduate study across computing, engineering, business, health sciences, law, and the humanities.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {resources.map(({ icon, title, description, link, action }) => (
                <article className="flex flex-col items-start rounded-2xl border border-[#e4ddef] bg-[#fcfaff] p-5 lg:p-6" key={title}>
                  <span className={`${iconTile} bg-[#eee8ff] text-[#5832ab]`}><Icon name={icon} /></span>
                  <h3 className={`mt-4 ${subheading}`}>{title}</h3>
                  <p className={`mt-2 mb-4 ${muted}`}>{description}</p>
                  <a href={link} className={`mt-auto ${textLink}`}>{action}</a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={`${section} border-y border-[#eee8f9] bg-[#f5f1ff]`} id="apply" aria-labelledby="apply-title">
          <div className={container}>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className={`${kicker} text-[#6036b9]`}>Application process</p>
                <h2 className={heading} id="apply-title">How to apply</h2>
                <p className={`mt-4 ${muted}`}>Start with program eligibility and check the deadline for your intake.</p>
              </div>
              <a className={`${purpleButton} shrink-0`} href={links.apply}>Open application portal</a>
            </div>
            <ol className="mt-8 mb-6 grid grid-cols-2 gap-5 lg:grid-cols-4 lg:gap-6" role="list">
              {steps.map(({ title, description }, index) => (
                <li className="border-t border-[#d5c5f2] pt-4" key={title}>
                  <span className="mb-3 inline-grid size-8 place-items-center rounded-full bg-[#e6d9ff] font-extrabold text-[#4c2798]" aria-hidden="true">{index + 1}</span>
                  <h3 className={subheading}>{title}</h3>
                  <p className={`mt-2 ${muted}`}>{description}</p>
                </li>
              ))}
            </ol>
            <a className={textLink} href={links.checklist}>View the official document checklist</a>
          </div>
        </section>

        <FaqSection />

        <section className="scroll-mt-4 bg-[#25183e] py-12 text-white lg:py-16" id="contact" aria-labelledby="contact-title">
          <div className={`${container} grid items-center gap-8 md:grid-cols-[1.2fr_1fr]`}>
            <div>
              <p className={`${kicker} text-[#dac7ff]`}>Admissions Office</p>
              <h2 className={heading} id="contact-title">Talk to DIU admissions</h2>
              <p className="mt-3 mb-5 text-[#e4dbf3]">Confirm deadlines, program requirements, or the details of a campus visit with the admissions team.</p>
              <a className={brightButton} href={links.contact}>View official contacts</a>
            </div>
            <address className="grid gap-3 border-t border-[#856ca4] pt-5 wrap-anywhere not-italic md:border-t-0 md:border-l md:pt-0 md:pl-8 [&>*]:flex [&>*]:items-center [&>*]:gap-2.5 [&_svg]:text-[#d8c2ff]">
              <a className="hover:underline" href="tel:+8809617901212"><Icon name="phone" /><span>+880 9617-901212</span></a>
              <a className="hover:underline" href="mailto:admission@daffodilvarsity.edu.bd"><Icon name="mail" /><span>admission@daffodilvarsity.edu.bd</span></a>
              <span><Icon name="pin" /><span>Daffodil Smart City, Birulia, Savar, Dhaka 1216</span></span>
            </address>
          </div>
        </section>
      </main>

      <footer className="bg-[#faf8ff] py-7">
        <div className={`${container} flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between`}>
          <div><Brand /><p className={`mt-2 text-sm ${muted}`}>Independent guide for prospective DIU students.</p></div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Official DIU resources">
            <a className={navLink} href={links.university}>Official DIU website</a>
            <a className={navLink} href={links.admissions}>Admissions information</a>
            <a className={navLink} href={links.apply}>Applicant portal</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
