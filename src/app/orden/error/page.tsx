import Link from "next/link";
import { XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Error en el Pago",
};

export default function OrderErrorPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <XCircle className="w-10 h-10 text-red-600" />
      </div>
      <h1 className="text-3xl font-bold text-neutral-900 mb-3">
        Error en el pago
      </h1>
      <p className="text-neutral-500 text-lg mb-8">
        No pudimos procesar tu pago. No se realizó ningún cargo a tu cuenta.
        Por favor intenta nuevamente.
      </p>
      <Link href="/checkout">
        <Button size="lg">
          <ArrowLeft className="w-4 h-4" />
          Volver al checkout
        </Button>
      </Link>
    </div>
  );
}
