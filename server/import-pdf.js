import { basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { database, mongo } from './database.js'
import { readPdfPassages } from './pdf.js'

const path = process.argv[2] || fileURLToPath(new URL('../info/diu_knowledge_base.pdf', import.meta.url))
const filename = basename(path)

try {
  const { pageCount, passages } = await readPdfPassages(path)

  // A single replacement keeps the previous import available until parsing succeeds.
  await database.collection('knowledgeSources').replaceOne(
    { _id: filename },
    { _id: filename, filename, pageCount, passages, importedAt: new Date() },
    { upsert: true },
  )

  console.log(`Imported ${passages.length} passages from ${filename} (${pageCount} PDF pages).`)
} catch (error) {
  console.error(`PDF import failed for ${filename}: ${error.name === 'MongoServerSelectionError' ? 'MongoDB is unavailable.' : error.message}`)
  process.exitCode = 1
} finally {
  await mongo.close()
}
