import { useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

function App() {
  const [status, setStatus] = useState('checking')
  const activeCheck = useRef(null)

  const checkConnection = useCallback(async () => {
    activeCheck.current?.abort()
    const controller = new AbortController()
    activeCheck.current = controller
    setStatus('checking')

    try {
      const response = await fetch('/api/health', {
        cache: 'no-store',
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(6000)]),
      })
      const result = await response.json()

      if (controller.signal.aborted) return

      if (response.ok && result.api === 'online' && result.database === 'connected') {
        setStatus('connected')
      } else if (response.status === 503 && result.api === 'online' && result.database === 'unavailable') {
        setStatus('database-unavailable')
      } else {
        setStatus('api-unavailable')
      }
    } catch {
      if (!controller.signal.aborted) setStatus('api-unavailable')
    }
  }, [])

  useEffect(() => {
    void checkConnection()
    return () => activeCheck.current?.abort()
  }, [checkConnection])

  return (
    <main className="grid min-h-screen place-items-center bg-violet-50 px-5 py-12 text-slate-950">
      <section className="w-full max-w-lg rounded-3xl border border-violet-100 bg-white p-6 shadow-xl shadow-violet-950/5 sm:p-10">
        <p className="text-sm font-semibold text-violet-700">Daffodil International University</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">AI Campus Assistant</h1>
        <h2 className="mt-8 text-lg font-semibold">Connection status</h2>
        <dl aria-live="polite" className="mt-3 divide-y divide-violet-100 rounded-xl border border-violet-100 bg-violet-50/60 px-4">
          {connectionLabels[status].map(([service, label]) => (
            <div key={service} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
              <dt className="font-medium">{service}</dt>
              <dd className="text-sm text-slate-700">{label}</dd>
            </div>
          ))}
        </dl>
        <button
          type="button"
          onClick={checkConnection}
          disabled={status === 'checking'}
          className="mt-6 rounded-lg bg-violet-700 px-4 py-2.5 font-semibold text-white hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 disabled:cursor-wait disabled:opacity-60"
        >
          Check connection
        </button>
      </section>
    </main>
  )
}

const connectionLabels = {
  checking: [['Express API', 'Checking…'], ['MongoDB', 'Checking…']],
  connected: [['Express API', 'Online'], ['MongoDB', 'Connected']],
  'api-unavailable': [['Express API', 'Unavailable'], ['MongoDB', 'Could not check']],
  'database-unavailable': [['Express API', 'Online'], ['MongoDB', 'Unavailable']],
}

createRoot(document.getElementById('root')).render(<App />)
