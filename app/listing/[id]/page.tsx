import { ListingPage } from '@/components/pages/product';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingPage listingId={id} />;
}
