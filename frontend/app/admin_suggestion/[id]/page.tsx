'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function suggestionDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [suggestion, setsuggestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusColor, setStatusColor] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchsuggestion = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/admin/get_suggestion?id=${id}`);
        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();
        setsuggestion(data);
        setStatus(data.suggestion_status);
      } catch (error) {
        console.error('Error fetching suggestion:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchsuggestion();
  }, [id]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
  };

  const handleUpdateStatus = async () => {
    if (!id || !status) return;

    setUpdating(true);
    setStatusMessage('');
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/admin/update_status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestion_id: id, new_status: status })
      });

      const result = await res.json();
      if (result.status === 'success') {
        setsuggestion({ ...suggestion, suggestion_status: status });
        setStatusMessage('Status updated successfully!');
        setStatusColor('text-green-600');
      } else {
        setStatusMessage('Failed to update status.');
        setStatusColor('text-red-600');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setStatusMessage('An unexpected error occurred.');
      setStatusColor('text-red-600');
    } finally {
      setUpdating(false);
    }
  };

  const handleRespond = () => {
    if (id) {
      router.push(`/admin_respond?id=${id}`);
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;
  if (!suggestion) return <p className="p-6 text-red-600">suggestion not found.</p>;

  return (
    <div className="min-h-screen bg-white py-10 px-6 md:px-12 lg:px-24">
      <h1 className="text-3xl font-bold text-[#003087] mb-6">suggestion Details</h1>

      <div className="bg-gray-50 border rounded-xl p-6 shadow space-y-3">
        <p><span className="font-semibold">Title:</span> {suggestion.suggestion_title}</p>
        <p><span className="font-semibold">Type:</span> {suggestion.suggestion_type}</p>
        <p>
          <span className="font-semibold">Date:</span>{' '}
          {suggestion.suggestion_date
            ? new Date(suggestion.suggestion_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            : 'Unknown'}
        </p>
        <p><span className="font-semibold">Student:</span> {suggestion.student_email}</p>
        <p><span className="font-semibold">Status:</span> {suggestion.suggestion_status}</p>
        <div className="mt-4">
          <span className="font-semibold block mb-1">Message:</span>
          <div className="whitespace-pre-wrap bg-white border border-gray-200 rounded-lg p-4 max-h-[500px] overflow-auto">
            {suggestion.suggestion_message}
          </div>
        </div>

        <div className="mt-6">
          <label htmlFor="status" className="block font-semibold mb-1">Change Status:</label>
          <select
            id="status"
            value={status}
            onChange={handleStatusChange}
            className="border rounded px-3 py-1 mr-2"
          >
            <option value="under_checking">Under Checking</option>
            <option value="under_review">Under Review</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <button
            onClick={handleUpdateStatus}
            disabled={updating}
            className="bg-[#003087] text-white px-4 py-1 rounded hover:bg-blue-800 mr-2"
          >
            {updating ? 'Updating...' : 'Update'}
          </button>
          {!suggestion.response_message && (
          <button
            onClick={handleRespond}
            className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
          >
            Respond
          </button>
        )}


          {statusMessage && (
            <p className={`mt-2 font-medium ${statusColor}`}>{statusMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}
