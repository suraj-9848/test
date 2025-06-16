'use client';

import Loader from '@/components/Loader';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React from 'react';

const DashboardLanding = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <Loader/>;
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center bg-gradient-to-br from-indigo-100 via-blue-200 to-indigo-100 px-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Access Denied</h1>
        <p className="text-gray-600">Please sign in to access the admin dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#dfe9f3] via-[#a1c4fd] to-[#dfe9f3] px-4 py-12">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-10 text-center animate-fade-in">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome, Admin!</h1>
        <p className="text-gray-600 mb-6">You are signed in as <span className="font-semibold">{session.user?.email}</span></p>

        <button
          onClick={() => router.push('/dashboard')}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-lg font-semibold shadow-md hover:bg-indigo-700 transition duration-300"
        >
          View Dashboard
        </button>

        <button
          onClick={() => signOut()}
          className="block mt-6 text-sm text-gray-500 hover:underline"
        >
          Sign out
        </button>
      </div>
    </div>
  );
};

export default DashboardLanding;
