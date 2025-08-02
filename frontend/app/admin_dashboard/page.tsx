'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [adminName, setAdminName] = useState('Admin');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const redirected = useRef(false); // 👈 prevent repeated redirects

  useEffect(() => {
    const email = localStorage.getItem('admin_email');
    if (!email) {
      if (!redirected.current) {
        redirected.current = true;
        router.replace('/login'); // use replace instead of push
      }
    } else {
      fetch(`http://localhost:5000/api/get_admin_name/${encodeURIComponent(email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.name) {
            setAdminName(data.name);
          }
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('admin_email');
    router.push('/login');
  };

  if (isLoading) return null;

  return (
    <div
      className="min-h-screen bg-cover bg-center text-[#003087] flex flex-col"
      style={{ backgroundImage: "url('/home.jpg')" }}
    >
      {/* Header */}
      <header className="w-full flex justify-between items-center px-10 py-4 bg-transparent shadow-none">
        <div className="flex flex-col items-center">
          <img src="/faculty-logo.png" alt="Faculty Logo" className="w-20 h-20 mb-1 drop-shadow-lg" />
          <p className="text-sm font-semibold text-white text-center">Faculty of Computer & Information</p>
        </div>
        <div className="flex flex-col items-center">
          <img src="/university-logo.png" alt="University Logo" className="w-20 h-20 mb-1 drop-shadow-lg" />
          <p className="text-sm font-semibold text-white text-center">Assiut University</p>
        </div>
      </header>

      {/* Navigation Bar */}
<nav className="bg-[#003087] text-white py-3 shadow-md">
  <ul className="flex justify-center gap-6 font-semibold text-sm md:text-base">
    <li>
      <button
        onClick={() => router.push('/admin_manage_complaints')}
        className="hover:underline hover:text-gray-300 transition"
      >
        Manage Complaints
      </button>
    </li>
    <li>
      <button
        onClick={() => router.push('/admin_manage_suggestions')}
        className="hover:underline hover:text-gray-300 transition"
      >
        Manage Suggestions
      </button>
    </li>
    <li>
      <button
        onClick={() => router.push('/admin_manage_students')}
        className="hover:underline hover:text-gray-300 transition"
      >
        Manage Students
      </button>
    </li>
    <li>
      <button
        onClick={handleLogout}
        className="hover:underline hover:text-gray-300 transition"
      >
        Logout
      </button>
    </li>
  </ul>
</nav>


      {/* Welcome Section */}
      <section className="flex-grow flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-5xl font-extrabold text-white drop-shadow-lg mb-4">
          Welcome, {adminName} 🧑‍💼
        </h1>
        <p className="text-xl text-white drop-shadow-md">
          This is your admin dashboard to manage complaints and suggestions
        </p>
      </section>
    </div>
  );
}
