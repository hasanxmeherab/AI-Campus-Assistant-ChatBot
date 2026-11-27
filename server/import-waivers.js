import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { database, mongo } from './database.js'
import { waiverPassages } from './waivers.js'

const sourceId = 'scholarships_waivers.json'
const path = process.argv[2] || fileURLToPath(new URL('../info/scholarships_waivers.json', import.meta.url))
const filename = basename(path)

try {
  const data = JSON.parse((await readFile(path, 'utf8')).replace(/^\uFEFF/, ''))
  const passages = waiverPassages(data)
  const source = {
    _id: sourceId,
    filename,
    dateChecked: data.date_checked,
    recordCount: data.record_count,
    passages,
    importedAt: new Date(),
  }
  await database.collection('knowledgeSources').replaceOne({ _id: sourceId }, source, { upsert: true })
  console.log(`Imported ${data.record_count} scholarship and waiver records as ${passages.length} searchable passages from ${filename}.`)
} catch (error) {
  const reason = error.name === 'MongoServerSelectionError' ? 'MongoDB is unavailable.' : error.message
  console.error(`Waiver import failed for ${filename}: ${reason}`)
  process.exitCode = 1
} finally {
  await mongo.close()
}
