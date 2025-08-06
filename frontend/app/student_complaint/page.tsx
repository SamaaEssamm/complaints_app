'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Complaint = {
  complaint_id: number;
  complaint_title: string;
  complaint_message: string;
  complaint_type: string;
  complaint_dep: string;
  complaint_created_at: string;
  complaint_status: string;
  student_email: string;
  responder_email: string | null;
  response_message: string | null;
};

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
  const fetchData = async () => {
    try {
      const email = localStorage.getItem("student_email");
      console.log("Email from localStorage:", email);

      if (!email) {
        console.warn("No email found in localStorage");
        return;
      }

      const res = await fetch(`http://127.0.0.1:5000/api/student/showcomplaints?student_email=${email}`);
      const data = await res.json();
      console.log("Fetched complaints:", data);

      

      if (Array.isArray(data)) {
  // Case 1: backend directly returned an array
     setComplaints(data);
} else if (Array.isArray(data.complaints)) {
  // Case 2: complaints are wrapped inside a "complaints" key
  setComplaints(data.complaints);
} else {
  // Case 3: no complaints or wrong shape
  console.warn("No complaints or unexpected response:", data);
  setComplaints([]);
}
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchData(); // ✅ call it inside the useEffect
}, []);


  const handleAddComplaint = () => {
    router.push('/student_complaint_add');
  };
function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return 'Unknown';
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime())
    ? 'Invalid Date'
    : parsed.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
}

  return (
    <main className="bg-white min-h-screen py-10 px-6 md:px-12 lg:px-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#003087]">My Complaints</h1>
        <button
          onClick={handleAddComplaint}
          className="bg-[#003087] text-white px-4 py-2 rounded-2xl text-sm hover:bg-[#002060] transition"
        >
          + Add Complaint
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : complaints.length === 0 ? (
        <p className="text-gray-500">You haven't submitted any complaints yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow border border-gray-200">
          <table className="min-w-full bg-white text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700">Title</th>
                <th className="px-4 py-3 font-medium text-gray-700">Type</th>
                <th className="px-4 py-3 font-medium text-gray-700">Department</th>
                <th className="px-4 py-3 font-medium text-gray-700">Date</th>
                <th className="px-4 py-3 font-medium text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.complaint_id} className="border-t border-gray-200">
                  <td className="px-4 py-2">{c.complaint_title}</td>
                  <td className="px-4 py-2 capitalize">{c.complaint_type}</td>
                  <td className="px-4 py-2 capitalize">{c.complaint_dep}</td>
                  <td className="px-4 py-2">{formatDate(c.complaint_created_at)}</td>

                  <td className="px-4 py-2 capitalize">
                    {c.complaint_status === "under_checking" && (
                      <span className="text-blue-600 font-medium">Recieved</span>
                    )}
                    {c.complaint_status === "under_review" && (
                      <span className="text-purple-600 font-medium">Under Review</span>
                    )}
                    {c.complaint_status === "in_progress" && (
                      <span className="text-green-600 font-medium">In Progress</span>
                    )}
                    {c.complaint_status === "done" && (
                      <span className="text-gray-600 font-medium">Responded</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}