'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const statusMap: Record<string, string> = {
  'under_checking': 'Received',
  'under_review': 'Under Review',
  'in_progress': 'In Progress',
  'done': 'Done',
};

export default function StatusUpdatePage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [status, setStatus] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusError, setStatusError] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`http://127.0.0.1:5000/api/admin/get_complaint?id=${id}`)
      .then(res => res.json())
      .then(data => {
        setStatus(data.complaint_status || 'under_checking');
      })
      .catch(err => {
        console.error('Failed to fetch status:', err);
      });
  }, [id]);

  const handleStatusChange = async () => {
    try {
      const res = await fetch('/api/admin/update_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint_id: id,
          complaint_status: status,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Status update failed:', text);
        setStatusError(true);
        setStatusMessage('Failed to update status.');
        return;
      }

      const data = await res.json();
      setStatusError(data.status !== 'success');
      setStatusMessage(
        data.status === 'success'
          ? 'Status updated successfully.'
          : 'Failed to update status.'
      );
    } catch (err) {
      console.error(err);
      setStatusError(true);
      setStatusMessage('Something went wrong.');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Update Complaint Status</h2>

      <select value={status} onChange={(e) => setStatus(e.target.value)} className="mb-4 block w-full p-2 border rounded">
        {Object.entries(statusMap).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <button
        onClick={handleStatusChange}
        className="mb-4 px-6 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700"
      >
        Update Status
      </button>

      {statusMessage && (
        <p className={`font-medium ${statusError ? 'text-red-600' : 'text-green-600'}`}>
          {statusMessage}
        </p>
      )}
    </div>
  );
}
