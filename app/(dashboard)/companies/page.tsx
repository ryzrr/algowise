import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCompaniesWithProgress } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CompanyLogo } from "@/components/company-logo";
import { avatarGradient, cn } from "@/lib/utils";

const COMPANY_DATA: Record<string, { domain: string; color: string }> = {
  amazon: { domain: "amazon.com", color: "#FF9900" },
  google: { domain: "google.com", color: "#4285F4" },
  facebook: { domain: "facebook.com", color: "#1877F2" },
  microsoft: { domain: "microsoft.com", color: "#00A4EF" },
  apple: { domain: "apple.com", color: "#FFFFFF" },
  bloomberg: { domain: "bloomberg.com", color: "#FF5100" },
  adobe: { domain: "adobe.com", color: "#FF0000" },
  uber: { domain: "uber.com", color: "#FFFFFF" },
  linkedin: { domain: "linkedin.com", color: "#0A66C2" },
  oracle: { domain: "oracle.com", color: "#F80000" },
  netflix: { domain: "netflix.com", color: "#E50914" },
  salesforce: { domain: "salesforce.com", color: "#00A1E0" },
  twitter: { domain: "twitter.com", color: "#1DA1F2" },
  yahoo: { domain: "yahoo.com", color: "#410093" },
  cisco: { domain: "cisco.com", color: "#1BA0D7" },
};

function getBrand(slug: string, name: string) {
  const data = COMPANY_DATA[slug.toLowerCase()];
  if (data) return { logo: `https://www.google.com/s2/favicons?domain=${data.domain}&sz=128`, color: data.color };
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return { logo: `https://www.google.com/s2/favicons?domain=${cleanName}.com&sz=128`, color: "#4f46e5" };
}

export default async function CompaniesPage() {
  const session = await auth();
  const companies = await getCompaniesWithProgress(session!.user!.id!);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <div className="duration-500 animate-in fade-in slide-in-from-bottom-2 fill-mode-both">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Companies</h1>
        <p className="text-sm text-muted-foreground">
          {companies.length} companies, sorted by question count.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {companies.map((c, i) => {
          const pct = c.problemCount > 0 ? (c.solved / c.problemCount) * 100 : 0;
          const done = pct >= 100;
          const brand = getBrand(c.slug, c.name);
          return (
            <Link
              key={c.slug}
              href={`/companies/${c.slug}`}
              className="duration-500 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
              style={{ animationDelay: `${Math.min(i * 30, 360)}ms` }}
            >
              <Card
                className={cn(
                  "group relative flex h-full flex-col gap-4 overflow-hidden p-5 transition-all hover:-translate-y-1 hover:ring-white/20 active:translate-y-0",
                  done ? "ring-primary/40 bg-card" : "bg-card/80"
                )}
              >
                {/* Soft gradient overlay */}
                <div 
                  className="absolute inset-0 opacity-[0.12] mix-blend-screen transition-opacity duration-500 group-hover:opacity-[0.22] pointer-events-none" 
                  style={{
                    background: `radial-gradient(120% 120% at 0% 0%, ${brand.color}, transparent 60%)`
                  }}
                />

                {/* Large watermark logo overlay */}
                <CompanyLogo 
                  src={brand.logo} 
                  alt="" 
                  hideFallback 
                  className="absolute -bottom-8 -right-8 z-0 size-40 object-contain opacity-[0.03] transition-all duration-700 group-hover:-translate-x-2 group-hover:-translate-y-2 group-hover:scale-110 group-hover:opacity-[0.07] pointer-events-none grayscale mix-blend-plus-lighter"
                />

                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white p-1.5 shadow-sm transition-transform duration-500 group-hover:scale-110 ring-1 ring-white/10">
                    <CompanyLogo src={brand.logo} alt={c.name} className="size-full object-contain" />
                  </div>
                  {c.solved > 0 && (
                    <span
                      className={cn(
                        "flex items-center gap-0.5 rounded-md px-2 py-0.5 font-mono text-xs font-semibold",
                        done ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                      )}
                    >
                      <ArrowUp className="size-3" />
                      {Math.round(pct)}%
                    </span>
                  )}
                </div>

                <div className="relative z-10">
                  <p className="truncate text-sm font-medium text-muted-foreground transition-colors group-hover:text-primary">
                    {c.name}
                  </p>
                  <div className="mt-0.5 flex items-baseline gap-1.5">
                    <span className="font-mono text-2xl font-bold tabular-nums">{c.solved}</span>
                    <span className="text-sm text-muted-foreground">/ {c.problemCount}</span>
                  </div>
                </div>

                <Progress value={pct} className="h-1.5" />
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
