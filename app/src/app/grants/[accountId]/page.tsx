import GrantsClient from '@/components/features/grants/GrantsClient';

interface GrantsPageProps {
  params: { accountId: string };
}

export default function GrantsPage({ params }: GrantsPageProps) {
  return <GrantsClient accountId={params.accountId} />;
}

export async function generateMetadata({ params }: GrantsPageProps) {
  return {
    title: `Grants · HUSH`,
    description: `Advise anonymous charitable grants from your shielded balance.`,
  };
}
