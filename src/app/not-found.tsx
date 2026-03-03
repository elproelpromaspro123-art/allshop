import Link from "next/link";
import { SearchX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getServerT } from "@/lib/i18n";

export default async function NotFound() {
  const t = await getServerT();

  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <SearchX className="w-10 h-10 text-neutral-400" />
      </div>
      <h1 className="text-3xl font-bold text-neutral-900 mb-3">
        {t("notFound.title")}
      </h1>
      <p className="text-neutral-500 text-lg mb-8">
        {t("notFound.subtitle")}
      </p>
      <Link href="/">
        <Button size="lg">
          <ArrowLeft className="w-4 h-4" />
          {t("notFound.backHome")}
        </Button>
      </Link>
    </div>
  );
}
