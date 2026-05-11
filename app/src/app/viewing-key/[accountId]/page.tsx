import ViewingKeyClient from '@/components/features/viewing-key/ViewingKeyClient';

interface ViewingKeyPageProps {
  params: { accountId: string };
}

export default function ViewingKeyPage({ params }: ViewingKeyPageProps) {
  return <ViewingKeyClient accountId={params.accountId} />;
}

export async function generateMetadata({ params }: ViewingKeyPageProps) {
  return {
    title: `Viewing Key & Audit · HUSH`,
    description: `Generate ZK-Tax-Receipts for IRS compliance without revealing donor identity.`,
  };
}
