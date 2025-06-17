'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import Sidebar from '@/components/AdminSidebar';
import CollegeManagement from '@/components/CollegeManagement';
import ManageHiring from '@/components/ManageHiring';
import PaymentApproval from '@/components/PaymentApproval';

const Index: React.FC = () => {
  const { data: session, status } = useSession();
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
      case 'college-admins':
        return <CollegeManagement type="college-admins" />;
      case 'instructors':
        return <CollegeManagement type="instructors" />;
      case 'students':
        return <CollegeManagement type="students" />;
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
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <div className="flex-1 overflow-auto bg-white">{renderContent()}</div>
    </div>
  );
};

export default Index;
