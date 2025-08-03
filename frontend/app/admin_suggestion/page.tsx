'use client'

import { useEffect, useState } from 'react' import { Card } from '@/components/ui/card' import { Button } from '@/components/ui/button'

interface Suggestion { suggestion_id: string; suggestion_title: string; suggestion_message: string; suggestion_type: string; suggestion_dep: string; suggestion_date: string; student_email: string; response_message?: string; }

export default function AllSuggestionsPage() { const [suggestions, setSuggestions] = useState<Suggestion[]>([]) const [filter, setFilter] = useState('')

useEffect(() => { let url = 'http://localhost:5000/api/admin/get_all_suggestions' if (filter) url += ?dep=${filter} fetch(url) .then(res => res.json()) .then(data => setSuggestions(data)) }, [filter])

return ( <div className="p-6 space-y-6"> <h1 className="text-2xl font-bold">📋 كل الاقتراحات</h1>

<div className="flex gap-4 items-center">
    <label>فلترة حسب القسم:</label>
    <select className="border p-2 rounded" value={filter} onChange={e => setFilter(e.target.value)}>
      <option value="">الكل</option>
      <option value="public">عام</option>
      <option value="private">خاص</option>
    </select>
  </div>

  {suggestions.length === 0 ? (
    <p className="text-gray-500">لا توجد اقتراحات حالياً.</p>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {suggestions.map(s => (
        <Card key={s.suggestion_id} className="p-4 space-y-2">
          <h2 className="font-bold text-lg">{s.suggestion_title}</h2>
          <p>{s.suggestion_message}</p>
          <div className="text-sm text-gray-500">
            <p>النوع: {s.suggestion_type}</p>
            <p>القسم: {s.suggestion_dep === 'public' ? 'عام' : 'خاص'}</p>
            <p>التاريخ: {s.suggestion_date}</p>
            {s.suggestion_dep === 'public' && <p>📧 {s.student_email}</p>}
          </div>
          {s.response_message && (
            <div className="bg-green-100 p-2 rounded text-sm">🟢 تم الرد: {s.response_message}</div>
          )}
        </Card>
      ))}
    </div>
  )}
</div>

) }