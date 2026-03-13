"use client"

import Link from "next/link"
import { Zap } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding & Testimonial */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-background via-secondary/20 to-background relative overflow-hidden">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 relative z-10">
          <Zap className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold text-foreground">VoltSense</span>
        </Link>

        {/* Decorative background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/3 rounded-full blur-3xl" />
        </div>

        {/* Testimonial */}
        <div className="relative z-10 max-w-md">
          <blockquote className="text-2xl lg:text-3xl font-medium leading-relaxed text-foreground mb-8">
            &ldquo;VoltSense transformed how we manage energy across our 50 locations. The anomaly detection alone saved us $120k last year.&rdquo;
          </blockquote>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src="/placeholder-avatar.jpg" alt="Sarah Miller" />
              <AvatarFallback className="bg-secondary text-foreground">SM</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">Sarah Miller</p>
              <p className="text-sm text-muted-foreground">VP of Operations at TechSpace</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
