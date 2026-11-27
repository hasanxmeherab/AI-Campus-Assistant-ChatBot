import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { maxAnswerLength, maxHistoryCharacters, maxHistoryMessages, maxQuestionLength } from '../../chat-limits.js'
import './styles.css'
import AdmissionsHome from './AdmissionsHome.jsx'

const suggestions = [
  { title: 'Admissions', question: 'What is the Spring 2027 admission deadline?' },
  { title: 'Tuition fees', question: 'What is the tuition for BBA in Marketing?' },
  { title: 'Library hours', question: 'When does the library open?' },
  { title: 'Waivers', question: 'Can I combine multiple waivers?' },
]

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-700'

function recentHistory(messages) {
  const history = []
  let characters = 0
  for (const { role, text } of messages.slice(-maxHistoryMessages).reverse()) {
    if (role !== 'user' && role !== 'assistant') continue
    const content = text.slice(0, role === 'user' ? maxQuestionLength : maxAnswerLength)
    characters += content.length
    if (characters > maxHistoryCharacters) break
    history.push({ role, content })
  }
  return history.reverse()
}

function ChatMessage({ message, onRetry, pending }) {
  if (message.role === 'user') {
    return (
      <div className="ml-auto max-w-[90%] rounded-2xl rounded-br-sm bg-[#ece5ff] px-4 py-3 text-[#2e214c] sm:max-w-[78%]">
        <p className="mb-1 text-xs font-semibold text-[#5b3c8a]">You</p>
        <p className="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
      </div>
    )
  }

  return (
    <article className="flex items-start gap-2 sm:gap-3">
      <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#5c34a4] text-[0.65rem] font-bold text-white">DIU</span>
      <div className="min-w-0 rounded-2xl rounded-tl-sm border border-[#e6dff1] bg-white px-4 py-3 shadow-[0_4px_16px_#30234f08] sm:px-5">
        <p className="mb-1 text-sm font-semibold text-[#3d2d5b]">Campus Assistant</p>
        <p className="whitespace-pre-wrap break-words leading-relaxed text-[#302741]">{message.text}</p>
        {message.notice && <p className="mt-3 text-sm text-[#5c5275]">{message.notice}</p>}
        {message.role === 'error' && onRetry && (
          <button type="button" onClick={() => onRetry(message.question)} disabled={pending} className={`mt-3 rounded-md px-2 py-1 text-sm font-semibold text-violet-800 hover:bg-violet-50 disabled:opacity-50 ${focusRing}`}>
            Try again
          </button>
        )}
      </div>
    </article>
  )
}

function CampusChat() {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [pending, setPending] = useState(false)
  const activeRequest = useRef(null)
  const input = useRef(null)
  const transcript = useRef(null)

  useEffect(() => () => activeRequest.current?.abort(), [])

  useEffect(() => {
    const area = transcript.current
    if (area && (messages.length || pending)) area.scrollTop = area.scrollHeight
  }, [messages, pending])

  async function send(value, retryId) {
    const text = value.trim()
    if (!text || activeRequest.current) return

    const history = recentHistory(retryId ? messages.slice(0, -2) : messages)
    const controller = new AbortController()
    activeRequest.current = controller
    setPending(true)
    if (!retryId) {
      setQuestion('')
      setMessages((previous) => [...previous, { id: crypto.randomUUID(), role: 'user', text }])
    }

    let reply
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, history }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(45000)]),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not reach the assistant.')
      reply = { role: 'assistant', text: result.answer, notice: result.notice }
    } catch {
      reply = { role: 'error', text: 'I couldn’t answer that just now. Please try again.', question: text }
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null
        const message = { ...reply, id: retryId || crypto.randomUUID() }
        setMessages((previous) => retryId
          ? previous.map((item) => item.id === retryId ? message : item)
          : [...previous, message])
        setPending(false)
      }
    }
  }

  function newChat() {
    activeRequest.current?.abort()
    activeRequest.current = null
    setPending(false)
    setMessages([])
    setQuestion('')
    input.current?.focus()
  }

  function submit(event) {
    event.preventDefault()
    void send(question)
  }

  function handleInputKey(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void send(question)
    }
  }

  return (
    <div className="grid h-dvh grid-rows-[auto_minmax(0,1fr)] overflow-hidden bg-[#f9f7ff] text-[#261a3f] md:grid-cols-[15rem_minmax(0,1fr)] md:grid-rows-1">
      <header className="flex items-center justify-between gap-3 border-b border-[#3c2b5f] bg-[#24183e] px-4 py-3 text-white sm:px-6 md:flex-col md:items-stretch md:justify-start md:border-r md:border-b-0 md:px-5 md:py-7">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#a182f5] text-sm font-black tracking-tight text-[#261244]">DIU</span>
          <p className="text-sm leading-snug font-semibold text-[#f2ebff] sm:text-base">AI Campus Assistant</p>
        </div>
        <a href="#home" className="rounded-sm text-sm font-semibold text-[#e8daff] underline underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:mt-4">
          Admissions guide
        </a>
        <button type="button" onClick={newChat} className="flex shrink-0 items-center gap-2 rounded-xl border border-[#756198] px-3 py-2 text-sm font-semibold text-[#f6efff] hover:bg-[#3c2a61] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:mt-6 md:px-4">
          <span className="text-lg leading-none" aria-hidden="true">+</span> New chat
        </button>
      </header>

      <main className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto]">
        <div ref={transcript} className="overflow-y-auto px-4 sm:px-8">
          {!messages.length ? (
            <div className="mx-auto flex min-h-full max-w-[44rem] flex-col justify-center py-8 sm:py-12">
              <p className="mb-3 text-sm font-semibold tracking-wide text-[#6945a4]">Daffodil International University</p>
              <h1 className="max-w-xl text-4xl leading-[1.08] font-bold tracking-tight text-[#281b43] sm:text-5xl lg:text-[3.5rem]">How can I help you?</h1>
              <p className="mt-4 max-w-md text-base leading-relaxed text-[#57496f]">Ask me about DIU, get help with another topic, or keep going with a follow-up question.</p>
              <div className="mt-7 grid gap-2 sm:grid-cols-2 sm:gap-3">
                {suggestions.map(({ title, question: sample }) => (
                  <button key={title} type="button" onClick={() => void send(sample)} className={`rounded-xl border border-[#e2d8f2] bg-white px-4 py-3 text-left hover:border-violet-400 hover:bg-[#f5efff] ${focusRing}`}>
                    <span className="block text-sm font-bold text-[#4d2e79]">{title}</span>
                    <span className="mt-1 block text-sm leading-snug text-[#514661]">{sample}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div role="log" aria-label="Chat messages" className="mx-auto flex max-w-[44rem] flex-col gap-5 py-6 sm:py-9">
              <h1 className="sr-only">Campus Assistant chat</h1>
              {messages.map((message, index) => (
                <ChatMessage key={message.id} message={message} pending={pending}
                  onRetry={index === messages.length - 1 ? (text) => void send(text, message.id) : undefined} />
              ))}
              {pending && <p className="px-1 text-sm font-medium text-[#6945a4]">Looking that up…</p>}
            </div>
          )}
        </div>

        <div className="border-t border-[#e6dff1] bg-[#f9f7ff] px-4 pt-3 pb-4 sm:px-8 sm:pt-4 sm:pb-6">
          <form onSubmit={submit} className="mx-auto max-w-[44rem]">
            <div className="flex items-end gap-2 rounded-2xl border border-[#d9cde9] bg-white p-2 shadow-[0_5px_20px_#3520520d] focus-within:border-violet-600">
              <label htmlFor="question" className="sr-only">Message the Campus Assistant</label>
              <textarea ref={input} id="question" rows={2} maxLength={maxQuestionLength} value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={handleInputKey} placeholder="Message the Campus Assistant…" className="min-w-0 flex-1 resize-none rounded-xl px-3 py-2 text-base leading-6 text-[#302741] placeholder:text-[#6a5e7a] focus:outline-none" />
              <button type="submit" disabled={!question.trim() || pending} className={`min-h-10 rounded-xl bg-[#6137ac] px-4 text-sm font-semibold text-white hover:bg-[#4d2a8d] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}>
                Send
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

function App() {
  const [showChat, setShowChat] = useState(() => window.location.hash === '#chat')
  const chat = useRef(null)

  useLayoutEffect(() => {
    function updateView() {
      setShowChat(window.location.hash === '#chat')
    }

    window.addEventListener('hashchange', updateView)
    return () => window.removeEventListener('hashchange', updateView)
  }, [])

  useLayoutEffect(() => {
    if (showChat) {
      window.scrollTo(0, 0)
      chat.current.focus({ preventScroll: true })
    } else {
      const section = document.getElementById(window.location.hash.slice(1))
      if (section) section.scrollIntoView()
      else window.scrollTo(0, 0)
    }
  }, [showChat])

  return (
    <>
      <div hidden={showChat}><AdmissionsHome /></div>
      <div ref={chat} hidden={!showChat} tabIndex={-1} role="region" aria-label="Campus Assistant">
        <CampusChat />
      </div>
    </>
  )
}

createRoot(document.getElementById('root')).render(<App />)
