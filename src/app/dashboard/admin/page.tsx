'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import Sidebar from '@/components/AdminSidebar';
<<<<<<< HEAD
import UserManagement from '@/components/UserManagement';
import OrganizationManagement from '@/components/OrganizationManagement';
=======
import CollegeManagement from '@/components/CollegeManagement';
>>>>>>> bd8e2df30d01f57bb1a56062ca3ec6ba63fd9e08
import ManageHiring from '@/components/ManageHiring';
import PaymentApproval from '@/components/PaymentApproval';
import { ToastProvider } from '@/components/ToastContext';

const Index: React.FC = () => {
  const { status } = useSession();
  const router = useRouter();

  const [activeSection, setActiveSection] = useState('payments');

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin'); // or custom login route
    }
  }, [status, router]);

  const renderContent = () => {
    switch (activeSection) {
<<<<<<< HEAD
      case 'users':
        return <UserManagement />;
      case 'organizations':
        return <OrganizationManagement />;
=======
      case 'college-admins':
        return <CollegeManagement type="college-admins" />;
      case 'instructors':
        return <CollegeManagement type="instructors" />;
      case 'students':
        return <CollegeManagement type="students" />;
>>>>>>> bd8e2df30d01f57bb1a56062ca3ec6ba63fd9e08
      case 'manage-hiring':
        return <ManageHiring />;
      case 'payments':
      default:
        return <PaymentApproval />;
    }
  };

  // Show loading or fallback while checking auth status
  if (status === 'loading') {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // Show nothing until auth check completes
  if (status === 'unauthenticated') return null;

  return (
<<<<<<< HEAD
    <ToastProvider>
      <div className="flex h-screen bg-white">
        <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        <div className="flex-1 overflow-auto bg-white">{renderContent()}</div>
      </div>
    </ToastProvider>
=======
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <div className="flex-1 overflow-auto bg-white">{renderContent()}</div>
    </div>
>>>>>>> bd8e2df30d01f57bb1a56062ca3ec6ba63fd9e08
  );
};

export default Index;
