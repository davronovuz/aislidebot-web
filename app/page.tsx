// Root page — Telegram Mini App router
// URL params: ?type=presentation|document|[product_type]
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

  // Default: dashboard
  redirect('/home');
}
