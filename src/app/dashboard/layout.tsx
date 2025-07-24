"use client";

import AuthValidationWrapper from "@/components/AuthValidator";
import Navbar from "@/components/Navbar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col">
      <Navbar />
      <AuthValidationWrapper>
        {children}
      </AuthValidationWrapper>
    </div>
  );
}
