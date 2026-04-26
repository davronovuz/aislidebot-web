import { redirect } from 'next/navigation';

export default function RootPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const type = searchParams?.type;

  if (type === 'presentation') {
    redirect(`/create/presentation?${new URLSearchParams(searchParams).toString()}`);
  }

  if (type && type !== 'presentation') {
    redirect(`/create/${type.replace(/_/g, '-')}?${new URLSearchParams(searchParams).toString()}`);
  }

  redirect('/home');
}
