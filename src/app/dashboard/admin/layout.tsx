import AuthWrapper from '../../../components/AuthWrapper';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthWrapper requiredRoles={['admin', 'recruiter']}>
      <div className="admin-layout">
        {children}
      </div>
    </AuthWrapper>
  );
}
