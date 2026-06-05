import { MarketplacePage } from '@/components/pages/product';

export default function Page({ searchParams }: { searchParams: Record<string, string> }) {
  return <MarketplacePage searchParams={searchParams} />;
}
