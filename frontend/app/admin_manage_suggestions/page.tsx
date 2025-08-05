'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ManageSuggestionsPage() {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/admin/get_all_suggestions`);
        if (!res.ok) throw new Error('Failed to fetch suggestions');
        const data = await res.json();
        setSuggestions(data);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  const handleRowClick = (id: string) => {
    router.push('/admin_manage_suggestions/${id}');
  };

  const filteredSuggestions = suggestions.filter(s =>
    s.suggestion_title.toLowerCase().includes(filterType.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white py-10 px-6 md:px-12 lg:px-24">
      <h1 className="text-3xl font-bold text-[#003087] mb-6">Manage Suggestions</h1>

      <div className="mb-4">
        <label htmlFor="filter" className="block font-semibold mb-1">Filter by Title:</label>
        <input
          id="filter"
          type="text"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border rounded px-3 py-1 w-full md:w-1/3"
          placeholder="Search suggestions..."
        />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : filteredSuggestions.length === 0 ? (
        <p className="text-red-600">No suggestions found.</p>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full bg-white border rounded-lg shadow">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border">Title</th>
                <th className="py-2 px-4 border">Date</th>
                <th className="py-2 px-4 border">Visibility</th>
                <th className="py-2 px-4 border">Student</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuggestions.map((s) => (
                <tr
                  key={s.suggestion_id}
                  onClick={() => handleRowClick(s.suggestion_id)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <td className="py-2 px-4 border">{s.suggestion_title}</td>
                  <td className="py-2 px-4 border">{s.suggestion_date}</td>
                  <td className="py-2 px-4 border">{s.suggestion_visibility}</td>
                  <td className="py-2 px-4 border">{s.student_email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}