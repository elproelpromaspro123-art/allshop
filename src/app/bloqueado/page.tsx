import { getServerT } from "@/lib/i18n";

export default async function BlockedPage() {
    const t = await getServerT();

    return (
        <div className="flex items-center justify-center min-h-screen bg-[var(--background)] px-5">
            <div className="bg-[var(--surface)] text-[var(--foreground)] rounded-[var(--card-radius)] p-12 max-w-md text-center border border-[var(--border)] shadow-[var(--shadow-elevated)]">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6 text-2xl font-black text-red-600">
                    !
                </div>
                <h1 className="text-2xl font-extrabold mb-3 text-[var(--foreground)]">
                    {t("blocked.title")}
                </h1>
                <p className="text-[var(--muted)] leading-relaxed text-sm mb-6">
                    {t("blocked.subtitle")}
                </p>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-800 leading-relaxed">
                    {t("blocked.note")}
                </div>
            </div>
        </div>
    );
}
