'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import CreateCourse from '@/components/CreateCourse';

const NewCoursePage = () => {
  const router = useRouter();

  return (
    <div className="p-8">
      <CreateCourse 
        onCancel={() => router.push('/dashboard/instructor/courses')}
        onSuccess={() => router.push('/dashboard/instructor/courses?success=Course created successfully!')}
      />
    </div>
  );
};

export default NewCoursePage;
