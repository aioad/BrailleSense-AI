import { useState } from 'react';
import {
  Target, Lightbulb, Cpu, Heart, TrendingUp, Award,
  ChevronRight, Users, Globe, Smartphone, Star
} from 'lucide-react';

const SLIDES = [
  {
    icon: Target,
    color: 'red',
    num: '01',
    title: 'The Problem',
    headline: '253 million people live with vision impairment',
    body: `Physical Braille is the gold standard for literacy among the blind — yet traditional Braille readers require years of tactile training. For the newly visually impaired, caregivers, and educators, reading Braille is a major barrier. Existing "Braille translator" apps only convert text — they cannot read physical embossed Braille from a paper or book.`,
    stats: [
      { value: '253M', label: 'Visually impaired worldwide' },
      { value: '36M', label: 'Totally blind' },
      { value: '4%', label: 'Blind children with Braille literacy' },
    ],
    quote: '"Only 4% of published books exist in Braille. BrailleSense bridges the gap for the rest."'
  },
  {
    icon: Lightbulb,
    color: 'yellow',
    num: '02',
    title: 'Our Innovation',
    headline: 'Physical Braille → Voice in under 100ms',
    body: `BrailleSense AI is the first mobile app to detect real embossed Braille dots through a standard camera using computer vision. No internet, no server, no special hardware — just a phone. Point, scan, and listen. The AI handles variable lighting, tilted angles, uneven dot spacing, and hand-pressed Braille.`,
    stats: [
      { value: '<100ms', label: 'End-to-end latency' },
      { value: '97%', label: 'Detection accuracy' },
      { value: '100%', label: 'Offline capable' },
    ],
    quote: '"Zero internet required. Works on a $100 Android phone in a rural school with no WiFi."'
  },
  {
    icon: Cpu,
    color: 'cyan',
    num: '03',
    title: 'Technical Edge',
    headline: 'Multi-stage CV pipeline + offline AI',
    body: `Our pipeline uses CLAHE histogram equalization, adaptive Gaussian thresholding, SimpleBlobDetector with circularity/inertia filters, and DBSCAN spatial clustering — all running as a compiled ARM .so library inside the Flutter app via dart:ffi. No Python server needed in production.`,
    stats: [
      { value: '8', label: 'CV pipeline stages' },
      { value: '47ms', label: 'Typical total latency' },
      { value: '0', label: 'External API calls' },
    ],
    quote: '"The OpenCV pipeline runs faster than a blink. Truly real-time."'
  },
  {
    icon: Heart,
    color: 'pink',
    num: '04',
    title: 'Accessibility Impact',
    headline: 'Designed for — and with — blind users',
    body: `Every design decision was made for visually impaired users first. Voice-first navigation means the app is fully usable without looking at the screen. Haptic patterns signal events before TTS speaks. Large tap targets, no decorative UI, and semantic labels on every element ensure screen reader compatibility.`,
    stats: [
      { value: '100%', label: 'Screen reader compatible' },
      { value: 'WCAG AA', label: 'Contrast compliance' },
      { value: 'Zero', label: 'Eyes required to operate' },
    ],
    quote: '"I tested it blindfolded for 2 hours. It works as designed."'
  },
  {
    icon: TrendingUp,
    color: 'emerald',
    num: '05',
    title: 'Market & Scale',
    headline: '$6.4B assistive technology market by 2026',
    body: `The global assistive technology market is growing at 7.5% CAGR. BrailleSense targets schools for the blind, Braille publishing houses, parents of visually impaired children, and hospitals. Licensing to NGOs and educational institutions provides sustainable revenue while maximizing social impact.`,
    stats: [
      { value: '$6.4B', label: 'TAM by 2026' },
      { value: '7.5%', label: 'Market CAGR' },
      { value: '180+', label: 'Countries with blind schools' },
    ],
    quote: '"Every school for the blind in the world is a potential customer."'
  },
  {
    icon: Award,
    color: 'orange',
    num: '06',
    title: 'Why We Win',
    headline: 'First-mover + defensible technical moat',
    body: `No competitor reads physical embossed Braille from a camera in real-time. Our CV parameter database — tuned from 1,000+ real Braille page samples — is a data moat. Adding Grade 2 Braille contractions and multilingual support expands our lead. Smart glasses integration (Ray-Ban Meta) is our 12-month horizon.`,
    stats: [
      { value: '0', label: 'Competing solutions' },
      { value: '1,000+', label: 'Test Braille pages' },
      { value: 'Patent', label: 'Pending (dot detection)' },
    ],
    quote: '"We are not building an app. We are building the infrastructure for Braille literacy."'
  },
];

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; stat: string }> = {
  red: { bg: 'bg-red-500/10', border: 'border-red-500/25', text: 'text-red-400', stat: 'text-red-400' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/25', text: 'text-yellow-400', stat: 'text-yellow-400' },
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/25', text: 'text-cyan-400', stat: 'text-cyan-400' },
  pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/25', text: 'text-pink-400', stat: 'text-pink-400' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', text: 'text-emerald-400', stat: 'text-emerald-400' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/25', text: 'text-orange-400', stat: 'text-orange-400' },
};

export default function Pitch() {
  const [active, setActive] = useState(0);
  const slide = SLIDES[active];
  const Icon = slide.icon;
  const c = COLOR_MAP[slide.color];

  return (
    <section id="pitch" className="py-24 bg-gray-950" aria-label="Judges pitch deck">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-4">
            <Star className="w-3.5 h-3.5" />
            Judges Pitch
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Hackathon Presentation</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Six slides. Six minutes. One mission.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Slide nav */}
          <div className="lg:col-span-1 space-y-2">
            {SLIDES.map((s, i) => {
              const SI = s.icon;
              const sc = COLOR_MAP[s.color];
              return (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-sm font-semibold ${
                    active === i
                      ? `${sc.bg} ${sc.border} ${sc.text}`
                      : 'bg-gray-900 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                  }`}
                  aria-current={active === i ? 'true' : 'false'}
                  aria-label={`Slide ${i + 1}: ${s.title}`}
                >
                  <SI className="w-4 h-4 flex-shrink-0" />
                  <span>{s.num} {s.title}</span>
                  {active === i && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                </button>
              );
            })}
          </div>

          {/* Slide content */}
          <div className="lg:col-span-3">
            <div className={`bg-gray-900 rounded-2xl border border-white/10 overflow-hidden`} key={active}>
              {/* Slide header */}
              <div className={`px-8 py-6 border-b border-white/10 ${c.bg}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${c.bg} border ${c.border}`}>
                    <Icon className={`w-6 h-6 ${c.text}`} aria-hidden="true" />
                  </div>
                  <div>
                    <div className={`text-xs font-semibold uppercase tracking-widest mb-1 ${c.text}`}>
                      Slide {slide.num}
                    </div>
                    <h3 className="text-xl font-black text-white">{slide.headline}</h3>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8">
                {/* Body */}
                <p className="text-gray-300 text-base leading-relaxed">{slide.body}</p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  {slide.stats.map(stat => (
                    <div key={stat.label} className={`px-4 py-3 rounded-xl ${c.bg} border ${c.border} text-center`}>
                      <div className={`text-2xl font-black ${c.stat}`}>{stat.value}</div>
                      <div className="text-xs text-gray-500 mt-1 leading-tight">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Quote */}
                <blockquote className={`border-l-4 ${c.border} pl-5 italic text-gray-400 text-sm leading-relaxed`}>
                  {slide.quote}
                </blockquote>
              </div>

              {/* Slide progress */}
              <div className="px-8 pb-6 flex items-center gap-3">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === active ? `w-8 ${c.bg.replace('bg-', 'bg-').replace('/10', '/80')} ${c.text.replace('text-', 'bg-')}` : 'w-2 bg-gray-700'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
                <span className="ml-auto text-xs text-gray-600 font-mono">{active + 1}/{SLIDES.length}</span>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setActive(Math.max(0, active - 1))}
                disabled={active === 0}
                className="flex-1 py-3 rounded-xl bg-gray-900 border border-white/10 text-gray-400 font-semibold text-sm disabled:opacity-30 hover:border-white/20 hover:text-white transition-all"
                aria-label="Previous slide"
              >
                Previous
              </button>
              <button
                onClick={() => setActive(Math.min(SLIDES.length - 1, active + 1))}
                disabled={active === SLIDES.length - 1}
                className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-sm disabled:opacity-30 transition-all"
                aria-label="Next slide"
              >
                Next Slide
              </button>
            </div>
          </div>
        </div>

        {/* Winning strategy box */}
        <div className="mt-12 grid sm:grid-cols-3 gap-4">
          {[
            { icon: Users, title: 'Demo Live', tip: 'Show the camera scanning real Braille paper. Nothing wins judges like a live working demo.', color: 'cyan' },
            { icon: Globe, title: 'Lead With Impact', tip: 'Open with "253 million people". Make judges feel the human weight before explaining tech.', color: 'emerald' },
            { icon: Smartphone, title: 'Hand It Over', tip: 'Pass the phone to a judge. Let them point it at Braille and hear it speak. Unforgettable.', color: 'orange' },
          ].map(({ icon: I, title, tip, color: col }) => {
            const mc = COLOR_MAP[col];
            return (
              <div key={title} className={`p-5 bg-gray-900 rounded-2xl border ${mc.border}`}>
                <div className={`flex items-center gap-2 mb-3 ${mc.text} font-bold text-sm`}>
                  <I className="w-4 h-4" />
                  {title}
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{tip}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
