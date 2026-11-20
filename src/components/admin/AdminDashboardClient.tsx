"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Edit3,
  ExternalLink,
  LogOut,
  Mail,
  MessageCircle,
  Package as PackageIcon,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import {
  deletePackage,
  togglePackageFlag,
  updateBookingStatus,
  upsertPackage,
} from "@/actions/adminActions";
import {
  BOOKING_STATUSES,
  BookingDTO,
  BookingStatus,
  DESTINATIONS,
  DestinationKey,
  TourPackageDTO,
} from "@/types";

interface AdminDashboardClientProps {
  adminEmail: string;
  initialBookings: BookingDTO[];
  initialPackages: TourPackageDTO[];
  dbError?: string | null;
}

const STATUS_BADGES: Record<BookingStatus, string> = {
  Pending: "border-amber-500/40 bg-amber-500/15 text-amber-300",
  Confirmed: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  Completed: "border-sky-500/40 bg-sky-500/15 text-sky-300",
  Cancelled: "border-red-500/40 bg-red-500/15 text-red-300",
};

const DESTINATION_COLORS: Record<DestinationKey, string> = {
  Sigiriya: "#C87D16",
  Ella: "#0B5D47",
  Mirissa: "#0F4C75",
  Yala: "#9B1C1C",
};

export function AdminDashboardClient({
  adminEmail,
  initialBookings,
  initialPackages,
  dbError,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"bookings" | "packages">(
    "bookings"
  );
  const [bookings, setBookings] = useState<BookingDTO[]>(initialBookings);
  const [packages, setPackages] = useState<TourPackageDTO[]>(initialPackages);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | BookingStatus>(
    "All"
  );
  const [feedback, setFeedback] = useState<string | null>(dbError ?? null);

  // Package Modal State
  const [editingPkg, setEditingPkg] = useState<Partial<TourPackageDTO> | null>(
    null
  );
  const [highlightsText, setHighlightsText] = useState("");
  const [savingPkg, setSavingPkg] = useState(false);

  const filteredBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bookings.filter((b) => {
      const matchesStatus =
        statusFilter === "All" || b.status === statusFilter;
      const matchesQuery =
        !q ||
        b.bookingRef.toLowerCase().includes(q) ||
        b.fullName.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        b.destination.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [bookings, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const totalRevenue = bookings
      .filter((b) => b.status !== "Cancelled")
      .reduce((acc, b) => acc + b.estimatedTotalUsd, 0);
    const pendingCount = bookings.filter((b) => b.status === "Pending").length;
    return {
      totalBookings: bookings.length,
      pendingCount,
      totalRevenue,
      activePackages: packages.filter((p) => p.isActive).length,
    };
  }, [bookings, packages]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  async function handleStatusChange(bookingId: string, status: BookingStatus) {
    setFeedback(null);
    const res = await updateBookingStatus({ bookingId, status });
    if (!res.success) {
      setFeedback(res.error || "Failed to update status.");
      return;
    }
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
    );
  }

  function openNewPackageModal() {
    setEditingPkg({
      slug: "",
      title: "",
      destination: "Sigiriya",
      tagline: "",
      durationDays: 3,
      priceUsd: 480,
      localPriceLkr: 64000,
      themeColor: "#C87D16",
      coverImage: "/images/sigiriya-cover.jpg",
      cutoutImage: "/images/sigiriya-cutout.jpg",
      isFeatured: false,
      isActive: true,
    });
    setHighlightsText("Private sunrise tour\nLuxury chauffeur transfers");
  }

  function openEditPackageModal(pkg: TourPackageDTO) {
    setEditingPkg({ ...pkg });
    setHighlightsText(pkg.highlights.join("\n"));
  }

  async function handleSavePackage(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPkg) return;
    setSavingPkg(true);
    setFeedback(null);

    const highlights = highlightsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const payload = {
      id: editingPkg.id,
      slug: editingPkg.slug,
      title: editingPkg.title,
      destination: editingPkg.destination ?? "Sigiriya",
      tagline: editingPkg.tagline,
      durationDays: Number(editingPkg.durationDays ?? 3),
      priceUsd: Number(editingPkg.priceUsd ?? 480),
      localPriceLkr: Number(editingPkg.localPriceLkr ?? 64000),
      themeColor:
        editingPkg.themeColor ||
        DESTINATION_COLORS[
          (editingPkg.destination as DestinationKey) ?? "Sigiriya"
        ],
      coverImage:
        editingPkg.coverImage ||
        `/images/${(editingPkg.destination ?? "sigiriya").toLowerCase()}-cover.jpg`,
      cutoutImage:
        editingPkg.cutoutImage ||
        `/images/${(editingPkg.destination ?? "sigiriya").toLowerCase()}-cutout.jpg`,
      highlights: highlights.length > 0 ? highlights : ["Bespoke luxury stay"],
      isFeatured: Boolean(editingPkg.isFeatured),
      isActive: editingPkg.isActive !== false,
    };

    const res = await upsertPackage(payload);
    setSavingPkg(false);

    if (!res.success) {
      setFeedback(res.error || "Unable to save package.");
      return;
    }

    setEditingPkg(null);
    router.refresh();
  }

  async function handleToggleFlag(
    pkgId: string,
    field: "isActive" | "isFeatured"
  ) {
    const res = await togglePackageFlag(pkgId, field);
    if (!res.success) {
      setFeedback(res.error || "Unable to update package.");
      return;
    }
    setPackages((prev) =>
      prev.map((p) => (p.id === pkgId ? { ...p, [field]: !p[field] } : p))
    );
  }

  async function handleDeletePackage(pkgId: string) {
    const res = await deletePackage(pkgId);
    if (!res.success) {
      setFeedback(res.error || "Unable to delete package.");
      return;
    }
    setPackages((prev) => prev.filter((p) => p.id !== pkgId));
  }

  return (
    <div className="min-h-screen bg-[#0A0F0D] text-white">
      {/* Top Bar */}
      <header className="border-b border-white/10 bg-[#0D1411] px-6 py-4 sm:px-10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#D4AF37]">
              Serendib Escapes • Operations
            </span>
            <h1 className="font-serif text-2xl font-semibold text-white">
              Concierge Command Center
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-white/60 sm:inline">
              {adminEmail}
            </span>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-xs text-white/80 hover:border-[#D4AF37] hover:text-[#D4AF37]"
            >
              <span>Live Site</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-950/30 px-4 py-2 text-xs text-red-200 hover:bg-red-900/40"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 sm:px-10">
        {feedback && (
          <div className="mb-6 rounded-2xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-3 text-xs text-[#F3D97D]">
            {feedback}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#111815] p-5">
            <span className="text-xs uppercase tracking-[0.18em] text-white/55">
              Total Bookings
            </span>
            <p className="mt-2 font-serif text-3xl font-semibold text-white">
              {stats.totalBookings}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#111815] p-5">
            <span className="text-xs uppercase tracking-[0.18em] text-white/55">
              Pending Concierge Review
            </span>
            <p className="mt-2 font-serif text-3xl font-semibold text-amber-300">
              {stats.pendingCount}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#111815] p-5">
            <span className="text-xs uppercase tracking-[0.18em] text-white/55">
              Pipeline Value (USD)
            </span>
            <p className="mt-2 font-serif text-3xl font-semibold text-[#D4AF37]">
              ${stats.totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#111815] p-5">
            <span className="text-xs uppercase tracking-[0.18em] text-white/55">
              Active Packages
            </span>
            <p className="mt-2 font-serif text-3xl font-semibold text-emerald-300">
              {stats.activePackages}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("bookings")}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                activeTab === "bookings"
                  ? "bg-[#D4AF37] text-[#0A0F0D]"
                  : "border border-white/15 text-white/70 hover:text-white"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Reservations ({bookings.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("packages")}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                activeTab === "packages"
                  ? "bg-[#D4AF37] text-[#0A0F0D]"
                  : "border border-white/15 text-white/70 hover:text-white"
              }`}
            >
              <PackageIcon className="h-3.5 w-3.5" />
              <span>Tour Packages ({packages.length})</span>
            </button>
          </div>

          {activeTab === "packages" && (
            <button
              type="button"
              onClick={openNewPackageModal}
              className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#0A0F0D] hover:bg-[#E7C660]"
            >
              <Plus className="h-4 w-4" />
              <span>New Package</span>
            </button>
          )}
        </div>

        {/* BOOKINGS TAB */}
        {activeTab === "bookings" && (
          <div className="mt-6 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ref (SRD-...), guest, email, destination..."
                  className="w-full rounded-xl border border-white/15 bg-[#111815] py-2.5 pr-4 pl-10 text-sm text-white placeholder-white/35 outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {(["All", ...BOOKING_STATUSES] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                      statusFilter === st
                        ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]"
                        : "border-white/10 bg-[#111815] text-white/65 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#111815]">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 text-[11px] uppercase tracking-[0.18em] text-white/55">
                  <tr>
                    <th className="px-5 py-4">Reference</th>
                    <th className="px-5 py-4">Guest</th>
                    <th className="px-5 py-4">Itinerary</th>
                    <th className="px-5 py-4">Total (USD)</th>
                    <th className="px-5 py-4">Contact</th>
                    <th className="px-5 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-12 text-center text-sm text-white/50"
                      >
                        No bookings match your current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => {
                      const waPhone = b.phone.replace(/[^\d]/g, "");
                      return (
                        <tr key={b.id} className="hover:bg-white/[0.02]">
                          <td className="px-5 py-4 font-mono text-xs font-semibold text-[#D4AF37]">
                            {b.bookingRef}
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-medium text-white">
                              {b.fullName}
                            </p>
                            <p className="text-xs text-white/55">
                              {b.visitorType === "Sri Lankan Resident"
                                ? "Local"
                                : "Int'l"}{" "}
                              • {b.adults}A{" "}
                              {b.children > 0 ? `/ ${b.children}C` : ""} •{" "}
                              {b.tier}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-medium text-white">
                              {b.destination} ({b.durationDays}D)
                            </p>
                            <p className="text-xs text-white/55">
                              {new Date(b.travelDate).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="px-5 py-4 font-serif text-lg font-semibold text-[#D4AF37]">
                            {b.visitorType === "Sri Lankan Resident"
                              ? `LKR ${b.estimatedTotalLkr.toLocaleString()}`
                              : `$${b.estimatedTotalUsd.toLocaleString()}`}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <a
                                href={`https://wa.me/${waPhone}?text=${encodeURIComponent(
                                  `Ayubowan ${b.fullName}, regarding your Serendib Escapes reservation ${b.bookingRef}...`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Message on WhatsApp"
                                className="inline-flex items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-300 hover:bg-emerald-500/25"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                <span>WhatsApp</span>
                              </a>
                              <a
                                href={`mailto:${b.email}?subject=${encodeURIComponent(
                                  `Serendib Escapes Concierge — ${b.bookingRef}`
                                )}`}
                                title="Send Email"
                                className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-white/80 hover:border-[#D4AF37]"
                              >
                                <Mail className="h-3.5 w-3.5" />
                                <span>Email</span>
                              </a>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <select
                              aria-label={`Update status for ${b.bookingRef}`}
                              value={b.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  b.id,
                                  e.target.value as BookingStatus
                                )
                              }
                              className={`rounded-full border px-3 py-1 text-xs font-semibold outline-none ${
                                STATUS_BADGES[b.status]
                              }`}
                            >
                              {BOOKING_STATUSES.map((st) => (
                                <option
                                  key={st}
                                  value={st}
                                  className="bg-[#111815] text-white"
                                >
                                  {st}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PACKAGES TAB */}
        {activeTab === "packages" && (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#111815] p-5"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className="rounded-full px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white"
                      style={{ backgroundColor: pkg.themeColor }}
                    >
                      {pkg.destination}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleFlag(pkg.id, "isFeatured")}
                        title="Toggle Featured"
                        className={`rounded-full p-1.5 transition ${
                          pkg.isFeatured
                            ? "bg-[#D4AF37]/20 text-[#D4AF37]"
                            : "text-white/35 hover:text-white"
                        }`}
                      >
                        <Star className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleFlag(pkg.id, "isActive")}
                        title="Toggle Active"
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                          pkg.isActive
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-white/10 text-white/45"
                        }`}
                      >
                        {pkg.isActive ? "Active" : "Hidden"}
                      </button>
                    </div>
                  </div>

                  <h3 className="mt-3 font-serif text-xl font-semibold text-white">
                    {pkg.title}
                  </h3>
                  <p className="mt-1 text-xs text-white/60">{pkg.tagline}</p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                  <div>
                    <span className="block font-serif text-lg font-semibold text-[#D4AF37]">
                      ${pkg.priceUsd.toLocaleString()} • {pkg.durationDays}D
                    </span>
                    <span className="block text-[11px] text-white/55">
                      Local: LKR {pkg.localPriceLkr.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditPackageModal(pkg)}
                      className="rounded-lg border border-white/15 p-2 text-white/75 hover:border-[#D4AF37] hover:text-[#D4AF37]"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePackage(pkg.id)}
                      className="rounded-lg border border-red-500/30 p-2 text-red-300 hover:bg-red-950/40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create / Edit Package Modal */}
      {editingPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSavePackage}
            className="glass-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl p-6 text-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-[#D4AF37]">
                <Sparkles className="h-4 w-4" />
                <h2 className="font-serif text-xl font-semibold text-white">
                  {editingPkg.id ? "Edit Tour Package" : "Create Tour Package"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingPkg(null)}
                className="text-xs text-white/60 hover:text-white"
              >
                Cancel
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <label className="mb-1 block text-xs text-white/60">Title</label>
                <input
                  required
                  value={editingPkg.title ?? ""}
                  onChange={(e) =>
                    setEditingPkg({ ...editingPkg, title: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/15 bg-[#0A0F0D] px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-white/60">
                    Slug
                  </label>
                  <input
                    required
                    value={editingPkg.slug ?? ""}
                    onChange={(e) =>
                      setEditingPkg({
                        ...editingPkg,
                        slug: e.target.value.toLowerCase(),
                      })
                    }
                    placeholder="sigiriya-royal-escape"
                    className="w-full rounded-xl border border-white/15 bg-[#0A0F0D] px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/60">
                    Destination
                  </label>
                  <select
                    value={editingPkg.destination ?? "Sigiriya"}
                    onChange={(e) => {
                      const dest = e.target.value as DestinationKey;
                      setEditingPkg({
                        ...editingPkg,
                        destination: dest,
                        themeColor: DESTINATION_COLORS[dest],
                      });
                    }}
                    className="w-full rounded-xl border border-white/15 bg-[#0A0F0D] px-3 py-2 text-white"
                  >
                    {DESTINATIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-white/60">
                  Tagline
                </label>
                <input
                  required
                  value={editingPkg.tagline ?? ""}
                  onChange={(e) =>
                    setEditingPkg({ ...editingPkg, tagline: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/15 bg-[#0A0F0D] px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-white/60">
                    Duration (Days)
                  </label>
                  <input
                    required
                    type="number"
                    min={1}
                    max={30}
                    value={editingPkg.durationDays ?? 3}
                    onChange={(e) =>
                      setEditingPkg({
                        ...editingPkg,
                        durationDays: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-white/15 bg-[#0A0F0D] px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/60">
                    Int&apos;l (USD)
                  </label>
                  <input
                    required
                    type="number"
                    min={50}
                    value={editingPkg.priceUsd ?? 480}
                    onChange={(e) =>
                      setEditingPkg({
                        ...editingPkg,
                        priceUsd: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-white/15 bg-[#0A0F0D] px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/60">
                    Local (LKR)
                  </label>
                  <input
                    required
                    type="number"
                    min={5000}
                    value={editingPkg.localPriceLkr ?? 64000}
                    onChange={(e) =>
                      setEditingPkg({
                        ...editingPkg,
                        localPriceLkr: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-white/15 bg-[#0A0F0D] px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-white/60">
                  Highlights (one per line)
                </label>
                <textarea
                  rows={3}
                  value={highlightsText}
                  onChange={(e) => setHighlightsText(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#0A0F0D] px-3 py-2 text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingPkg}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#D4AF37] py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#0A0F0D] hover:bg-[#E7C660]"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{savingPkg ? "Saving..." : "Save Package"}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
