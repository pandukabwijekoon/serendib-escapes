import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { getAdminBookings, getAdminPackages } from "@/actions/adminActions";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const [bookingsRes, packagesRes] = await Promise.all([
    getAdminBookings(),
    getAdminPackages(),
  ]);

  const dbError =
    !bookingsRes.success || !packagesRes.success
      ? bookingsRes.error ||
        packagesRes.error ||
        "Database not connected yet. Configure MONGODB_URI in .env.local and run /api/seed."
      : null;

  return (
    <AdminDashboardClient
      adminEmail={session.email}
      initialBookings={bookingsRes.bookings ?? []}
      initialPackages={packagesRes.packages ?? []}
      dbError={dbError}
    />
  );
}
