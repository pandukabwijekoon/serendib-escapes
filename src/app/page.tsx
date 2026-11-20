import { getUsdToLkrRate } from "@/lib/env";
import { getPublicPackages } from "@/lib/packages";
import { SerendibExperience } from "@/components/SerendibExperience";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { packages } = await getPublicPackages();
  const usdToLkrRate = getUsdToLkrRate();

  return (
    <SerendibExperience packages={packages} usdToLkrRate={usdToLkrRate} />
  );
}
