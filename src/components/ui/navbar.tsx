"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path ? "bg-primary/10 text-primary" : "text-foreground/60 hover:text-foreground/80 hover:bg-accent";
  };

  return (
    <div className="border-b">
      <div className="container flex h-16 items-center px-4">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">
              Survey Data Analyzer
            </span>
          </Link>
          <nav className="flex items-center space-x-4 lg:space-x-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors px-3 py-2 rounded-md ${isActive('/')}`}
            >
              Home
            </Link>
            <Link
              href="/branch-analysis"
              className={`text-sm font-medium transition-colors px-3 py-2 rounded-md ${isActive('/branch-analysis')}`}
            >
              Branch Analysis
            </Link>
            <Link
              href="/demo"
              className={`text-sm font-medium transition-colors px-3 py-2 rounded-md ${isActive('/demo')}`}
            >
              Demo
            </Link>
            <Link
              href="/ai-survey-demo"
              className={`text-sm font-medium transition-colors px-3 py-2 rounded-md ${isActive('/ai-survey-demo')}`}
            >
              AI Survey Demo
            </Link>
          </nav>
        </div>

        {/* Mobile navigation */}
        <div className="flex md:hidden">
          <Link href="/" className="mr-2">
            <span className="font-bold">Survey Data Analyzer</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end">
          <nav className="flex items-center">
            <div className="md:hidden flex space-x-2">
              <Link
                href="/"
                className={`text-sm font-medium transition-colors px-3 py-2 rounded-md ${isActive('/')}`}
              >
                Home
              </Link>
              <Link
                href="/branch-analysis"
                className={`text-sm font-medium transition-colors px-3 py-2 rounded-md ${isActive('/branch-analysis')}`}
              >
                Branch
              </Link>
              <Link
                href="/ai-survey-demo"
                className={`text-sm font-medium transition-colors px-3 py-2 rounded-md ${isActive('/ai-survey-demo')}`}
              >
                AI Demo
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
