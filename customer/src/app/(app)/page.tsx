'use client'

import { LoadingState } from "@/components/Base";
import { HomeContent } from "@/components/pages/home/HomeContent";
import { Suspense, useEffect } from "react";

export default function Home() {
  useEffect(() => {
    document.title = 'Home'
  }, [])
  return (
    <Suspense fallback={<LoadingState message="Loading home page..." />}>
      <HomeContent />
    </Suspense>
  )
}