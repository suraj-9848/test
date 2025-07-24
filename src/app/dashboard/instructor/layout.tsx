import AuthValidationWrapper from "@/components/AuthValidator";

export default function InstructorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthValidationWrapper>
      {children}
    </AuthValidationWrapper>
  );
}
