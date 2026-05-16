import { useState, useEffect } from 'react';
import { Eye, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Live Demo', href: '#demo' },
  { label: 'Braille Demo', href: '#braille-demo' },
  { label: 'Input Pad', href: '#input-pad' },
  { label: 'Upload', href: '#upload' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'History', href: '#history' },
  { label: 'Settings', href: '#settings' },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-gray-950/95 backdrop-blur-md shadow-lg shadow-black/30' : 'bg-transparent'
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group" aria-label="BrailleSense AI home">
            <div className="w-9 h-9 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:scale-105 transition-transform">
              <Eye className="w-5 h-5 text-gray-950" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">
              Braille<span className="text-cyan-400">Sense</span>
              <span className="text-gray-400 font-normal text-sm ml-1">AI</span>
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-150 font-medium"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="#demo"
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold text-sm rounded-xl transition-all duration-150 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/35 hover:scale-105 active:scale-95"
              aria-label="Try live demo"
            >
              Try Demo
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          open ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-gray-950/98 backdrop-blur-md px-4 pb-4 pt-2 space-y-1 border-t border-white/5">
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#demo"
            onClick={() => setOpen(false)}
            className="block mt-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-semibold text-sm rounded-xl text-center transition-all"
          >
            Try Demo
          </a>
        </div>
      </div>
    </nav>
  );
}
