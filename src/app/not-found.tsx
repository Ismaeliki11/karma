import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-white text-center px-4">
            <h1 className="text-9xl font-bold text-gray-200 select-none">404</h1>
            <div className="absolute flex flex-col items-center gap-4">
                <h2 className="text-2xl font-semibold text-gray-900">Página no encontrada</h2>
                <p className="text-gray-500 max-w-md">
                    Lo sentimos, la página que estás buscando no existe o ha sido movida.
                </p>
                <Link href="/">
                    <Button className="bg-black text-white hover:bg-gray-800 transition-colors">
                        Volver al Inicio
                    </Button>
                </Link>
            </div>
        </div>
    );
}
