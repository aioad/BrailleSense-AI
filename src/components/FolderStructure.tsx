import { useState } from 'react';
import { Folder, FolderOpen, FileText, GitBranch } from 'lucide-react';

interface TreeNode {
  name: string;
  type: 'file' | 'dir';
  desc?: string;
  children?: TreeNode[];
}

const TREE: TreeNode[] = [
  {
    name: 'braillesense_ai/', type: 'dir', desc: 'Root',
    children: [
      {
        name: 'flutter_app/', type: 'dir', desc: 'Flutter frontend',
        children: [
          {
            name: 'lib/', type: 'dir',
            children: [
              { name: 'main.dart', type: 'file', desc: 'Entry point, theme, routes' },
              {
                name: 'screens/', type: 'dir',
                children: [
                  { name: 'camera_screen.dart', type: 'file', desc: 'Main camera UI' },
                  { name: 'onboarding_screen.dart', type: 'file', desc: 'First-run guide' },
                  { name: 'settings_screen.dart', type: 'file', desc: 'Voice rate, language' },
                ]
              },
              {
                name: 'widgets/', type: 'dir',
                children: [
                  { name: 'detection_overlay.dart', type: 'file', desc: 'Canvas overlay + dot markers' },
                  { name: 'guidance_bar.dart', type: 'file', desc: 'Smart camera guidance' },
                  { name: 'braille_cell_display.dart', type: 'file', desc: 'Visualize detected cells' },
                  { name: 'control_panel.dart', type: 'file', desc: 'Buttons: flash, flip, TTS' },
                ]
              },
              {
                name: 'services/', type: 'dir',
                children: [
                  { name: 'braille_service.dart', type: 'file', desc: 'FFI bridge to Python .so' },
                  { name: 'tts_service.dart', type: 'file', desc: 'flutter_tts wrapper' },
                  { name: 'haptic_service.dart', type: 'file', desc: 'Vibration patterns' },
                  { name: 'camera_service.dart', type: 'file', desc: 'CameraController wrapper' },
                ]
              },
              {
                name: 'models/', type: 'dir',
                children: [
                  { name: 'detection_result.dart', type: 'file', desc: 'Data class for results' },
                  { name: 'braille_cell.dart', type: 'file', desc: 'Cell model' },
                ]
              },
              {
                name: 'utils/', type: 'dir',
                children: [
                  { name: 'frame_utils.dart', type: 'file', desc: 'YUV→bytes helpers' },
                  { name: 'blur_detector.dart', type: 'file', desc: 'Laplacian variance' },
                ]
              },
            ]
          },
          { name: 'android/', type: 'dir', desc: 'Android platform + .so placement' },
          { name: 'ios/', type: 'dir', desc: 'iOS platform + dylib placement' },
          { name: 'pubspec.yaml', type: 'file', desc: 'Dependencies: camera, flutter_tts, vibration' },
        ]
      },
      {
        name: 'python_backend/', type: 'dir', desc: 'CV + translation engine',
        children: [
          { name: 'main.py', type: 'file', desc: 'FastAPI app (dev mode) / FFI entry (prod)' },
          { name: 'braille_detector.py', type: 'file', desc: 'OpenCV dot detection pipeline' },
          { name: 'cell_segmenter.py', type: 'file', desc: 'DBSCAN + grid assignment' },
          { name: 'braille_translator.py', type: 'file', desc: 'Grade 1 lookup table + logic' },
          { name: 'frame_quality.py', type: 'file', desc: 'Blur / brightness / tilt checks' },
          { name: 'perspective_corrector.py', type: 'file', desc: 'Hough line tilt correction' },
          {
            name: 'tests/', type: 'dir',
            children: [
              { name: 'test_detector.py', type: 'file', desc: 'Unit tests: blob detection' },
              { name: 'test_segmenter.py', type: 'file', desc: 'Unit tests: cell grouping' },
              { name: 'test_translator.py', type: 'file', desc: 'Unit tests: all 26 chars' },
              { name: 'test_pipeline.py', type: 'file', desc: 'Integration test: full pipeline' },
            ]
          },
          { name: 'requirements.txt', type: 'file', desc: 'opencv-python numpy scipy' },
          { name: 'build_so.sh', type: 'file', desc: 'Compiles to ARM .so for Flutter FFI' },
        ]
      },
      {
        name: 'assets/', type: 'dir',
        children: [
          { name: 'braille_grade1.json', type: 'file', desc: 'Full Grade 1 lookup table' },
          { name: 'detector_params.json', type: 'file', desc: 'Tuned blob detector params' },
          { name: 'test_images/', type: 'dir', desc: '50+ sample Braille images' },
        ]
      },
      { name: 'README.md', type: 'file', desc: 'Full setup + architecture docs' },
      { name: 'CONTRIBUTING.md', type: 'file', desc: 'Dev setup guide' },
    ]
  }
];

function TreeNodeView({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 2);
  const isDir = node.type === 'dir';

  return (
    <div style={{ paddingLeft: depth > 0 ? 20 : 0 }}>
      <div
        className={`flex items-center gap-2 py-1 px-2 rounded-lg text-sm cursor-pointer group transition-colors ${
          isDir ? 'hover:bg-white/5' : 'hover:bg-white/3'
        }`}
        onClick={() => isDir && setOpen(!open)}
        role={isDir ? 'button' : undefined}
        aria-expanded={isDir ? open : undefined}
      >
        {isDir ? (
          open ? (
            <FolderOpen className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-cyan-500/70 flex-shrink-0" />
          )
        ) : (
          <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
        )}
        <span className={`font-mono ${isDir ? 'text-cyan-300 font-semibold' : 'text-gray-300'}`}>
          {node.name}
        </span>
        {node.desc && (
          <span className="text-gray-600 text-xs ml-1 hidden sm:inline">// {node.desc}</span>
        )}
      </div>
      {isDir && open && node.children && (
        <div className="border-l border-white/5 ml-2">
          {node.children.map(child => (
            <TreeNodeView key={child.name} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FolderStructure() {
  return (
    <section id="structure" className="py-24 bg-gray-900" aria-label="Project folder structure">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-4">
            <GitBranch className="w-3.5 h-3.5" />
            Project Structure
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Professional Folder Layout</h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">Click folders to expand. Every file has a purpose.</p>
        </div>

        <div className="bg-gray-950 rounded-2xl border border-white/10 p-6 font-mono text-sm overflow-x-auto">
          {TREE.map(node => (
            <TreeNodeView key={node.name} node={node} depth={0} />
          ))}
        </div>
      </div>
    </section>
  );
}
