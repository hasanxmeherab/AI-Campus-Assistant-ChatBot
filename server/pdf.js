import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

const fontDirectory = new URL('../../standard_fonts/', import.meta.resolve('pdfjs-dist/legacy/build/pdf.mjs'))
const standardFontDataUrl = fileURLToPath(fontDirectory).replaceAll('\\', '/')
const sourceUrlPattern = /https?:\/\/[^\s<>]+/g

function pageLines(items) {
  const lines = []

  for (const { str, transform, width, height } of items) {
    if (!str?.trim()) continue

    const [, , , , x, y] = transform
    let line = lines.at(-1)

    if (!line || Math.abs(line.y - y) > 1) {
      line = { y, height, right: x, columns: 1, text: '' }
      lines.push(line)
    }

    const gap = x - line.right
    if (line.text && gap > 18) {
      line.columns += 1
      line.text += ' | '
    } else if (line.text && gap > 1) {
      line.text += ' '
    }

    line.text += str
    line.right = x + width
  }

  return lines.map(({ text, ...line }) => ({ ...line, text: text.trim() }))
}

function pageBlocks(lines, headings) {
  const blocks = []
  const typicalHeight = lines.map(({ height }) => height).sort((a, b) => a - b)[Math.floor(lines.length / 2)]
  let block
  let previous

  for (const line of lines) {
    if (line.height > typicalHeight + 1 && line.columns === 1) {
      if (previous && previous === headings.at(-1) && Math.abs(previous.height - line.height) <= 1 &&
          previous.y - line.y < line.height * 1.6) {
        line.text = `${previous.text} ${line.text}`
      }
      while (headings.length && headings.at(-1).height <= line.height + 1) headings.pop()
      headings.push(line)
      block = undefined
      previous = line
      continue
    }

    const table = line.columns > 1
    const separated = previous && previous.y - line.y > Math.max(previous.height, line.height) * 1.7
    const continueTable = table && previous?.columns === line.columns
    const tableSource = previous?.columns > 1 && /^Source:/i.test(line.text)

    if (!block || (!continueTable && !tableSource && (table || separated))) {
      block = { section: headings.map(({ text }) => text).join(' / '), lines: [] }
      blocks.push(block)
    }

    block.lines.push(line)
    previous = line
  }

  return blocks
}

export async function readPdfPassages(path) {
  const data = new Uint8Array(await readFile(path))
  const task = getDocument({ data, standardFontDataUrl, stopAtErrors: true, isEvalSupported: false })

  try {
    const pdf = await task.promise
    const passages = []
    const headings = []

    for (let number = 1; number <= pdf.numPages; number += 1) {
      const page = await pdf.getPage(number)
      const { items } = await page.getTextContent()

      for (const { section, lines } of pageBlocks(pageLines(items), headings)) {
        const separator = lines.some(({ columns }) => columns > 1) ? '\n' : ' '
        const text = lines.map((line) => line.text).join(separator)
        const urls = [...new Set(text.match(sourceUrlPattern) || [])]
        const linkOnly = lines.every((line) => /^[^:]+:\s*https?:\/\/\S+$/.test(line.text))

        if (!linkOnly) passages.push({ page: number, section, text, urls })
      }

      page.cleanup()
    }

    if (!passages.length) throw new Error('The PDF has no searchable text passages.')

    return { pageCount: pdf.numPages, passages }
  } finally {
    await task.destroy()
  }
}
