import { DealRoomPage } from '@/components/pages/deal-room';

export const metadata = { title: 'Deal room — SafeBusinessSelling' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DealRoomPage conversationId={id} />;
}
