import { redirect } from 'next/navigation';
import { auth } from '@/auth';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <>
      {/* TODO: 헤더 컴포넌트 (로그인 유저용) */}
      <main>{children}</main>
    </>
  );
}
