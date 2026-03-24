import '@logseq/libs'
import createChordproJS from 'chordprojs'
import { LSPluginBaseInfo, SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin'

type ChordLine = {
  type: 'chordLine'
  lyrics: string
  chords: string[]
  positions: number[]
}

type SongLine =
  | ChordLine
  | { type: 'comment'; content: string; format?: 'plain' | 'italic' | 'box' }
  | { type: 'highlight'; content: string }
  | { type: 'image'; src: string; scale?: string }
  | { type: 'lyricLine'; content: string }
  | { type: 'chorusRef'; label?: string }
  | { type: 'chord'; name: string }
  | { type: 'pageBreak' | 'physicalPageBreak' | 'columnBreak' | 'empty' }

type SongSection = {
  type: string
  label?: string
  lines: SongLine[]
  content?: string
}

type SongDocument = {
  title?: string
  subtitle?: string
  artist?: string
  key?: string
  metadata?: {
    chords?: Record<string, string>
  }
  sections: SongSection[]
}

type LegacyBlock = {
  uuid: string
  content?: string
  children?: LegacyBlock[]
}

type PageLike = {
  uuid?: string
  name?: string
  originalName?: string
  properties?: Record<string, any>
  [key: string]: any
}

const PREVIEW_CLASS = 'chordpro-inline-preview'
const PAGE_PREVIEW_CLASS = 'chordpro-page-preview'
const DEBUG_PREFIX = '[ChordPro Render]'
const MASTER_CHORDLIST_PAGE = 'Master Chordlist'
const CHORD_MACRO_NAME = ':chordpro-chord'
const PLAYED_BLOCK_LABEL = 'played'

const BUILTIN_CHORD_LIBRARY: Record<string, string> = {
  A: 'Built-in chord library\n\nFingering: x 0 2 2 2 0\nName: A major',
  A7: 'Built-in chord library\n\nFingering: x 0 2 0 2 0\nName: A7',
  Amaj7: 'Built-in chord library\n\nFingering: x 0 2 1 2 0\nName: A major 7',
  Am: 'Built-in chord library\n\nFingering: x 0 2 2 1 0\nName: A minor',
  Am7: 'Built-in chord library\n\nFingering: x 0 2 0 1 0\nName: A minor 7',
  Asus2: 'Built-in chord library\n\nFingering: x 0 2 2 0 0\nName: A suspended 2',
  Asus4: 'Built-in chord library\n\nFingering: x 0 2 2 3 0\nName: A suspended 4',
  B: 'Built-in chord library\n\nFingering: x 2 4 4 4 2\nName: B major (barre)',
  B7: 'Built-in chord library\n\nFingering: x 2 1 2 0 2\nName: B7',
  Bm: 'Built-in chord library\n\nFingering: x 2 4 4 3 2\nName: B minor (barre)',
  Bm7: 'Built-in chord library\n\nFingering: x 2 4 2 3 2\nName: B minor 7',
  Bb: 'Built-in chord library\n\nFingering: x 1 3 3 3 1\nName: B flat major (barre)',
  Bb7: 'Built-in chord library\n\nFingering: x 1 3 1 3 1\nName: B flat 7',
  Bbm: 'Built-in chord library\n\nFingering: x 1 3 3 2 1\nName: B flat minor (barre)',
  Bbm7: 'Built-in chord library\n\nFingering: x 1 3 1 2 1\nName: B flat minor 7',
  C: 'Built-in chord library\n\nFingering: x 3 2 0 1 0\nName: C major',
  C7: 'Built-in chord library\n\nFingering: x 3 2 3 1 0\nName: C7',
  Cmaj7: 'Built-in chord library\n\nFingering: x 3 2 0 0 0\nName: C major 7',
  Cm: 'Built-in chord library\n\nFingering: x 3 5 5 4 3\nName: C minor (barre)',
  Cm7: 'Built-in chord library\n\nFingering: x 3 5 3 4 3\nName: C minor 7',
  Csus2: 'Built-in chord library\n\nFingering: x 3 0 0 1 0\nName: C suspended 2',
  Csus4: 'Built-in chord library\n\nFingering: x 3 3 0 1 1\nName: C suspended 4',
  D: 'Built-in chord library\n\nFingering: x x 0 2 3 2\nName: D major',
  D7: 'Built-in chord library\n\nFingering: x x 0 2 1 2\nName: D7',
  Dmaj7: 'Built-in chord library\n\nFingering: x x 0 2 2 2\nName: D major 7',
  Dm: 'Built-in chord library\n\nFingering: x x 0 2 3 1\nName: D minor',
  Dm7: 'Built-in chord library\n\nFingering: x x 0 2 1 1\nName: D minor 7',
  Ds2: 'Built-in chord library\n\nFingering: x x 0 2 3 0\nName: D suspended 2',
  Dsus2: 'Built-in chord library\n\nFingering: x x 0 2 3 0\nName: D suspended 2',
  Dsus4: 'Built-in chord library\n\nFingering: x x 0 2 3 3\nName: D suspended 4',
  E: 'Built-in chord library\n\nFingering: 0 2 2 1 0 0\nName: E major',
  E7: 'Built-in chord library\n\nFingering: 0 2 0 1 0 0\nName: E7',
  Emaj7: 'Built-in chord library\n\nFingering: 0 2 1 1 0 0\nName: E major 7',
  Em: 'Built-in chord library\n\nFingering: 0 2 2 0 0 0\nName: E minor',
  Em7: 'Built-in chord library\n\nFingering: 0 2 2 0 3 0\nName: E minor 7',
  Esus4: 'Built-in chord library\n\nFingering: 0 2 2 2 0 0\nName: E suspended 4',
  F: 'Built-in chord library\n\nFingering: 1 3 3 2 1 1\nName: F major (barre)',
  F7: 'Built-in chord library\n\nFingering: 1 3 1 2 1 1\nName: F7',
  Fmaj7: 'Built-in chord library\n\nFingering: x x 3 2 1 0\nName: F major 7',
  Fm: 'Built-in chord library\n\nFingering: 1 3 3 1 1 1\nName: F minor (barre)',
  Fm7: 'Built-in chord library\n\nFingering: 1 3 1 1 1 1\nName: F minor 7',
  G: 'Built-in chord library\n\nFingering: 3 2 0 0 0 3\nName: G major',
  G7: 'Built-in chord library\n\nFingering: 3 2 0 0 0 1\nName: G7',
  Gmaj7: 'Built-in chord library\n\nFingering: 3 2 0 0 0 2\nName: G major 7',
  Gm: 'Built-in chord library\n\nFingering: 3 5 5 3 3 3\nName: G minor (barre)',
  Gm7: 'Built-in chord library\n\nFingering: 3 5 3 3 3 3\nName: G minor 7',
  Gsus4: 'Built-in chord library\n\nFingering: 3 3 0 0 1 3\nName: G suspended 4',
  H: 'Built-in chord library\n\nFingering: x 2 4 4 4 2\nName: H major / B major (barre)',
  H7: 'Built-in chord library\n\nFingering: x 2 1 2 0 2\nName: H7 / B7',
  Hm: 'Built-in chord library\n\nFingering: x 2 4 4 3 2\nName: H minor / B minor (barre)',
  Hm7: 'Built-in chord library\n\nFingering: x 2 4 2 3 2\nName: H minor 7 / B minor 7',
  Db: 'Built-in chord library\n\nFingering: x 4 6 6 6 4\nName: D flat major (barre)',
  Db7: 'Built-in chord library\n\nFingering: x 4 6 4 6 4\nName: D flat 7',
  Dbm: 'Built-in chord library\n\nFingering: x 4 6 6 5 4\nName: D flat minor (barre)',
  Dbm7: 'Built-in chord library\n\nFingering: x 4 6 4 5 4\nName: D flat minor 7',
  Eb: 'Built-in chord library\n\nFingering: x 6 8 8 8 6\nName: E flat major (barre)',
  Eb7: 'Built-in chord library\n\nFingering: x 6 8 6 8 6\nName: E flat 7',
  Ebm: 'Built-in chord library\n\nFingering: x 6 8 8 7 6\nName: E flat minor (barre)',
  Ebm7: 'Built-in chord library\n\nFingering: x 6 8 6 7 6\nName: E flat minor 7',
  Ab: 'Built-in chord library\n\nFingering: 4 6 6 5 4 4\nName: A flat major (barre)',
  Ab7: 'Built-in chord library\n\nFingering: 4 6 4 5 4 4\nName: A flat 7',
  Abm: 'Built-in chord library\n\nFingering: 4 6 6 4 4 4\nName: A flat minor (barre)',
  Abm7: 'Built-in chord library\n\nFingering: 4 6 4 4 4 4\nName: A flat minor 7',
  BbmMaj7: 'Built-in chord library\n\nFingering: x 1 3 2 2 1\nName: B flat minor major 7',
  Fsharp: 'Built-in chord library\n\nFingering: 2 4 4 3 2 2\nName: F sharp major (barre)',
  'F#': 'Built-in chord library\n\nFingering: 2 4 4 3 2 2\nName: F sharp major (barre)',
  'F#7': 'Built-in chord library\n\nFingering: 2 4 2 3 2 2\nName: F sharp 7',
  'F#m': 'Built-in chord library\n\nFingering: 2 4 4 2 2 2\nName: F sharp minor (barre)',
  'F#m7': 'Built-in chord library\n\nFingering: 2 4 2 2 2 2\nName: F sharp minor 7',
  Gsharp: 'Built-in chord library\n\nFingering: 4 6 6 5 4 4\nName: G sharp / A flat major (barre)',
  'G#': 'Built-in chord library\n\nFingering: 4 6 6 5 4 4\nName: G sharp major (barre)',
  'G#m': 'Built-in chord library\n\nFingering: 4 6 6 4 4 4\nName: G sharp minor (barre)',
  'G#m7': 'Built-in chord library\n\nFingering: 4 6 4 4 4 4\nName: G sharp minor 7',
  Csharp: 'Built-in chord library\n\nFingering: x 4 6 6 6 4\nName: C sharp major (barre)',
  'C#': 'Built-in chord library\n\nFingering: x 4 6 6 6 4\nName: C sharp major (barre)',
  'C#7': 'Built-in chord library\n\nFingering: x 4 6 4 6 4\nName: C sharp 7',
  'C#m': 'Built-in chord library\n\nFingering: x 4 6 6 5 4\nName: C sharp minor (barre)',
  'C#m7': 'Built-in chord library\n\nFingering: x 4 6 4 5 4\nName: C sharp minor 7',
}

const settingsSchema: Array<SettingSchemaDesc> = [
  {
    key: 'showComments',
    type: 'boolean',
    title: 'Show comments',
    description: 'Render ChordPro comment directives in the preview.',
    default: true,
  },
]

const styles = `
.chordpro-plugin {
  --cp-bg: var(--ls-secondary-background-color);
  --cp-bg-muted: color-mix(in srgb, var(--ls-secondary-background-color) 84%, transparent);
  --cp-border: var(--ls-border-color);
  --cp-text: var(--ls-primary-text-color);
  --cp-muted: var(--ls-gray-text-color);
  --cp-chord: var(--ls-link-text-color);
  --cp-chorus: color-mix(in srgb, var(--ls-link-text-color) 18%, transparent);
  --cp-highlight: color-mix(in srgb, #f6d365 28%, transparent);
  --cp-tooltip-bg: color-mix(in srgb, var(--ls-primary-background-color) 82%, black);
  --cp-tooltip-text: var(--ls-primary-text-color);
  background: var(--cp-bg-muted);
  border: 1px solid var(--cp-border);
  border-radius: 10px;
  color: var(--cp-text);
  margin: 0.5rem 0;
  overflow-x: auto;
  overflow-y: visible;
  padding: 1rem 1rem 0.75rem;
  position: relative;
}

.chordpro-plugin h1,
.chordpro-plugin h2,
.chordpro-plugin .artist,
.chordpro-plugin .key {
  margin: 0 0 0.45rem;
}

.chordpro-plugin h1 {
  font-size: 1.35rem;
}

.chordpro-plugin h2,
.chordpro-plugin .artist,
.chordpro-plugin .key,
.chordpro-plugin .section-label,
.chordpro-plugin .comment,
.chordpro-plugin .chorus-ref {
  color: var(--cp-muted);
}

.chordpro-plugin .section {
  margin-bottom: 0.9rem;
  padding-left: 0.8rem;
}

.chordpro-plugin .section.chorus {
  background: var(--cp-chorus);
  border-left: 4px solid var(--cp-chord);
  border-radius: 8px;
  padding: 0.75rem 0.8rem;
}

.chordpro-plugin .section.bridge,
.chordpro-plugin .section.tab,
.chordpro-plugin .section.grid,
.chordpro-plugin .section.abc,
.chordpro-plugin .section.ly,
.chordpro-plugin .section.svg,
.chordpro-plugin .section.textblock {
  border-left: 4px solid var(--cp-border);
}

.chordpro-plugin .section-label {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  margin-bottom: 0.35rem;
  text-transform: uppercase;
}

.chordpro-plugin pre,
.chordpro-plugin .lyric-line,
.chordpro-plugin .lyric-line-only,
.chordpro-plugin .chord-definition,
.chordpro-plugin .tab-content,
.chordpro-plugin .grid-content,
.chordpro-plugin .abc-content,
.chordpro-plugin .ly-content,
.chordpro-plugin .svg-content,
.chordpro-plugin .textblock-content {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.chordpro-plugin pre {
  background: transparent;
  margin: 0;
  padding: 0;
  white-space: pre;
}

.chordpro-plugin .chord-line {
  color: var(--cp-chord);
  font-weight: 700;
  line-height: 1.2;
}

.chordpro-plugin .lyric-line,
.chordpro-plugin .lyric-line-only {
  line-height: 1.2;
  margin-bottom: 0.5rem;
}

.chordpro-plugin .comment {
  font-style: italic;
  margin-bottom: 0.35rem;
}

.chordpro-plugin .comment-box {
  border: 1px solid var(--cp-border);
  border-radius: 6px;
  padding: 0.4rem 0.55rem;
}

.chordpro-plugin .highlight {
  background: var(--cp-highlight);
  border-radius: 4px;
  display: inline-block;
  margin-bottom: 0.35rem;
  padding: 0.1rem 0.35rem;
}

.chordpro-plugin .chord-token {
  border-radius: 4px;
  cursor: pointer;
  display: inline-block;
  position: relative;
  transition: background-color 120ms ease, transform 120ms ease;
  z-index: 1;
}

.chordpro-plugin .chord-token:hover {
  background: color-mix(in srgb, var(--cp-chord) 16%, transparent);
  transform: translateY(-1px);
}

.chordpro-plugin .chord-diagram {
  background: var(--cp-bg);
  border: 1px solid var(--cp-border);
  border-radius: 8px;
  display: inline-block;
  margin: 0 0.5rem 0.5rem 0;
  padding: 0.5rem 0.65rem;
  vertical-align: top;
}

.chordpro-plugin .chord-name {
  color: var(--cp-chord);
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.chordpro-plugin .empty-line {
  height: 0.75rem;
}

.chordpro-plugin .page-break,
.chordpro-plugin .physical-page-break {
  border-top: 1px dashed var(--cp-border);
  margin: 0.75rem 0;
}

.chordpro-plugin .column-break {
  border-left: 1px dashed var(--cp-border);
  display: inline-block;
  height: 1.25rem;
  margin: 0 0.5rem;
}

.${PAGE_PREVIEW_CLASS} {
  margin-bottom: 1rem;
}

.chordpro-sidebar {
  color: var(--ls-primary-text-color);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
}

.chordpro-sidebar-header {
  align-items: center;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
}

.chordpro-sidebar-close {
  background: var(--ls-secondary-background-color);
  border: 1px solid var(--ls-border-color);
  border-radius: 6px;
  color: var(--ls-primary-text-color);
  cursor: pointer;
  padding: 0.2rem 0.5rem;
}

.chordpro-sidebar-body {
  background: var(--ls-secondary-background-color);
  border-radius: 8px;
  color: var(--ls-primary-text-color);
  flex: 1;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  margin: 0;
  overflow: auto;
  padding: 0.75rem;
  white-space: pre-wrap;
}
`

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      default:
        return '&#39;'
    }
  })
}

function sanitizeChordPro(content: string): string {
  return content
    .replace(/^\s*\[\[chordpro\]\]\s*\n?/i, '')
    .replace(/^\s*(?:[-+*]\s+)?```(?:chordpro|chords)\s*\n?/i, '')
    .replace(/\n\s*```\s*$/i, '')
    .replace(/^\s{2}/gm, '')
    .trim()
}

function isLegacyChordProBlock(content: string): boolean {
  return /^\s*\[\[chordpro\]\]/i.test(content)
}

function isFencedChordProBlock(content: string): boolean {
  return /^\s*(?:[-+*]\s+)?```(?:chordpro|chords)\b/i.test(content)
}

function normalizeChordName(chord: string): string {
  return chord.trim().replace(/♯/g, '#').replace(/♭/g, 'b')
}

const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
const NOTE_INDEX: Record<string, number> = {
  C: 0,
  'B#': 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  F: 5,
  'E#': 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
  H: 11,
  Cb: 11,
}

function transposeNote(note: string, steps: number): string {
  if (!steps) return note

  const normalized = normalizeChordName(note)
  const index = NOTE_INDEX[normalized]
  if (index == null) return note

  const nextIndex = (index + steps % 12 + 12) % 12
  const preferFlat = /b/.test(normalized)
  const usedH = normalized === 'H'
  const candidate = (preferFlat ? FLAT_NOTES : SHARP_NOTES)[nextIndex]
  if (usedH && candidate === 'B') return 'H'
  return candidate
}

function transposeChordSymbol(chord: string, steps: number): string {
  if (!steps) return chord

  const parts = chord.split('/')
  const transposePart = (value: string) => {
    const match = value.match(/^([A-GH](?:#|b|♯|♭)?)(.*)$/)
    if (!match) return value
    const [, root, suffix] = match
    return `${transposeNote(root, steps)}${suffix}`
  }

  return parts.map(transposePart).join('/')
}

function getResolvedChordDefinition(chord: string, chordDefinitions: Record<string, string>): string | null {
  const normalizedChord = normalizeChordName(chord)
  const explicit = chordDefinitions[chord]?.trim() || chordDefinitions[normalizedChord]?.trim()
  if (explicit) return explicit

  return BUILTIN_CHORD_LIBRARY[normalizedChord] ?? null
}

function extractFingering(definition: string): string[] | null {
  const builtinMatch = definition.match(/Fingering:\s*([x0-9 ]+)/i)
  if (builtinMatch) {
    const parts = builtinMatch[1].trim().split(/\s+/).slice(0, 6)
    return parts.length === 6 ? parts : null
  }

  const fretsMatch = definition.match(/frets\s+([x0-9 ]+)/i)
  if (fretsMatch) {
    const parts = fretsMatch[1].trim().split(/\s+/).slice(0, 6)
    return parts.length === 6 ? parts : null
  }

  return null
}

function renderChordDiagramFromFingering(chord: string, fingering: string[] | null): string {
  if (!fingering) return ''

  const stringSpacing = 15
  const fretSpacing = 15
  const originLeft = 12
  const originTop = 12

  const numericFrets = fingering
    .map((value) => (value.toLowerCase() === 'x' ? null : Number(value)))
    .filter((value): value is number => Number.isFinite(value))
  const positiveFrets = numericFrets.filter((value) => value > 0)
  const minFret = positiveFrets.length > 0 ? Math.min(...positiveFrets) : 1
  const startFret = minFret > 1 ? minFret : 1
  const fretCount = 5

  const markers = fingering
    .map((value, index) => {
      const stringLeft = originLeft + index * stringSpacing
      if (value.toLowerCase() === 'x') {
        return `<div style="position:absolute;left:${stringLeft - 4}px;top:0;font-size:10px;color:#d7dbe3;">x</div>`
      }
      const fret = Number(value)
      if (!Number.isFinite(fret)) return ''
      if (fret === 0) {
        return `<div style="position:absolute;left:${stringLeft - 3}px;top:0;font-size:10px;color:#9ecbff;">o</div>`
      }
      const top = originTop + 2 + (fret - startFret) * fretSpacing + fretSpacing / 2
      return `<div style="position:absolute;left:${stringLeft - 4}px;top:${top - 4}px;width:8px;height:8px;border-radius:999px;background:#8ab4ff;box-shadow:0 0 0 1px rgba(255,255,255,0.24);"></div>`
    })
    .join('')

  const verticals = Array.from({ length: 6 }, (_, index) => {
    const left = originLeft + index * stringSpacing
    return `<div style="position:absolute;left:${left}px;top:${originTop}px;width:1px;height:${fretCount * fretSpacing}px;background:#8d96a3;"></div>`
  }).join('')

  const horizontals = Array.from({ length: fretCount + 1 }, (_, index) => {
    const top = originTop + index * fretSpacing
    const thickness = index === 0 && startFret === 1 ? 3 : 1
    const color = index === 0 && startFret === 1 ? '#dfe5ee' : '#8d96a3'
    return `<div style="position:absolute;left:${originLeft}px;top:${top}px;width:${5 * stringSpacing}px;height:${thickness}px;background:${color};"></div>`
  }).join('')

  const fretLabel = startFret > 1 ? `Fret ${startFret}` : 'Open'

  return `
    <div style="background:#2a2f38;border:1px solid #4f5866;border-radius:8px;padding:0.18rem 0.6rem 0.22rem 0.32rem;display:inline-block;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;margin-bottom:0.08rem;">
        <div style="font-weight:700;font-size:0.9rem;color:#f3f5f7;line-height:1.1;">${escapeHtml(chord)}</div>
        <div style="font-size:11px;color:#d7dbe3;line-height:1;">${escapeHtml(fretLabel)}</div>
      </div>
      <div style="position:relative;width:88px;height:92px;">
        ${verticals}
        ${horizontals}
        ${markers}
      </div>
    </div>
  `
}

function renderChordLine(line: ChordLine, chordDefinitions: Record<string, string>, transpose: number): string {
  let html = ''
  let cursor = 0

  for (let index = 0; index < line.chords.length; index += 1) {
    const sourceChord = line.chords[index] ?? ''
    const chord = transposeChordSymbol(sourceChord, transpose)
    const position = line.positions[index] ?? cursor
    const padding = Math.max(0, position - cursor)
    const definition = getResolvedChordDefinition(chord, chordDefinitions)
    const tooltip = definition ? `${chord}: ${definition}` : `${chord}: No chord definition available`

    html += escapeHtml(' '.repeat(padding))
    html += `<span class="chord-token" title="${escapeHtml(tooltip)}" data-chord="${escapeHtml(chord)}" data-definition="${escapeHtml(definition ?? '')}">${escapeHtml(chord)}</span>`
    cursor = position + chord.length
  }

  return `<pre class="chord-line">${html}</pre>`
}

function renderLine(line: SongLine, chordDefinitions: Record<string, string>, showComments: boolean, transpose: number): string {
  switch (line.type) {
    case 'comment':
      if (!showComments) return ''
      return `<div class="comment${line.format === 'italic' ? ' comment-italic' : line.format === 'box' ? ' comment-box' : ''}">${escapeHtml(line.content)}</div>`
    case 'highlight':
      return `<div class="highlight">${escapeHtml(line.content)}</div>`
    case 'image':
      return `<div class="image"><img src="${escapeHtml(line.src)}" style="max-width: ${escapeHtml(line.scale ?? '100%')};" alt="ChordPro image" /></div>`
    case 'lyricLine':
      return `<pre class="lyric-line-only">${escapeHtml(line.content)}</pre>`
    case 'chorusRef':
      return `<div class="chorus-ref">Chorus${line.label ? `: ${escapeHtml(line.label)}` : ''}</div>`
    case 'chord':
      const transposedName = transposeChordSymbol(line.name, transpose)
      return `<div class="chord-diagram"><div class="chord-name">${escapeHtml(transposedName)}</div>${getResolvedChordDefinition(transposedName, chordDefinitions) ? `<pre class="chord-definition">${escapeHtml(getResolvedChordDefinition(transposedName, chordDefinitions) as string)}</pre>` : ''}</div>`
    case 'pageBreak':
      return '<div class="page-break"></div>'
    case 'physicalPageBreak':
      return '<div class="physical-page-break"></div>'
    case 'columnBreak':
      return '<div class="column-break"></div>'
    case 'empty':
      return '<div class="empty-line"></div>'
    case 'chordLine':
      return `${renderChordLine(line, chordDefinitions, transpose)}<pre class="lyric-line">${escapeHtml(line.lyrics)}</pre>`
    default:
      return ''
  }
}

function renderSection(section: SongSection, chordDefinitions: Record<string, string>, showComments: boolean, transpose: number): string {
  const className = ['section', section.type || 'verse'].join(' ')
  const label = section.label ? `<div class="section-label">${escapeHtml(section.label)}</div>` : ''

  if (section.content) {
    const contentClass = `${section.type}-content`
    return `<div class="${className}">${label}<pre class="${contentClass}">${escapeHtml(section.content)}</pre></div>`
  }

  const lines = section.lines
    .map((line) => renderLine(line, chordDefinitions, showComments, transpose))
    .join('')

  return `<div class="${className}">${label}${lines}</div>`
}

function renderSong(content: string, settings: LSPluginBaseInfo['settings'], transpose = 0): string {
  const source = sanitizeChordPro(content)

  if (!source) {
    return '<div class="chordpro-plugin">Empty ChordPro block.</div>'
  }

  const engine = (createChordproJS as unknown as () => { parse: (value: string) => SongDocument })()
  const song = engine.parse(source)
  const chordDefinitions = song.metadata?.chords ?? {}
  const header = [
    song.title ? `<h1>${escapeHtml(song.title)}</h1>` : '',
    song.subtitle ? `<h2>${escapeHtml(song.subtitle)}</h2>` : '',
    song.artist ? `<div class="artist">${escapeHtml(song.artist)}</div>` : '',
    song.key ? `<div class="key">Key: ${escapeHtml(transposeChordSymbol(song.key, transpose))}</div>` : '',
  ].join('')
  const controls = `
    <div class="chordpro-toolbar" style="display:flex;justify-content:flex-end;gap:0.4rem;margin-bottom:0.6rem;">
      <button class="chordpro-transpose" data-step="-1" style="background:var(--ls-secondary-background-color);border:1px solid var(--ls-border-color);border-radius:6px;color:var(--ls-primary-text-color);cursor:pointer;font-weight:700;padding:0.15rem 0.55rem;">-</button>
      <div style="align-self:center;color:var(--ls-gray-text-color);font-size:0.85rem;min-width:4.5rem;text-align:center;">${transpose > 0 ? `+${transpose}` : transpose}</div>
      <button class="chordpro-transpose" data-step="1" style="background:var(--ls-secondary-background-color);border:1px solid var(--ls-border-color);border-radius:6px;color:var(--ls-primary-text-color);cursor:pointer;font-weight:700;padding:0.15rem 0.55rem;">+</button>
    </div>
  `
  const body = song.sections
    .map((section) => renderSection(section, chordDefinitions, settings.showComments !== false, transpose))
    .join('')

  return `<div class="chordpro-plugin">${controls}${header}${body}</div>`
}

function cleanupLegacyUIArtifacts(): void {
  const host = (logseq as any).Experiments?.ensureHostScope?.()
  const hostDocument = host?.document as Document | undefined
  hostDocument?.getElementById('chordpro-global-tooltip')?.remove()
  hostDocument?.getElementById('chordpro-sidebar-panel')?.remove()
}

function compactFingering(definition: string): string {
  return extractFingering(definition)?.join('') ?? ''
}

function buildMasterChordBlockContent(chord: string, definition: string): string {
  const fingering = extractFingering(definition)?.join(' ') || ''
  const compact = compactFingering(definition)
  const source = definition.includes('Built-in chord library') ? 'built-in' : 'song definition'
  const macro = compact ? `{{renderer ${CHORD_MACRO_NAME}, ${chord}, ${compact}}}` : ''

  return [
    macro,
    `chord:: ${chord}`,
    fingering ? `fingering:: ${fingering}` : '',
    `source:: ${source}`,
  ]
    .filter(Boolean)
    .join('\n')
}

async function ensureMasterChordBlock(chord: string, definition: string): Promise<string | null> {
  await logseq.Editor.createPage?.(MASTER_CHORDLIST_PAGE, {}, { redirect: false })
  const expectedContent = buildMasterChordBlockContent(chord, definition)
  const chordProperty = `chord:: ${chord}`
  const query =
    '[:find (pull ?b [*])\n' +
    ' :where\n' +
    ' [?p :block/name ?page-name]\n' +
    ` [(= ?page-name "${MASTER_CHORDLIST_PAGE.toLowerCase().replace(/"/g, '\\"')}")]\n` +
    ' [?b :block/page ?p]\n' +
    ' [?b :block/content ?c]\n' +
    ` [(clojure.string/includes? ?c "${chordProperty.replace(/"/g, '\\"')}")]]`

  const queryResults = await logseq.DB.datascriptQuery(query)
  const matches = (queryResults ?? [])
    .map((row: any) => (Array.isArray(row) ? row[0] : row))
    .filter((block: LegacyBlock | null | undefined) => Boolean(block?.uuid))
  const existing = matches[0]

  if (existing?.uuid) {
    if (typeof existing.content === 'string' && existing.content !== expectedContent) {
      await logseq.Editor.updateBlock(existing.uuid, expectedContent)
    }

    for (const duplicate of matches.slice(1)) {
      if (duplicate.uuid) {
        await logseq.Editor.removeBlock(duplicate.uuid)
      }
    }

    return existing.uuid
  }

  const inserted = await logseq.Editor.appendBlockInPage?.(MASTER_CHORDLIST_PAGE, expectedContent)
  return inserted?.uuid ?? null
}

async function openChordInNativeSidebar(chord: string, definition: string): Promise<void> {
  const blockUuid = await ensureMasterChordBlock(chord, definition)
  if (blockUuid) {
    logseq.Editor.openInRightSidebar?.(blockUuid)
    window.setTimeout(() => {
      void logseq.Editor.exitEditingMode?.(false)
    }, 50)
  }
}

function todayJournalName(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isChordproPage(page: PageLike | null | undefined): boolean {
  const props = page?.properties ?? {}
  const pageType = String(props['page-type'] ?? props.pageType ?? props.type ?? '').toLowerCase()
  return pageType === 'chordpro'
}

async function ensurePlayedLogForCurrentPage(): Promise<void> {
  const page = (await logseq.Editor.getCurrentPage?.()) as PageLike | null | undefined
  if (!page?.name || !isChordproPage(page)) return

  const pageBlocks = (await logseq.Editor.getPageBlocksTree?.(page.name)) as LegacyBlock[] | null | undefined
  const blocks = pageBlocks ?? []
  const playedBlock =
    blocks.find((block) => typeof block.content === 'string' && block.content.trim().toLowerCase() === PLAYED_BLOCK_LABEL) ??
    (await logseq.Editor.appendBlockInPage?.(page.name, PLAYED_BLOCK_LABEL))

  if (!playedBlock?.uuid) return

  const journalLink = `[[${todayJournalName()}]]`
  const playedWithChildren = (await logseq.Editor.getBlock?.(playedBlock.uuid, { includeChildren: true })) as LegacyBlock | null | undefined
  const childExists = (playedWithChildren?.children ?? []).some(
    (child) => typeof child.content === 'string' && child.content.includes(journalLink)
  )

  if (!childExists) {
    await logseq.Editor.insertBlock?.(playedBlock.uuid, journalLink, { sibling: false })
  }
}

function registerChordMacroRenderer(): void {
  if (typeof logseq.App?.onMacroRendererSlotted !== 'function' || typeof logseq.provideUI !== 'function') {
    return
  }

  logseq.App.onMacroRendererSlotted(({ slot, payload }: any) => {
    const args = Array.isArray(payload?.arguments) ? payload.arguments : []
    if (args[0] !== CHORD_MACRO_NAME) return

    const chord = String(args[1] ?? '')
    const compact = String(args[2] ?? '')
    const fingering = compact ? compact.split('').slice(0, 6) : null

    logseq.provideUI({
      key: `chord-macro-${slot}`,
      slot,
      reset: true,
      template: renderChordDiagramFromFingering(chord, fingering),
    })
  })
}

function attachChordTooltips(root: HTMLElement): void {
  const clickTooltip = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    const token = event.currentTarget as HTMLElement | null
    const chord = token?.dataset.chord ?? ''
    const definition = token?.dataset.definition ?? ''
    if (!token || !chord) return
    void openChordInNativeSidebar(chord, definition || 'No chord definition available')
  }

  root.querySelectorAll('.chord-token').forEach((element) => {
    const token = element as HTMLElement
    token.onclick = clickTooltip
  })
}

function attachTransposeControls(root: HTMLElement, content: string, settings: LSPluginBaseInfo['settings']): void {
  let transpose = Number(root.dataset.transpose ?? '0')

  root.querySelectorAll('.chordpro-transpose').forEach((element) => {
    const button = element as HTMLButtonElement
    button.onclick = (event) => {
      event.preventDefault()
      event.stopPropagation()
      const step = Number(button.dataset.step ?? '0')
      transpose += step
      root.dataset.transpose = String(transpose)
      root.innerHTML = renderSong(content, settings, transpose)
      attachTransposeControls(root, content, settings)
      attachChordTooltips(root)
    }
  })
}

function createFencedChordRenderer(settings: LSPluginBaseInfo['settings']) {
  const React = (logseq as any).Experiments?.React

  return function FencedChordRenderer(props: { content: string }) {
    const ref = React.useRef<HTMLDivElement | null>(null)

    React.useEffect(() => {
      if (!ref.current) return

      try {
        ref.current.innerHTML = renderSong(props.content, settings, 0)
        ref.current.dataset.transpose = '0'
        attachTransposeControls(ref.current, props.content, settings)
        attachChordTooltips(ref.current)
      } catch (error) {
        console.error('[ChordPro] fenced render failed', error)
        ref.current.innerHTML = `<pre class="chordpro-plugin">${escapeHtml(props.content)}</pre>`
      }
    }, [props.content])

    return React.createElement('div', { ref })
  }
}

function registerFencedRenderers(settings: LSPluginBaseInfo['settings']): void {
  const experiments = (logseq as any).Experiments
  if (!experiments?.registerFencedCodeRenderer || !experiments?.React) {
    console.debug(DEBUG_PREFIX, 'fenced code renderer API unavailable')
    return
  }

  const renderer = createFencedChordRenderer(settings)

  experiments.registerFencedCodeRenderer('chordpro', {
    edit: false,
    render: renderer,
  })

  experiments.registerFencedCodeRenderer('chords', {
    edit: false,
    render: renderer,
  })

  console.debug(DEBUG_PREFIX, 'registered fenced renderers')
}

function getBlockContentElement(uuid: string): HTMLElement | null {
  if (typeof document === 'undefined') return null
  const direct = document.getElementById(`block-content-${uuid}`)
  if (direct) return direct as HTMLElement

  const exact = document.querySelector(
    `.ls-block[data-uuid="${uuid}"], [data-uuid="${uuid}"], [blockid="${uuid}"], [id="ls-block-${uuid}"]`
  ) as HTMLElement | null
  if (exact) {
    return (exact.querySelector('.block-content') as HTMLElement | null) ?? exact
  }

  const loose = document.querySelector(
    `[id*="${uuid}"], [data-uuid*="${uuid}"], [blockid*="${uuid}"]`
  ) as HTMLElement | null
  if (!loose) return null

  return (loose.closest('.ls-block')?.querySelector('.block-content') as HTMLElement | null) ?? loose
}

function normalizeContentForMatch(content: string): string {
  return content.replace(/\s+/g, ' ').trim()
}

function getPagePreviewHost(): HTMLElement | null {
  if (typeof document === 'undefined') return null

  const selectors = [
    '.page .blocks-container',
    '.page .block-children-container',
    '.cp__page .blocks-container',
    '.cp__page .page-blocks-inner',
    '.cp__page .custom-query',
    '.cp__page'
  ]

  for (const selector of selectors) {
    const match = document.querySelector(selector) as HTMLElement | null
    if (match) return match
  }

  return document.body
}

function findBlockElementByContent(block: LegacyBlock): HTMLElement | null {
  if (typeof document === 'undefined' || typeof block.content !== 'string') return null

  const target = normalizeContentForMatch(block.content).slice(0, 160)
  if (!target) return null

  const candidates = Array.from(document.querySelectorAll('.ls-block, .block-content, .editor-inner')) as HTMLElement[]
  for (const candidate of candidates) {
    const text = normalizeContentForMatch(candidate.innerText || candidate.textContent || '')
    if (text && text.includes(target)) {
      return (candidate.querySelector('.block-content') as HTMLElement | null) ?? candidate
    }
  }

  return null
}

function removeMountedPreview(uuid: string): void {
  const element = getBlockContentElement(uuid)
  const preview = element?.querySelector(`:scope > .${PREVIEW_CLASS}`)
  preview?.remove()
}

function mountBlockPreview(block: LegacyBlock, settings: LSPluginBaseInfo['settings']): void {
  if (!block.uuid) return

  const content = typeof block.content === 'string' ? block.content : ''
  const shouldRender = isLegacyChordProBlock(content) || isFencedChordProBlock(content)

  if (!shouldRender) {
    removeMountedPreview(block.uuid)
    return
  }

  const element = getBlockContentElement(block.uuid)
  const fallbackElement = element ?? findBlockElementByContent(block)
  const mountTarget = fallbackElement ?? getPagePreviewHost()
  if (!mountTarget) {
    console.debug(DEBUG_PREFIX, 'no block content element found', block.uuid)
    return
  }

  const previewClass = fallbackElement ? PREVIEW_CLASS : PAGE_PREVIEW_CLASS
  let preview = mountTarget.querySelector(`:scope > .${previewClass}`) as HTMLElement | null
  if (!preview) {
    preview = document.createElement('div')
    preview.className = previewClass
    mountTarget.prepend(preview)
    console.debug(DEBUG_PREFIX, fallbackElement ? 'mounted preview container' : 'mounted page fallback preview', block.uuid)
  }

  preview.innerHTML = renderSong(content, settings)
  console.debug(DEBUG_PREFIX, 'rendered block', block.uuid, content.slice(0, 40).replace(/\n/g, '\\n'))
}

function flattenBlocks(blocks: LegacyBlock[]): LegacyBlock[] {
  const flat: LegacyBlock[] = []

  for (const block of blocks) {
    flat.push(block)
    if (Array.isArray(block.children) && block.children.length > 0) {
      flat.push(...flattenBlocks(block.children))
    }
  }

  return flat
}

async function renderCurrentPageBlocks(settings: LSPluginBaseInfo['settings']): Promise<void> {
  const pageBlocks = (await logseq.Editor.getCurrentPageBlocksTree?.()) as LegacyBlock[] | null | undefined
  const blocks = flattenBlocks(pageBlocks ?? [])
  const targets = blocks.filter((block) => {
    const content = typeof block.content === 'string' ? block.content : ''
    return isLegacyChordProBlock(content)
  })

  console.debug(DEBUG_PREFIX, 'current page block count', blocks.length)
  console.debug(DEBUG_PREFIX, 'render target count', targets.length)

  for (const block of targets) {
    mountBlockPreview(block, settings)
  }
}

let renderTimer: number | null = null

function queueBlockPreviewRender(settings: LSPluginBaseInfo['settings']): void {
  if (renderTimer !== null) {
    window.clearTimeout(renderTimer)
  }

  renderTimer = window.setTimeout(() => {
    renderTimer = null
    void renderCurrentPageBlocks(settings)
  }, 150)
}

function registerLegacyBlockRenderer(settings: LSPluginBaseInfo['settings']): void {
  queueBlockPreviewRender(settings)
  void ensurePlayedLogForCurrentPage()

  logseq.DB.onChanged(({ blocks }: { blocks?: LegacyBlock[] }) => {
    const changedChordproBlock = (blocks ?? []).some((block) => {
      const content = typeof block?.content === 'string' ? block.content : ''
      return isLegacyChordProBlock(content)
    })

    if (changedChordproBlock) {
      queueBlockPreviewRender(settings)
    }
  })

  logseq.App.onRouteChanged(() => {
    queueBlockPreviewRender(settings)
    void ensurePlayedLogForCurrentPage()
  })
}

function main(baseInfo: LSPluginBaseInfo): void {
  cleanupLegacyUIArtifacts()
  logseq.provideStyle(styles)
  console.debug(DEBUG_PREFIX, 'plugin ready')
  registerChordMacroRenderer()
  registerFencedRenderers(baseInfo.settings)
  registerLegacyBlockRenderer(baseInfo.settings)
  logseq.hideMainUI({ restoreEditingCursor: false })
}

logseq.useSettingsSchema(settingsSchema).ready(main).catch(console.error)
