"use client"

import Link from "next/link"
import { Zap, Twitter, Github, Linkedin } from "lucide-react"

const footerLinks = {
  Product: ["Features", "Integrations", "Pricing", "Changelog"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Legal: ["Privacy", "Terms", "Security"],
}

export function Footer() {
  const date = new Date()
  return (
    <footer className="border-t border-border py-16 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              <span className="text-xl font-semibold text-foreground">EnergyPilot</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Intelligent energy monitoring for the modern age. Designed in Nigeria.
            </p>
            <Link href="#" className="inline-flex border rounded-2xl py-2 px-3 bg-secondary items-center gap-2 text-sm text-primary hover:underline">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              All systems operational
            </Link>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-foreground mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between mt-16 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">© {date.getFullYear()} EnergyPilot Inc.</p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Twitter className="h-5 w-5" />
              <span className="sr-only">Twitter</span>
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Linkedin className="h-5 w-5" />
              <span className="sr-only">LinkedIn</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
