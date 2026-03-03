import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Pago Pendiente",
};

export default function OrderPendingPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Clock className="w-10 h-10 text-amber-600" />
      </div>
      <h1 className="text-3xl font-bold text-neutral-900 mb-3">
        Pago pendiente
      </h1>
      <p className="text-neutral-500 text-lg mb-2">
        Tu pago está siendo procesado.
      </p>
      <p className="text-neutral-400 text-sm mb-8">
        Si pagaste por PSE o Efecty, puede tomar unos minutos en confirmarse.
        Te notificaremos por email cuando esté listo.
      </p>
      <Link href="/">
        <Button size="lg">
          Volver al inicio
          <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  );
}
