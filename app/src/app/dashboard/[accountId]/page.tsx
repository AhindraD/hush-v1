import DashboardClient from '@/components/features/dashboard/DashboardClient';

interface DashboardPageProps {
  params: { accountId: string };
}

export default function DashboardPage({ params }: DashboardPageProps) {
  return <DashboardClient accountId={params.accountId} />;
}

export async function generateMetadata({
  params,
}: DashboardPageProps) {
  return {
    title: `Dashboard · HUSH`,
    description: `Shielded balance, yield positions, and deposit history for HUSH account.`,
  };
}
