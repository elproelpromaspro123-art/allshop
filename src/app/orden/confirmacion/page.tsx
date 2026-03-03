import Link from "next/link";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Pedido Confirmado",
};

export default function OrderConfirmationPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      </div>
      <h1 className="text-3xl font-bold text-neutral-900 mb-3">
        Pedido confirmado
      </h1>
      <p className="text-neutral-500 text-lg mb-2">
        Tu pago fue procesado exitosamente.
      </p>
      <p className="text-neutral-400 text-sm mb-8">
        Recibirás un email con los detalles de tu pedido y el número de seguimiento.
      </p>

      <div className="bg-neutral-50 rounded-2xl p-6 mb-8 text-left">
        <div className="flex items-center gap-3 mb-3">
          <Package className="w-5 h-5 text-neutral-600" />
          <span className="text-sm font-semibold text-neutral-900">Próximos pasos</span>
        </div>
        <ul className="space-y-2 text-sm text-neutral-600">
          <li>1. Confirmaremos tu pedido por email en minutos.</li>
          <li>2. Prepararemos y despacharemos tu paquete.</li>
          <li>3. Recibirás un código de seguimiento para rastrear tu envío.</li>
        </ul>
      </div>

      <Link href="/">
        <Button size="lg">
          Seguir comprando
          <ArrowRight className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  );
}
