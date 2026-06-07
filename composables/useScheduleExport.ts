// ── Shared types ────────────────────────────────────────────────────────────

export interface ExportEntry {
  sectionId: string
  subjectId: number | null
  subjectName: string | null
  subjectColor: string | null
  teacherId: string | null
  teacherName: string | null
  dayOfWeek: number
  slotStartTime: string
  slotEndTime: string
  specialLabel: string | null
}

export interface ExportSection {
  id: string
  name: string
  yearLevelName?: string | null
}

export interface MasterExportParams {
  schoolName: string
  yearLabel: string
  scheduleSetName: string
  sections: ExportSection[]
  entries: ExportEntry[]
}

export interface SectionExportParams {
  schoolName: string
  yearLabel: string
  sectionName: string
  entries: ExportEntry[]
}

export interface TeacherTeachingEntry {
  dayOfWeek: number
  slotStartTime: string
  slotEndTime: string
  subjectName: string | null
  subjectColor: string | null
  sectionName: string | null
}

export interface TeacherSpecialSlot {
  dayOfWeek: number
  slotStartTime: string
  slotEndTime: string
  specialLabel: string | null
}

export interface TeacherExportParams {
  schoolName: string
  yearLabel: string
  teacherName: string
  teachingEntries: TeacherTeachingEntry[]
  specialSlots: TeacherSpecialSlot[]
  allSlotTimes: Array<{ slotStartTime: string; slotEndTime: string }>
}

// ── Helpers ──────────────────────────────────────────────────────────────────

type Slot = { start: string; end: string }

function fmtTime(t: string): string {
  const parts = t.split(':')
  const h = parseInt(parts[0] ?? '0', 10)
  const m = parseInt(parts[1] ?? '0', 10)
  if (isNaN(h) || isNaN(m)) return t
  const ampm = h < 12 ? 'AM' : 'PM'
  const hh   = h % 12 || 12
  return m === 0 ? `${hh}${ampm}` : `${hh}:${String(m).padStart(2, '0')}${ampm}`
}

function fmtRange(start: string, end: string): string {
  return `${fmtTime(start)}&ndash;${fmtTime(end)}`
}

function shortName(name: string | null | undefined): string {
  if (!name) return ''
  const s = name.trim()
  if (s.includes(',')) return s.split(',')[0]!.trim()
  const parts = s.split(' ')
  return parts[parts.length - 1] ?? s
}

function esc(s: string | null | undefined): string {
  if (!s) return ''
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function tint(hex: string, amount = 0.80): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return '#F0F0F0'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const tr = Math.round(r + (255 - r) * amount)
  const tg = Math.round(g + (255 - g) * amount)
  const tb = Math.round(b + (255 - b) * amount)
  return `#${tr.toString(16).padStart(2, '0')}${tg.toString(16).padStart(2, '0')}${tb.toString(16).padStart(2, '0')}`
}

function specialStyle(label: string): { bg: string; color: string } {
  if (/health|recess/i.test(label)) return { bg: '#d4edda', color: '#155724' }
  if (/lunch|noon/i.test(label))    return { bg: '#fff3cd', color: '#856404' }
  if (/lac|ancillary/i.test(label)) return { bg: '#ede0f7', color: '#5a0b8c' }
  if (/flag/i.test(label))          return { bg: '#d6deff', color: '#1a2a80' }
  return                                    { bg: '#dbeafe', color: '#1e3a8a' }
}

const DAYS_FULL  = [
  { num: 1, label: 'Monday' },
  { num: 2, label: 'Tuesday' },
  { num: 3, label: 'Wednesday' },
  { num: 4, label: 'Thursday' },
  { num: 5, label: 'Friday' },
]

const DAYS_SHORT = [
  { num: 1, label: 'M' },
  { num: 2, label: 'T' },
  { num: 3, label: 'W' },
  { num: 4, label: 'Th' },
  { num: 5, label: 'F' },
]

// ── Word HTML wrapper ─────────────────────────────────────────────────────────

function wrapInWordDoc(body: string, title: string): string {
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <title>${esc(title)}</title>
  <!--[if gte mso 9]><xml>
    <w:WordDocument>
      <w:View>Normal</w:View>
      <w:Zoom>75</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml><![endif]-->
  <style>
    @page WordSection {
      size: 420mm 297mm;
      mso-page-orientation: landscape;
      margin: 10mm 10mm 12mm 10mm;
    }
    div.WordSection { page: WordSection; }
    .pb { page-break-before: always; mso-page-break-alt: always; }

    body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #111111; }

    h1  { font-size: 13pt; font-weight: 900; text-align: center; margin: 0 0 2pt; text-transform: uppercase; letter-spacing: 0.06em; }
    h2  { font-size: 10pt; font-weight: 700; text-align: center; margin: 0 0 1pt; text-transform: uppercase; }
    .ds { font-size: 8pt; text-align: center; color: #666666; margin: 0 0 8pt; }

    table { border-collapse: collapse; width: 100%; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }

    th, td {
      border: 0.75pt solid #AAAAAA;
      padding: 2.5pt 3pt;
      vertical-align: middle;
      text-align: center;
      font-size: 8pt;
    }
    th {
      background-color: #E0E0E0;
      font-weight: 700;
      font-size: 7pt;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .ct { background-color: #F5F5F5; font-weight: 700; font-size: 7pt; white-space: nowrap; width: 52pt; }
    .cd { background-color: #F0F0F0; font-weight: 800; font-size: 8.5pt; width: 14pt; }
    .cv { background-color: #FAFAFA; text-align: left; font-size: 6.5pt; color: #444444; width: 60pt; }

    .dm { color: #B71C1C; }
    .rt { border-top: 1.5pt solid #888888 !important; }

    .sn { font-weight: 700; font-size: 7.5pt; }
    .st { font-size: 6pt; color: #555555; }
    .da { color: #CCCCCC; font-size: 7pt; }
  </style>
</head>
<body>
  <div class="WordSection">
${body}
  </div>
</body>
</html>`
}

function downloadDoc(html: string, filename: string, title: string): void {
  const full      = wrapInWordDoc(html, title)
  const sanitized = filename.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') || 'schedule'
  const content   = '﻿' + full  // UTF-8 BOM inline
  const a         = document.createElement('a')
  a.style.display = 'none'
  a.download      = `${sanitized}.doc`

  let cleanup = () => {}
  try {
    // Prefer blob URL; use octet-stream so Chrome doesn't invoke filesystem policy
    const blob = new Blob([content], { type: 'application/octet-stream' })
    const url  = URL.createObjectURL(blob)
    a.href     = url
    cleanup    = () => URL.revokeObjectURL(url)
  } catch {
    // Fallback: data URI (works even when blob: URLs are blocked)
    a.href = 'data:application/octet-stream;charset=utf-8,' + encodeURIComponent(content)
  }

  document.body.appendChild(a)
  a.click()
  setTimeout(() => { document.body.removeChild(a); cleanup() }, 300)
}

// ── Data helpers ──────────────────────────────────────────────────────────────

function collectSlots(entries: Array<{ slotStartTime: string; slotEndTime: string }>): Slot[] {
  const map = new Map<string, Slot>()
  for (const e of entries) {
    if (!map.has(e.slotStartTime)) map.set(e.slotStartTime, { start: e.slotStartTime, end: e.slotEndTime })
  }
  return [...map.values()].sort((a, b) => a.start.localeCompare(b.start))
}

// ── Section page builder ──────────────────────────────────────────────────────

/**
 * Builds one TIME × Mon–Fri table for a single section.
 * entries = all entries for that section (subjects + specials/breaks).
 * slots   = sorted list of all unique slot times used in this schedule.
 */
function buildSectionTable(
  sectionName: string,
  subHeading: string,
  entries: ExportEntry[],
  slots: Slot[],
): string {
  const em = new Map<string, ExportEntry>()
  for (const e of entries) {
    const k = `${e.dayOfWeek}|${e.slotStartTime}`
    if (!em.has(k)) em.set(k, e)
  }

  let rows = ''
  for (const slot of slots) {
    // Uniform-special check: same specialLabel on ALL 5 days?
    let uLabel: string | null = null
    let isUniform = true
    for (const d of [1, 2, 3, 4, 5]) {
      const e = em.get(`${d}|${slot.start}`)
      if (!e?.specialLabel) { isUniform = false; break }
      if (!uLabel) uLabel = e.specialLabel
      else if (e.specialLabel !== uLabel) { isUniform = false; break }
    }

    if (isUniform && uLabel) {
      const { bg, color } = specialStyle(uLabel)
      const cs = `background-color:${bg};color:${color};font-style:italic;font-weight:600;`
      rows += `<tr>
        <td class="ct" bgcolor="${bg}" style="${cs}">${fmtRange(slot.start, slot.end)}</td>
        ${DAYS_FULL.map(() => `<td bgcolor="${bg}" style="${cs}">${esc(uLabel!)}</td>`).join('')}
      </tr>\n`
    } else {
      rows += `<tr>`
      rows += `<td class="ct">${fmtRange(slot.start, slot.end)}</td>`
      for (const day of DAYS_FULL) {
        const e = em.get(`${day.num}|${slot.start}`)
        if (!e) {
          rows += `<td><span class="da">&mdash;</span></td>`
        } else if (e.specialLabel) {
          const { bg, color } = specialStyle(e.specialLabel)
          rows += `<td bgcolor="${bg}" style="background-color:${bg};color:${color};font-style:italic;font-weight:600;">${esc(e.specialLabel)}</td>`
        } else if (e.subjectName) {
          const color = e.subjectColor ?? '#6366f1'
          const bg    = tint(color)
          rows += `<td bgcolor="${bg}" style="background-color:${bg};">`
          rows += `<span class="sn" style="color:${color};">${esc(e.subjectName)}</span><br>`
          rows += `<span class="st">${esc(e.teacherName ?? '')}</span>`
          rows += `</td>`
        } else {
          rows += `<td><span class="da">&mdash;</span></td>`
        }
      }
      rows += `</tr>\n`
    }
  }

  return `
    <h2>${esc(sectionName)}</h2>
    <p class="ds">${esc(subHeading)}</p>
    <table>
      <thead>
        <tr>
          <th class="ct">Time</th>
          ${DAYS_FULL.map(d => `<th>${d.label}</th>`).join('')}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`
}

// ── Teacher page builder ──────────────────────────────────────────────────────

interface NormTeachEntry {
  dayOfWeek: number
  slotStartTime: string
  slotEndTime: string
  subjectName: string | null
  subjectColor: string | null
  sectionLabel: string | null
}

function buildTeacherTable(
  teacherName: string,
  subHeading: string,
  teachEntries: NormTeachEntry[],
  specials: Map<string, string>,     // `day|slotStart` → label
  slots: Slot[],
): string {
  const tm = new Map<string, NormTeachEntry>()
  for (const e of teachEntries) tm.set(`${e.dayOfWeek}|${e.slotStartTime}`, e)

  const totalMin = teachEntries.reduce((s, e) => {
    const [sh = 0, sm = 0] = e.slotStartTime.split(':').map(Number)
    const [eh = 0, em = 0] = e.slotEndTime.split(':').map(Number)
    return s + (eh * 60 + em) - (sh * 60 + sm)
  }, 0)
  const totalHrs = (totalMin / 60).toFixed(1).replace(/\.0$/, '')

  let rows = ''
  for (const slot of slots) {
    let uLabel: string | null = null
    let isUniform = true
    for (const d of [1, 2, 3, 4, 5]) {
      const sp = specials.get(`${d}|${slot.start}`)
      if (!sp) { isUniform = false; break }
      if (!uLabel) uLabel = sp
      else if (sp !== uLabel) { isUniform = false; break }
    }

    if (isUniform && uLabel) {
      const { bg, color } = specialStyle(uLabel)
      const cs = `background-color:${bg};color:${color};font-style:italic;font-weight:600;`
      rows += `<tr>
        <td class="ct" bgcolor="${bg}" style="${cs}">${fmtRange(slot.start, slot.end)}</td>
        ${DAYS_FULL.map(() => `<td bgcolor="${bg}" style="${cs}">${esc(uLabel!)}</td>`).join('')}
      </tr>\n`
    } else {
      rows += `<tr>`
      rows += `<td class="ct">${fmtRange(slot.start, slot.end)}</td>`
      for (const day of DAYS_FULL) {
        const e  = tm.get(`${day.num}|${slot.start}`)
        const sp = specials.get(`${day.num}|${slot.start}`)
        if (e?.subjectName) {
          const color = e.subjectColor ?? '#6366f1'
          const bg    = tint(color)
          rows += `<td bgcolor="${bg}" style="background-color:${bg};">`
          rows += `<span class="sn" style="color:${color};">${esc(e.subjectName)}</span><br>`
          rows += `<span class="st">${esc(e.sectionLabel ?? '')}</span>`
          rows += `</td>`
        } else if (sp) {
          const { bg, color } = specialStyle(sp)
          rows += `<td bgcolor="${bg}" style="background-color:${bg};color:${color};font-style:italic;font-weight:600;">${esc(sp)}</td>`
        } else {
          rows += `<td><span class="da">&mdash;</span></td>`
        }
      }
      rows += `</tr>\n`
    }
  }

  return `
    <h2>${esc(teacherName)}</h2>
    <p class="ds">${esc(subHeading)} &nbsp;&bull;&nbsp; Teaching hours/week: ${totalHrs}</p>
    <table>
      <thead>
        <tr>
          <th class="ct">Time</th>
          ${DAYS_FULL.map(d => `<th>${d.label}</th>`).join('')}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`
}

// ── Master table builder ──────────────────────────────────────────────────────

function buildMasterTableHtml(params: MasterExportParams): string {
  const { schoolName, yearLabel, scheduleSetName, sections, entries } = params

  // section|day|slot → entry
  const mm = new Map<string, ExportEntry>()
  for (const e of entries) {
    const k = `${e.sectionId}|${e.dayOfWeek}|${e.slotStartTime}`
    if (!mm.has(k)) mm.set(k, e)
  }

  const slots = collectSlots(entries)

  // All teachers that appear in subject entries (for vacant column)
  const allTeachers = new Map<string, string>()
  for (const e of entries) {
    if (e.teacherId && e.teacherName && !e.specialLabel) allTeachers.set(e.teacherId, e.teacherName)
  }

  function getVacant(slotStart: string, day: number): string[] {
    const busy = new Set<string>()
    for (const e of entries) {
      if (e.slotStartTime === slotStart && e.dayOfWeek === day && e.teacherId && !e.specialLabel) busy.add(e.teacherId)
    }
    return [...allTeachers.entries()]
      .filter(([id]) => !busy.has(id))
      .map(([, name]) => shortName(name))
      .sort()
  }

  // Uniform special: same label across ALL sections × ALL 5 days
  function uniformSpecial(slotStart: string): string | null {
    let label: string | null = null
    for (const d of [1, 2, 3, 4, 5]) {
      for (const sec of sections) {
        const e = mm.get(`${sec.id}|${d}|${slotStart}`)
        if (!e?.specialLabel) return null
        if (!label) label = e.specialLabel
        else if (e.specialLabel !== label) return null
      }
    }
    return label
  }

  const secHdrs = sections.map(s =>
    `<th title="${esc(s.yearLevelName ?? '')}" style="font-size:6.5pt;">${esc(s.name.replace('Grade ', 'G'))}</th>`
  ).join('')

  let rows = ''
  for (const slot of slots) {
    const ul  = uniformSpecial(slot.start)
    const rng = fmtRange(slot.start, slot.end)

    if (ul) {
      const { bg, color } = specialStyle(ul)
      const cs = `background-color:${bg};color:${color};font-style:italic;font-weight:600;`
      rows += `<tr class="rt">
        <td class="ct" bgcolor="${bg}" style="${cs}">${rng}</td>
        <td class="cd" bgcolor="${bg}" style="${cs}">M&ndash;F</td>
        ${sections.map(() => `<td bgcolor="${bg}" style="${cs}">${esc(ul)}</td>`).join('')}
        <td class="cv" bgcolor="${bg}" style="${cs}"></td>
      </tr>\n`
    } else {
      for (const day of DAYS_SHORT) {
        const isMon = day.num === 1
        const v     = getVacant(slot.start, day.num)
        rows += `<tr${isMon ? ' class="rt"' : ''}>`
        // TIME column: show on every row (no rowspan – Word can't handle it reliably)
        rows += `<td class="ct">${rng}</td>`
        rows += `<td class="cd${isMon ? ' dm' : ''}">${day.label}</td>`
        for (const sec of sections) {
          const e = mm.get(`${sec.id}|${day.num}|${slot.start}`)
          if (!e) {
            rows += `<td><span class="da">&mdash;</span></td>`
          } else if (e.specialLabel) {
            const { bg, color } = specialStyle(e.specialLabel)
            rows += `<td bgcolor="${bg}" style="background-color:${bg};color:${color};font-style:italic;font-weight:600;font-size:7pt;">${esc(e.specialLabel)}</td>`
          } else if (e.subjectName) {
            const color = e.subjectColor ?? '#6366f1'
            const bg    = tint(color)
            rows += `<td bgcolor="${bg}" style="background-color:${bg};">`
            rows += `<span class="sn" style="color:${color};font-size:7pt;">${esc(e.subjectName)}</span><br>`
            rows += `<span class="st">${esc(shortName(e.teacherName))}</span>`
            rows += `</td>`
          } else {
            rows += `<td><span class="da">&mdash;</span></td>`
          }
        }
        rows += `<td class="cv">${v.length ? v.map(n => esc(n)).join(', ') : '<span class="da">&mdash;</span>'}</td>`
        rows += `</tr>\n`
      }
    }
  }

  return `
    <h2>${esc(schoolName)}</h2>
    <h1>School Program</h1>
    <p class="ds">${esc(yearLabel)} &mdash; ${esc(scheduleSetName)}</p>
    <table>
      <thead>
        <tr>
          <th class="ct">Time</th>
          <th class="cd">Day</th>
          ${secHdrs}
          <th class="cv">Vacant Teachers</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`
}

// ── Multi-page builders (from master data) ────────────────────────────────────

function buildAllSectionPages(params: MasterExportParams): string {
  const { schoolName, yearLabel, scheduleSetName, sections, entries } = params
  const slots  = collectSlots(entries)
  const sub    = `${yearLabel} — ${scheduleSetName}`

  return sections.map((sec, i) => {
    const secEntries = entries.filter(e => e.sectionId === sec.id)
    const page       = buildSectionTable(sec.name, sub, secEntries, slots)
    return i === 0 ? page : `<div class="pb"></div>${page}`
  }).join('\n')
}

function buildAllTeacherPages(params: MasterExportParams): string {
  const { schoolName, yearLabel, scheduleSetName, sections, entries } = params
  const slots = collectSlots(entries)
  const sub   = `${yearLabel} — ${scheduleSetName}`

  // sectionId → name map
  const secNames = new Map(sections.map(s => [s.id, s.name]))

  // Specials map: day|slot → label (from any section)
  const specials = new Map<string, string>()
  for (const e of entries) {
    if (e.specialLabel) {
      const k = `${e.dayOfWeek}|${e.slotStartTime}`
      if (!specials.has(k)) specials.set(k, e.specialLabel)
    }
  }

  // Collect unique teachers (preserve order of first appearance)
  const teacherOrder: string[] = []
  const teacherNames = new Map<string, string>()
  for (const e of entries) {
    if (e.teacherId && e.teacherName && !e.specialLabel && !teacherNames.has(e.teacherId)) {
      teacherOrder.push(e.teacherId)
      teacherNames.set(e.teacherId, e.teacherName)
    }
  }
  // Sort alphabetically by name
  teacherOrder.sort((a, b) => (teacherNames.get(a) ?? '').localeCompare(teacherNames.get(b) ?? ''))

  return teacherOrder.map((tid, i) => {
    const name       = teacherNames.get(tid)!
    const normRows   = entries
      .filter(e => e.teacherId === tid && !e.specialLabel)
      .map(e => ({
        dayOfWeek:     e.dayOfWeek,
        slotStartTime: e.slotStartTime,
        slotEndTime:   e.slotEndTime,
        subjectName:   e.subjectName,
        subjectColor:  e.subjectColor,
        sectionLabel:  secNames.get(e.sectionId) ?? null,
      }))
    const page = buildTeacherTable(name, sub, normRows, specials, slots)
    return i === 0 ? page : `<div class="pb"></div>${page}`
  }).join('\n')
}

// ── Teaching load table builder ───────────────────────────────────────────────

export interface TeachingLoadSubject {
  subjectName: string
  subjectColor: string
  sectionNames: string[]
  minutesPerWeek: number
}

export interface TeachingLoadRow {
  teacherName: string
  subjects: TeachingLoadSubject[]
  totalMinutesPerWeek: number
}

export interface TeachingLoadExportParams {
  schoolName: string
  yearLabel: string
  scheduleSetName: string
  rows: TeachingLoadRow[]
}

function fmtHM(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function buildTeachingLoadTableHtml(params: TeachingLoadExportParams): string {
  const { schoolName, yearLabel, scheduleSetName, rows } = params

  let tbody = ''
  for (const row of rows) {
    const subjectCells = row.subjects.map(s => {
      const color = s.subjectColor || '#6366f1'
      const bg    = tint(color)
      const secs  = esc(s.sectionNames.join(', '))
      return `<span style="display:inline-block;background-color:${bg};color:${color};border-radius:3pt;padding:1.5pt 5pt;margin:1.5pt 2pt 1.5pt 0;font-size:6.5pt;font-weight:700;">${esc(s.subjectName)}</span>`
        + `<span style="font-size:6pt;color:#666666;"> ${secs}</span>`
    }).join('<br>')

    const dailyAvg = Math.round(row.totalMinutesPerWeek / 5)

    tbody += `<tr>
      <td style="text-align:left;font-weight:700;font-size:8pt;padding:3pt 5pt;white-space:nowrap;">${esc(row.teacherName)}</td>
      <td style="text-align:left;padding:3pt 5pt;">${subjectCells}</td>
      <td style="text-align:center;font-weight:700;">${fmtHM(row.totalMinutesPerWeek)}</td>
      <td style="text-align:center;color:#555555;">${fmtHM(dailyAvg)}</td>
    </tr>\n`
  }

  return `
    <h2>${esc(schoolName)}</h2>
    <h1>Teaching Load</h1>
    <p class="ds">${esc(yearLabel)} &mdash; ${esc(scheduleSetName)}</p>
    <table>
      <thead>
        <tr>
          <th style="text-align:left;width:18%;">Teacher</th>
          <th style="text-align:left;width:50%;">Subjects Assigned</th>
          <th style="width:16%;">Hours / Week</th>
          <th style="width:16%;">Daily Avg</th>
        </tr>
      </thead>
      <tbody>${tbody}</tbody>
    </table>`
}

// ── Public composable ─────────────────────────────────────────────────────────

export function useScheduleExport() {
  // ── Master / all-sections view exports ─────────────────────────────────────

  function exportMasterSchedule(params: MasterExportParams): void {
    const html = buildMasterTableHtml(params)
    downloadDoc(html, `schedule-${params.yearLabel}`, `School Program – ${params.yearLabel}`)
  }

  /** One page per section in a single .doc */
  function exportAllSectionsDoc(params: MasterExportParams): void {
    const html = buildAllSectionPages(params)
    downloadDoc(html, `all-sections-${params.yearLabel}`, `All Section Schedules – ${params.yearLabel}`)
  }

  /** One page per teacher in a single .doc */
  function exportAllTeachersDoc(params: MasterExportParams): void {
    const html = buildAllTeacherPages(params)
    downloadDoc(html, `all-teachers-${params.yearLabel}`, `All Teacher Schedules – ${params.yearLabel}`)
  }

  // ── Single-view exports (By Section / By Teacher tabs) ─────────────────────

  function exportSectionSchedule(params: SectionExportParams): void {
    const slots = collectSlots(params.entries)
    const sub   = `Weekly Schedule — ${params.yearLabel}`
    const html  = buildSectionTable(params.sectionName, sub, params.entries, slots)
    downloadDoc(html, `schedule-${params.sectionName}`, `${params.sectionName} – ${params.yearLabel}`)
  }

  function exportTeacherSchedule(params: TeacherExportParams): void {
    const slots = params.allSlotTimes.map(s => ({ start: s.slotStartTime, end: s.slotEndTime }))

    const specials = new Map<string, string>()
    for (const s of params.specialSlots) {
      const k = `${s.dayOfWeek}|${s.slotStartTime}`
      if (!specials.has(k) && s.specialLabel) specials.set(k, s.specialLabel)
    }

    const normRows: NormTeachEntry[] = params.teachingEntries.map(e => ({
      dayOfWeek:     e.dayOfWeek,
      slotStartTime: e.slotStartTime,
      slotEndTime:   e.slotEndTime,
      subjectName:   e.subjectName,
      subjectColor:  e.subjectColor,
      sectionLabel:  e.sectionName,
    }))

    const sub  = `Weekly Teaching Schedule — ${params.yearLabel}`
    const html = buildTeacherTable(params.teacherName, sub, normRows, specials, slots)
    downloadDoc(html, `schedule-${params.teacherName}`, `${params.teacherName} – ${params.yearLabel}`)
  }

  function exportTeachingLoad(params: TeachingLoadExportParams): void {
    const html = buildTeachingLoadTableHtml(params)
    downloadDoc(html, `teaching-load-${params.yearLabel}`, `Teaching Load – ${params.yearLabel}`)
  }

  return {
    exportMasterSchedule,
    exportAllSectionsDoc,
    exportAllTeachersDoc,
    exportSectionSchedule,
    exportTeacherSchedule,
    exportTeachingLoad,
  }
}
