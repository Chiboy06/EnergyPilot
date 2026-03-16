"use client"

import Link from "next/link"
import { Zap, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold text-foreground">EnergyPilot</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            How it works
          </Link>
          <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="/sign-in" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Log In
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/sign-up" className="hidden sm:block">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Start Free Trial
            </Button>
          </Link>

          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-6 mt-8 mx-3 px-4">
                <Link href="#features" className="text-lg text-foreground hover:text-primary transition-colors">
                  Features
                </Link>
                <Link href="#how-it-works" className="text-lg text-foreground hover:text-primary transition-colors">
                  How it works
                </Link>
                <Link href="#pricing" className="text-lg text-foreground hover:text-primary transition-colors">
                  Pricing
                </Link>
                <Link href="/sign-in" className="text-lg text-foreground hover:text-primary transition-colors">
                  Log In
                </Link>
                <Link href="/sign-up" className="mt-4">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    Start Free Trial
                  </Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
