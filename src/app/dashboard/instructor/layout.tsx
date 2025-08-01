import AuthWrapper from "../../../components/AuthWrapper";

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthWrapper requiredRoles={["instructor"]}>
      <div className="instructor-layout">{children}</div>
    </AuthWrapper>
  );
}
