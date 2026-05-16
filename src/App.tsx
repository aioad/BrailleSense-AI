import Navigation from './components/Navigation';
import Hero from './components/Hero';
import LiveDemo from './components/LiveDemo';
import BrailleDemo from './components/BrailleDemo';
import BrailleInputPad from './components/BrailleInputPad';
import ImageUpload from './components/ImageUpload';
import Architecture from './components/Architecture';
import CodeShowcase from './components/CodeShowcase';
import FolderStructure from './components/FolderStructure';
import Roadmap from './components/Roadmap';
import Pitch from './components/Pitch';
import ScanHistory from './components/ScanHistory';
import Settings from './components/Settings';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <a
        href="#demo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-cyan-500 focus:text-gray-950 focus:font-bold focus:rounded-xl"
      >
        Skip to live demo
      </a>

      <Navigation />
      <main id="main">
        <Hero />
        <LiveDemo />
        <BrailleDemo />
        <BrailleInputPad />
        <ImageUpload />
        <Architecture />
        <CodeShowcase />
        <FolderStructure />
        <Roadmap />
        <ScanHistory />
        <Settings />
        <Pitch />
      </main>
      <Footer />
    </div>
  );
}
