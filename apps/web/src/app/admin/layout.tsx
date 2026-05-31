import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || session.user?.role !== 'admin') {
    redirect('/login');
  }

  return (
    <>
      {/* TODO: 관리자 사이드바 컴포넌트 */}
      <main>{children}</main>
    </>
  );
}
