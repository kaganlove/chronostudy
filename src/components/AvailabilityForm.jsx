import { useApp } from '../store'

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function minutesToHHMM(m) {
  const h = String(Math.floor(m/60)).padStart(2,'0')
  const min = String(m%60).padStart(2,'0')
  return `${h}:${min}`
}
function hhmmToMinutes(hhmm) {
  const [h,m] = hhmm.split(':').map(Number)
  return h*60 + m
}

export default function AvailabilityForm() {
  const availability = useApp(s => s.availability)
  const setAvailability = useApp(s => s.setAvailability)

  const update = (dIndex, idx, field, value) => {
    const windows = availability[dIndex] ? [...availability[dIndex]] : []
    const cur = windows[idx] || [18*60, 21*60]
    const next = field === 'start' ? [hhmmToMinutes(value), cur[1]] : [cur[0], hhmmToMinutes(value)]
    windows[idx] = next
    setAvailability({ ...availability, [dIndex]: windows })
  }

  const addWindow = (dIndex) => {
    const windows = availability[dIndex] ? [...availability[dIndex]] : []
    windows.push([18*60, 19*60])
    setAvailability({ ...availability, [dIndex]: windows })
  }

  const removeWindow = (dIndex, idx) => {
    const windows = availability[dIndex] ? [...availability[dIndex]] : []
    windows.splice(idx,1)
    setAvailability({ ...availability, [dIndex]: windows })
  }

  return (
    <div className="card space-y-3">
      <div className="text-lg font-semibold">Weekly availability</div>
      {DAYS.map((dLabel, dIndex) => (
        <div key={dLabel} className="space-y-2">
          <div className="font-medium">{dLabel}</div>
          <div className="space-y-2">
            {(availability[dIndex] || []).map((win, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input className="input max-w-32" type="time" value={minutesToHHMM(win[0])} onChange={e => update(dIndex, idx, 'start', e.target.value)} />
                <span>to</span>
                <input className="input max-w-32" type="time" value={minutesToHHMM(win[1])} onChange={e => update(dIndex, idx, 'end', e.target.value)} />
                <button type="button" className="btn-ghost" onClick={() => removeWindow(dIndex, idx)}>Remove</button>
              </div>
            ))}
            <button type="button" className="btn-ghost" onClick={() => addWindow(dIndex)}>Add window</button>
          </div>
        </div>
      ))}
    </div>
  )
}
