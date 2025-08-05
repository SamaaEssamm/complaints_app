'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [studentName, setStudentName] = useState('Student');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const email = localStorage.getItem('student_email');
    if (!email) {
      router.push('/login');
    } else {
      // Fetch the real name from the backend using the email
      fetch(`http://localhost:5000/api/student/${encodeURIComponent(email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.name) {
            setStudentName(data.name);
          } else {
            setStudentName('Student'); // fallback
          }
          setIsLoading(false);
        })
        .catch(() => {
          setStudentName('Student');
          setIsLoading(false);
        });
    }
  }, [router]);


  const handleLogout = () => {
    localStorage.removeItem('student_email');
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
<<<<<<< HEAD
      <nav className="bg-[#003087] text-white py-3 shadow-md">
        <ul className="flex justify-center gap-6 font-semibold text-sm md:text-base">
          <li>
            <button
              onClick={() => router.push('/student_complaint')}
              className="hover:underline hover:text-gray-300 transition"
            >
              Complaints
            </button>
          </li>

          <li><a href="/student_suggestions" className="hover:underline hover:text-gray-300 transition">Suggestions</a></li>
          <li><a href="/responses" className="hover:underline hover:text-gray-300 transition">Responses</a></li>
          <li><a href="/notifications" className="hover:underline hover:text-gray-300 transition">Notifications</a></li>
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
=======
<nav className="bg-[#003087] text-white py-3 shadow-md">
  <ul className="flex justify-center gap-6 font-semibold text-sm md:text-base">
    <li>
      <button
        onClick={() => router.push('/student_complaint')}
        className="hover:underline hover:text-gray-300 transition"
      >
        Complaints
      </button>
    </li>
    <li>
      <button
        onClick={() => router.push('/suggestions')}
        className="hover:underline hover:text-gray-300 transition"
      >
        Suggestions
      </button>
    </li>
    <li>
      <button
        onClick={() => router.push('/responses')}
        className="hover:underline hover:text-gray-300 transition"
      >
        Responses
      </button>
    </li>
    <li>
      <button
        onClick={() => router.push('/notifications')}
        className="hover:underline hover:text-gray-300 transition"
      >
        Notifications
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
>>>>>>> origin/manal_omran

      {/* Welcome Section */}
      <section className="flex-grow flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-5xl font-extrabold text-white drop-shadow-lg mb-4">
          Welcome, {studentName} 🎓
        </h1>
        <p className="text-xl text-white drop-shadow-md">
          This is your university platform for complaints and suggestions
        </p>
      </section>
    </div>
  );
}