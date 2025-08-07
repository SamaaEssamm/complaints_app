'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function SuggestionDetailsPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [suggestion, setSuggestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchSuggestion = async () => {
      try {
        const email = localStorage.getItem("student_email");
        const res = await fetch(`http://127.0.0.1:5000/api/student/getsuggestion?id=${id}&student_email=${email}`);

        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();
        setSuggestion(data);
      } catch (error) {
        console.error('Error fetching suggestion:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestion();
  }, [id]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!suggestion) return <p className="p-6 text-red-600">Suggestion not found.</p>;

  return (
    <div className="min-h-screen bg-white py-10 px-6 md:px-12 lg:px-24">
      <h1 className="text-3xl font-bold text-[#003087] mb-6">Suggestion Details</h1>

      <div className="bg-gray-50 border rounded-xl p-6 shadow space-y-3">
        <p><span className="font-semibold">Title:</span> {suggestion.suggestion_title}</p>
        <p><span className="font-semibold">Type:</span> {suggestion.suggestion_type}</p>
        <p><span className="font-semibold">Department:</span> {suggestion.suggestion_dep}</p>
        <p>
          <span className="font-semibold">Date:</span>{' '}
          {suggestion.suggestion_created_at
            ? new Date(suggestion.suggestion_created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            : 'Unknown'}
        </p>

        <div className="mt-4">
          <span className="font-semibold block mb-1">Message:</span>
          <div className="whitespace-pre-wrap bg-white border border-gray-200 rounded-lg p-4 max-h-[500px] overflow-auto">
            {suggestion.suggestion_message}
          </div>
        </div>

        {suggestion.suggestion_file && (
          <div className="mt-6">
            <span className="font-semibold block mb-1">Attached File:</span>

            {suggestion.suggestion_file_type?.startsWith('image/') ? (
              <div>
                <img
                  src={`data:${suggestion.suggestion_file_type};base64,${suggestion.suggestion_file}`}
                  alt={suggestion.suggestion_file_name || "Attached image"}
                  className="max-w-full max-h-[400px] rounded border"
                />
                {suggestion.suggestion_file_name && (
                  <input
                    type="text"
                    value={suggestion.suggestion_file_name}
                    readOnly
                    className="mt-2 border px-3 py-1 rounded bg-gray-100 w-full"
                  />
                )}
              </div>
            ) : (
              <div>
                <a
                  href={`data:${suggestion.suggestion_file_type};base64,${suggestion.suggestion_file}`}
                  download={suggestion.suggestion_file_name || "attachment"}
                  className="text-blue-600 underline"
                >
                  {suggestion.suggestion_file_name || "Download file"}
                </a>
                {suggestion.suggestion_file_name && (
                  <input
                    type="text"
                    value={suggestion.suggestion_file_name}
                    readOnly
                    className="mt-2 border px-3 py-1 rounded bg-gray-100 w-full"
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
