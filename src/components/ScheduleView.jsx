import dayjs from 'dayjs'

export default function ScheduleView({ sessions }) {
  if (!sessions.length) return <div className="card">No sessions yet. Add tests and generate.</div>
  return (
    <div className="card">
      <div className="text-lg font-semibold mb-2">Upcoming study sessions</div>
      <div className="divide-y">
        {sessions.map(s => (
          <div key={s.id} className="py-2 flex items-center justify-between">
            <div>
              <div className="font-medium">{s.subjectName}</div>
              <div className="text-sm text-gray-600">{dayjs(s.startIso).format('ddd MMM D, HH:mm')} to {dayjs(s.endIso).format('HH:mm')}</div>
            </div>
            <div className="text-sm text-gray-600">{s.minutes} min</div>
          </div>
        ))}
      </div>
    </div>
  )
}
