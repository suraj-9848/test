'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import InstructorSidebar from '../../../components/InstructorSidebar';
import CoursesOverview from "../../../components/CoursesOverview";
import CreateCourse from "../../../components/CreateCourse";
import ManageModules from "../../../components/ManageModules";

const InstructorDashboard: React.FC = () => {
  const { status } = useSession();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <CoursesOverview />;
      case 'courses-overview':
        return <CoursesOverview />;
      case 'create-course':
        return <CreateCourse />;
      case 'manage-modules':
        return <ManageModules />;
      case 'manage-tests':
        return <div className="p-8"><h1 className="text-2xl font-bold">Manage Tests - Coming Soon</h1></div>;
      case 'question-bank':
        return <div className="p-8"><h1 className="text-2xl font-bold">Question Bank - Coming Soon</h1></div>;
      default:
        return <CoursesOverview />;
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <InstructorSidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <div className="flex-1 overflow-auto">{renderContent()}</div>
    </div>
  );
};

export default InstructorDashboard;