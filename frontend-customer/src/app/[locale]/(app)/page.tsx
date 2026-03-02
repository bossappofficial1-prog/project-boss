export const metadata: Metadata = {
  title: 'Home'
}

import { LoadingState } from "@/components/Base";
import { HomeContent } from "@/components/pages/home/HomeContent";
import { Metadata } from "next";
import { Suspense } from "react";

export default function Home() {
  return (
    <Suspense fallback={<LoadingState message="Loading home page..." />}>
      <HomeContent />
    </Suspense>
  )
}