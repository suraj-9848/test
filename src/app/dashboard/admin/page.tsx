'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import Sidebar from '@/components/AdminSidebar';
import UserManagement from '@/components/UserManagement';
import ManageHiring from '@/components/ManageHiring';
import PaymentApproval from '@/components/PaymentApproval';

const Index: React.FC = () => {
  const { status } = useSession();
  const router = useRouter();

  const [activeSection, setActiveSection] = useState('users');

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/'); // or custom login route
    }
  }, [status, router]);

  const renderContent = () => {
    switch (activeSection) {
      case 'users':
        return <UserManagement />;
      case 'manage-hiring':
        return <ManageHiring />;
      case 'payments':
      default:
        return <PaymentApproval />;
    }
  };

  // Show loading or fallback while checking auth status
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full animate-spin"></div>
          <span className="text-black font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  // Show nothing until auth check completes
  if (status === 'unauthenticated') return null;

  return (
    <div className="flex h-screen bg-white">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <div className="flex-1 overflow-auto bg-white">{renderContent()}</div>
    </div>
  );
};

export default Index;
