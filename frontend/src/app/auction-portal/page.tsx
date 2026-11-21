"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuctionPortalRoot() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/auction-portal/login");
  }, [router]);
  return (
    <div className="min-h-screen bg-[#111318] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#FF4B35] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
