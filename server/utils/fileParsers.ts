import * as mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import JSZip from 'jszip'
import { parse as parseYaml } from 'yaml'

const stripXml = (xml: string): string =>
    xml
        .replace(/<\/?[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim()


export async function parseDocxBuffer(buffer: Buffer | Uint8Array): Promise<string> {
    const res = await mammoth.extractRawText({ buffer: buffer as Buffer })
    return res.value
}

export async function parsePptxBuffer(buffer: Buffer | Uint8Array): Promise<string> {
    const zip = await JSZip.loadAsync(buffer)
    const slideFiles = Object.keys(zip.files)
        .filter((p) => p.startsWith('ppt/slides/slide') && p.endsWith('.xml'))
        .sort()

    let text = ''
    for (const p of slideFiles) {
        const file = zip.file(p)
        if (!file) continue
        const xml = await file.async('string')
        text += stripXml(xml) + '\n'
    }
    return text.trim()
}

export function parseXlsxBuffer(buffer: Buffer | Uint8Array): string {
    const wb = XLSX.read(buffer, { type: 'buffer' })

    const sheetName = wb.SheetNames?.[0]
    if (!sheetName) return ''

    const sheet = wb.Sheets[sheetName]
    return XLSX.utils.sheet_to_csv(sheet)
}

export async function parseOdfBuffer(buffer: Buffer | Uint8Array): Promise<string> {
    const zip = await JSZip.loadAsync(buffer)

    const file = zip.file('content.xml')
    if (!file) return ''

    const xml = await file.async('string')
    return stripXml(xml)
}

export function parseCsvBuffer(buffer: Buffer | Uint8Array): string {
    return Buffer.from(buffer).toString('utf8')
}

export function parseJsonBuffer(buffer: Buffer | Uint8Array): string {
    return Buffer.from(buffer).toString('utf8')
}

export function parseYamlBuffer(buffer: Buffer | Uint8Array): string {
    const raw = Buffer.from(buffer).toString('utf8')
    const doc = parseYaml(raw)

    return typeof doc === 'string' ? doc : JSON.stringify(doc)
}

export function parseTxtBuffer(buffer: Buffer | Uint8Array): string {
    return Buffer.from(buffer).toString('utf8')
}

export async function extractTextFromFileBuffer(
    filename: string,
    mimetype: string,
    buffer: Buffer | Uint8Array
): Promise<string> {
    const lower = (filename || '').toLowerCase()
    const is = (ext: string) => lower.endsWith(ext)

    try {
        if (is('.docx')) return await parseDocxBuffer(buffer)
        if (is('.pptx')) return await parsePptxBuffer(buffer)
        if (is('.xlsx')) return parseXlsxBuffer(buffer)
        if (is('.odt') || is('.odp') || is('.ods')) return await parseOdfBuffer(buffer)
        if (is('.csv') || mimetype.toLowerCase().includes('csv')) return parseCsvBuffer(buffer)
        if (is('.json') || mimetype.toLowerCase().includes('json')) return parseJsonBuffer(buffer)
        if (is('.yml') || is('.yaml')) return parseYamlBuffer(buffer)
        if (is('.txt')) return parseTxtBuffer(buffer)
        return parseTxtBuffer(buffer)
    } catch (err) {
        console.error('[fileParsers] Error extracting text', {
            filename: lower,
            mimetype,
            error: err
        })
        throw err
    }
}


