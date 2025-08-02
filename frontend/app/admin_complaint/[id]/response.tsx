'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function RespondToComplaintPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [response, setResponse] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`http://127.0.0.1:5000/api/admin/get_complaint?id=${id}`)
      .then(res => res.json())
      .then(data => {
        setResponse(data.response_message || '');
      })
      .catch(err => {
        console.error('Failed to fetch complaint:', err);
      });
  }, [id]);

  const handleSubmit = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/admin/respond_message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint_id: id,
          response_message: response,
        }),
      });

      const data = await res.json();
      setIsError(data.status !== 'success');
      setMessage(
        data.status === 'success'
          ? 'Response submitted successfully.'
          : 'Failed to submit response.'
      );
    } catch (err) {
      console.error(err);
      setIsError(true);
      setMessage('Something went wrong.');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Respond to Complaint</h2>

      <textarea
        className="border px-4 py-2 rounded w-full h-32"
        value={response}
        onChange={(e) => setResponse(e.target.value)}
      />

      <button
        onClick={handleSubmit}
        className="mt-4 px-6 py-2 bg-blue-700 text-white font-medium rounded hover:bg-blue-800"
      >
        Submit Response
      </button>

      {message && (
        <p className={`mt-4 font-medium ${isError ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
