import { PraesentationApp } from "@/components/layout/PraesentationApp";
import { ladePraesentationsDaten } from "@/lib/praesentation";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ estateId?: string; addressId?: string }>;
}) {
  const params = await searchParams;
  const daten = await ladePraesentationsDaten(params);

  return <PraesentationApp daten={daten} />;
}
