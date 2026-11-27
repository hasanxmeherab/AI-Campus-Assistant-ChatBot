import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { admissionPassages } from './admissions.js'
import { database, mongo } from './database.js'

const path = process.argv[2] || fileURLToPath(new URL('../info/admission_requirements.json', import.meta.url))
const filename = basename(path)

try {
  const data = JSON.parse((await readFile(path, 'utf8')).replace(/^\uFEFF/, ''))
  const passages = admissionPassages(data)
  const source = {
    _id: 'admission_requirements.json',
    filename,
    admissionCycle: data.admission_cycle,
    coverageStatus: data.coverage_status,
    retrievalDate: data.retrieval_date,
    notes: data.notes,
    passages,
    importedAt: new Date(),
  }
  await database.collection('knowledgeSources').replaceOne({ _id: source._id }, source, { upsert: true })
  console.log(`Imported ${passages.length} admissions passages from ${filename}.`)
} catch (error) {
  const explanation = error.name === 'MongoServerSelectionError' ? 'MongoDB is unavailable.' : error.message
  console.error(`Admissions import failed for ${filename}: ${explanation}`)
  process.exitCode = 1
} finally {
  await mongo.close()
}
