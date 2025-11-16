import dayjs from 'dayjs'

/**
 * Generate study sessions between now and each test date that fit availability.
 * availability: { [weekdayNumber]: [ [startMin, endMin], ... ] }
 * tests: [ { id, subjectId, subjectName, testDateIso, targetHours } ]
 * sessionLenMin: number, default 60
 */
export function generateSchedule({ availability, tests, sessionLenMin = 60 }) {
  const sessions = []
  const now = dayjs()

  const sorted = [...tests].sort((a, b) => dayjs(a.testDateIso).valueOf() - dayjs(b.testDateIso).valueOf())

  for (const t of sorted) {
    const end = dayjs(t.testDateIso).endOf('day')
    let remainingMin = Math.max(0, Math.round((t.targetHours || 0) * 60))
    if (remainingMin === 0) continue

    let cursor = now.startOf('day')
    while (cursor.isBefore(end) && remainingMin > 0) {
      const dow = cursor.day()
      const windows = availability[dow] || []
      for (const [startMin, endMin] of windows) {
        let slotStart = cursor.add(startMin, 'minute')
        const windowEnd = cursor.add(endMin, 'minute')
        while (slotStart.add(sessionLenMin, 'minute').isSameOrBefore(windowEnd) && remainingMin > 0) {
          sessions.push({
            id: `${t.id}-${slotStart.valueOf()}`,
            subjectId: t.subjectId,
            subjectName: t.subjectName,
            testId: t.id,
            startIso: slotStart.toISOString(),
            endIso: slotStart.add(sessionLenMin, 'minute').toISOString(),
            minutes: sessionLenMin,
          })
          remainingMin -= sessionLenMin
          slotStart = slotStart.add(sessionLenMin, 'minute')
        }
        if (remainingMin <= 0) break
      }
      cursor = cursor.add(1, 'day')
    }
  }
  return sessions
}
