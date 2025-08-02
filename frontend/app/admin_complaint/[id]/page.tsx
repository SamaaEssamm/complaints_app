'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function ComplaintDetailsPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchComplaint = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/admin/get_complaint?id=${id}`);
        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();
        setComplaint(data);
      } catch (error) {
        console.error('Error fetching complaint:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaint();
  }, [id]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!complaint) return <p className="p-6 text-red-600">Complaint not found.</p>;

  return (
    <div className="min-h-screen bg-white py-10 px-6 md:px-12 lg:px-24">
      <h1 className="text-3xl font-bold text-[#003087] mb-6">Complaint Details</h1>

      <div className="bg-gray-50 border rounded-xl p-6 shadow">
        <p><span className="font-semibold">Title:</span> {complaint.complaint_title}</p>
        <p><span className="font-semibold">Type:</span> {complaint.complaint_type}</p>
        <p><span className="font-semibold">Date:</span> {new Date(complaint.complaint_date).toLocaleDateString()}</p>
        <p><span className="font-semibold">Student:</span> {complaint.complaint_dep === 'Public' ? complaint.student_name : 'Unknown'}</p>
        <p className="mt-4"><span className="font-semibold">Message:</span><br />{complaint.complaint_message}</p>
      </div>
    </div>
  );
}
