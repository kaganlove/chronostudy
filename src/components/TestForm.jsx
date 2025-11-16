import { useForm } from 'react-hook-form'

export default function TestForm({ subjects, onAdd }) {
  const { register, handleSubmit, reset } = useForm()
  const onSubmit = (v) => {
    const subject = subjects.find(s => s.id === v.subjectId)
    onAdd({
      subjectId: v.subjectId,
      subjectName: subject?.name || 'Unknown',
      testDateIso: new Date(v.testDate).toISOString(),
      targetHours: Number(v.targetHours || 0)
    })
    reset()
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-2">
      <div className="text-lg font-semibold">Add test</div>
      <label className="label">Subject</label>
      <select className="input" {...register('subjectId', { required: true })}>
        <option value="">Select subject</option>
        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <label className="label">Test date</label>
      <input className="input" type="date" {...register('testDate', { required: true })} />
      <label className="label">Target hours</label>
      <input className="input" type="number" step="0.5" placeholder="e.g., 6" {...register('targetHours', { required: true, min: 0 })} />
      <button className="btn" type="submit">Add</button>
    </form>
  )
}
