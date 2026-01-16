
"use client";

import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { Hours } from "@/components/Hours";
import { ReviewsSection } from "@/components/ReviewsSection";
import { Footer } from "@/components/Footer";
import { useRouter } from "next/navigation";

import { NoticeBanner } from "@/components/NoticeBanner";

export default function Home() {
  const router = useRouter();

  const handleBook = () => {
    router.push('/reserva');
  };

  return (
    <main className="min-h-screen bg-white">
      <NoticeBanner />
      <Navbar onBook={handleBook} />
      <div className="pt-32 pb-12 text-center">
        <h1 className="text-2xl font-bold">Debug Mode</h1>
        <p>Testing components...</p>
      </div>
      {/* <Hero onBook={handleBook} /> */}
      {/* <Services /> */}
      {/* <Hours /> */}
      {/* <ReviewsSection /> */}
      <Footer />
    </main>
  );
}
