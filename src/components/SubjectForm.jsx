import { useForm } from 'react-hook-form'

export default function SubjectForm({ onAdd }) {
  const { register, handleSubmit, reset } = useForm()
  const onSubmit = (v) => { onAdd({ name: v.name.trim() }); reset() }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-2">
      <div className="text-lg font-semibold">Add subject</div>
      <input className="input" placeholder="e.g., Calculus" {...register('name', { required: true })} />
      <button className="btn" type="submit">Add</button>
    </form>
  )
}
