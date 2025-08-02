'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Complaint = {
  complaint_id: number;
  complaint_title: string;
  complaint_message: string;
  complaint_type: string;
  complaint_dep: string;
  complaint_status: string;
  complaint_date: string;
  response_message: string | null;
  student_name: string;
};

export default function ManageComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('All');
  const router = useRouter();

  const filteredComplaints = complaints.filter(
    (c) => selectedType === 'All' || c.complaint_type === selectedType
  );

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const res = await fetch('http://127.0.0.1:5000/api/admin/get_all_complaints');
        const data = await res.json();

        if (Array.isArray(data)) {
          setComplaints(data);
        } else if (Array.isArray(data.complaints)) {
          setComplaints(data.complaints);
        } else {
          setComplaints([]);
        }
      } catch (error) {
        console.error('Failed to fetch complaints:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const statusLabels: { [key: string]: string } = {
  under_checking: 'Received',
  under_review: 'Under Review',
  in_progress: 'In Progress',
  done: 'Done',
};

  const getStatusColor = (status: string) => {
  switch (status) {
    case 'under_checking':
      return 'text-green-600';
    case 'under_review':
      return 'text-blue-600';
    case 'in_progress':
      return 'text-orange-600';
    case 'done':
      return 'text-purple-600';
    default:
      return 'text-gray-500';
  }
};


  return (
    <div className="bg-white min-h-screen py-10 px-6 md:px-12 lg:px-24">
      <h1 className="text-3xl font-bold text-[#003087] mb-8">Manage Complaints</h1>

      {/* Filter Dropdown */}
      <div className="mb-6">
        <label htmlFor="filter" className="mr-2 font-medium text-gray-700">
          Filter by Type:
        </label>
        <select
          id="filter"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1"
        >
          <option value="All">All</option>
          <option value="IT">IT</option>
          <option value="Academic">Academic</option>
          <option value="Activities">Activities</option>
          <option value="Administrative">Administrative</option>
        </select>
      </div>

      {loading ? (
        <p>Loading complaints...</p>
      ) : filteredComplaints.length === 0 ? (
        <p className="text-gray-500">No complaints found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow border border-gray-200">
          <table className="min-w-full bg-white text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700">Title</th>
                <th className="px-4 py-3 font-medium text-gray-700">Type</th>
                <th className="px-4 py-3 font-medium text-gray-700">Date</th>
                <th className="px-4 py-3 font-medium text-gray-700">Student</th>
                <th className="px-4 py-3 font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map((c) => (
                <tr
                  key={c.complaint_id}
                  className="border-t border-gray-200 hover:bg-gray-100 cursor-pointer transition"
                  onClick={() => router.push(`/admin_complaint/${c.complaint_id}
`)}
                >
                  <td className="px-4 py-2">{c.complaint_title}</td>
                  <td className="px-4 py-2">{c.complaint_type}</td>
                  <td className="px-4 py-2">{new Date(c.complaint_date).toLocaleDateString()}</td>
                  <td className="px-4 py-2">
                    {c.complaint_dep === 'Public' ? c.student_name : 'Unknown'}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`font-medium ${getStatusColor(c.complaint_status)}`}>
                    {statusLabels[c.complaint_status] || c.complaint_status}
                    </span>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
