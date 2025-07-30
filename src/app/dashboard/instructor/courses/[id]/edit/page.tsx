"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import InstructorSidebar from "@/components/InstructorSidebar";
import EditCourse from "@/components/EditCourse";

const EditCoursePage = () => {
  const params = useParams();
  const courseId = params.id as string;
  const { status } = useSession();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("all-courses");

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-slate-100">
      <InstructorSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      <div className="flex-1 overflow-auto">
        <EditCourse courseId={courseId} />
      </div>
    </div>
  );
};

export default EditCoursePage;
