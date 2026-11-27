import { openAiApiKey, openAiModel } from './config.js'

const embeddingSize = 256

async function request(path, body, signal) {
  const response = await fetch(`https://api.openai.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    const error = new Error('OpenAI rejected the request.')
    error.status = response.status
    throw error
  }
  return response.json()
}

async function embed(input, signal) {
  const payload = await request('embeddings', {
    model: 'text-embedding-3-small',
    input,
    dimensions: embeddingSize,
    encoding_format: 'float',
  }, signal)

  const vectors = payload.data?.slice().sort((a, b) => a.index - b.index)
  if (vectors?.length !== input.length || !vectors.every(({ index, embedding }, i) =>
    index === i && embedding?.length === embeddingSize && embedding.every(Number.isFinite),
  )) {
    throw new Error('OpenAI returned invalid embeddings.')
  }
  return vectors.map(({ embedding }) => embedding)
}

async function generate({ input, instructions, schema }, signal) {
  const payload = await request('responses', {
    model: openAiModel,
    instructions,
    input,
    store: false,
    max_output_tokens: 1100,
    text: { format: { type: 'json_schema', name: 'diu_answer', strict: true, schema } },
  }, signal)

  const content = payload.output?.find(({ type, role }) => type === 'message' && role === 'assistant')?.content
  if (payload.status !== 'completed' || !content?.length || content.some(({ type }) => type !== 'output_text')) {
    throw new Error('OpenAI did not complete the answer.')
  }
  return JSON.parse(content.map(({ text }) => text).join(''))
}

export const openAi = { name: 'OpenAI', embed, generate }
