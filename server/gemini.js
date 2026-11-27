import { geminiApiKey, geminiModel } from './config.js'

const embeddingModel = 'models/gemini-embedding-2'
const embeddingSize = 768

async function request(method, body, signal) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${method}`, {
    method: 'POST',
    headers: {
      'x-goog-api-key': geminiApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    const error = new Error('Gemini rejected the request.')
    error.status = response.status
    throw error
  }
  return response.json()
}

async function embed(inputs, signal, { query = false } = {}) {
  const prefix = query ? 'task: question answering | query: ' : 'title: none | text: '
  const requests = inputs.map((text) => ({
    model: embeddingModel,
    content: { parts: [{ text: prefix + text }] },
    outputDimensionality: embeddingSize,
  }))
  const payload = await request(`${embeddingModel}:batchEmbedContents`, { requests }, signal)
  const vectors = payload.embeddings?.map(({ values }) => values)
  if (vectors?.length !== inputs.length || !vectors.every((vector) =>
    Array.isArray(vector) && vector.length === embeddingSize && vector.every(Number.isFinite),
  )) {
    throw new Error('Gemini returned invalid embeddings.')
  }
  return vectors
}

async function generate({ input, instructions, schema }, signal) {
  const payload = await request(`models/${encodeURIComponent(geminiModel)}:generateContent`, {
    systemInstruction: { parts: [{ text: instructions }] },
    contents: [{ role: 'user', parts: [{ text: input }] }],
    generationConfig: {
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
      responseJsonSchema: schema,
    },
  }, signal)

  const candidate = payload.candidates?.[0]
  const content = candidate?.content?.parts?.filter(({ thought, text }) => !thought && typeof text === 'string')
  if (candidate?.finishReason !== 'STOP' || !content?.length) {
    throw new Error('Gemini did not complete the answer.')
  }
  return JSON.parse(content.map(({ text }) => text).join(''))
}

export const gemini = { name: 'Gemini', embed, generate }
