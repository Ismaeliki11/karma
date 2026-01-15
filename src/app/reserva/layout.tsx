
import { BookingProvider } from '@/context/BookingContext';
import { Navbar } from '@/components/Navbar';

export default function BookingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <BookingProvider>
            <div className="min-h-screen bg-stone-50">
                <Navbar />
                <main className="container mx-auto max-w-3xl px-4 pt-24 pb-12 md:pt-32">
                    {children}
                </main>
            </div>
        </BookingProvider>
    );
}
