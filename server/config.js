import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'

function readEnvFile(relativePath) {
  try {
    return parseEnv(readFileSync(new URL(relativePath, import.meta.url), 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return {}
    throw error
  }
}

const env = {
  ...readEnvFile('.env'),
  ...readEnvFile('../.env'),
  ...process.env,
}

export const port = Number(env.PORT || 3001)
export const mongoUri = env.MONGODB_URI || 'mongodb://127.0.0.1:27017/'
export const databaseName = env.MONGODB_DATABASE || 'diu_campus_assistant'
export const openAiApiKey = env.OPENAI_API_KEY?.trim()
export const openAiModel = env.OPENAI_MODEL?.trim() || 'gpt-4.1-mini'
