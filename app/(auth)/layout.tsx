import { EnergyPilotLogo } from "@/components/icons/EnergyPilotLogo";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#0f1419]">
      {/* Left Panel - Testimonial */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center p-16">
        <div className="relative z-10 w-full max-w-lg">
          <Link href="/" className="flex items-center gap-2 mb-32">
            <EnergyPilotLogo size={24} className="text-emerald-400" />
            <span className="text-xl font-bold text-white">EnergyPilot</span>
          </Link>

          <blockquote className="space-y-8">
            <p className="text-3xl font-bold text-white leading-tight">
              "EnergyPilot transformed how we manage energy across our 50
              locations. The anomaly detection alone saved us $120k last year."
            </p>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-slate-700" />
              <div>
                <div className="font-semibold text-white">Sarah Miller</div>
                <div className="text-sm text-slate-400">
                  VP of Operations at TechSpace
                </div>
              </div>
            </div>
          </blockquote>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 sm:p-12 relative bg-[#0f1419]">
        <div className="absolute top-8 left-8 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <EnergyPilotLogo size={20} className="text-emerald-400" />
            <span className="text-xl font-bold text-white">EnergyPilot</span>
          </Link>
        </div>

        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
