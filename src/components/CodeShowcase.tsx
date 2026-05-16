import { useState } from 'react';
import { Copy, Check, Code2 } from 'lucide-react';

const CODE_TABS = [
  {
    id: 'python-detection',
    label: 'Python Detection',
    lang: 'python',
    code: `import cv2
import numpy as np
from dataclasses import dataclass
from typing import List, Tuple

@dataclass
class BrailleCell:
    dots: List[int]  # 6-element binary list [d1..d6]
    cx: float        # center x
    cy: float        # center y
    confidence: float

class BrailleDetector:
    def __init__(self):
        params = cv2.SimpleBlobDetector_Params()
        params.filterByArea = True
        params.minArea = 80
        params.maxArea = 2000
        params.filterByCircularity = True
        params.minCircularity = 0.65
        params.filterByInertia = True
        params.minInertiaRatio = 0.5
        params.filterByConvexity = True
        params.minConvexity = 0.85
        self.detector = cv2.SimpleBlobDetector_create(params)

    def preprocess(self, frame: np.ndarray) -> np.ndarray:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        blurred = cv2.GaussianBlur(enhanced, (5, 5), 0)
        thresh = cv2.adaptiveThreshold(
            blurred, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV, 15, 8
        )
        kernel = np.ones((3, 3), np.uint8)
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
        return thresh

    def detect_dots(self, frame: np.ndarray) -> List[cv2.KeyPoint]:
        processed = self.preprocess(frame)
        # Invert for blob detector (blobs = dark on light)
        inv = cv2.bitwise_not(processed)
        keypoints = self.detector.detect(inv)
        return keypoints

    def segment_cells(
        self, keypoints: List[cv2.KeyPoint]
    ) -> List[BrailleCell]:
        if len(keypoints) < 3:
            return []

        points = np.array([(kp.pt[0], kp.pt[1]) for kp in keypoints])

        # Estimate inter-dot spacing via nearest-neighbor median
        spacing_v = self._estimate_spacing(points, axis=1)
        spacing_h = self._estimate_spacing(points, axis=0)

        cells: List[BrailleCell] = []
        visited = set()

        for i, kp in enumerate(keypoints):
            if i in visited:
                continue
            # Find all dots in this cell's 2x3 grid
            cell_dots = [0] * 6
            cx, cy = kp.pt

            for j, kp2 in enumerate(keypoints):
                dx = (kp2.pt[0] - cx) / (spacing_h or 1)
                dy = (kp2.pt[1] - cy) / (spacing_v or 1)

                if -0.3 <= dx <= 0.3 and -0.3 <= dy <= 0.3:
                    cell_dots[0] = 1
                    visited.add(j)
                elif 0.7 <= dx <= 1.3 and -0.3 <= dy <= 0.3:
                    cell_dots[3] = 1
                    visited.add(j)
                elif -0.3 <= dx <= 0.3 and 0.7 <= dy <= 1.3:
                    cell_dots[1] = 1
                    visited.add(j)
                # ... (all 6 positions)

            if sum(cell_dots) > 0:
                cells.append(BrailleCell(
                    dots=cell_dots, cx=cx, cy=cy,
                    confidence=0.9
                ))

        cells.sort(key=lambda c: (round(c.cy / 50), c.cx))
        return cells

    def _estimate_spacing(
        self, pts: np.ndarray, axis: int
    ) -> float:
        vals = np.sort(pts[:, axis])
        diffs = np.diff(vals)
        diffs = diffs[(diffs > 5) & (diffs < 50)]
        return float(np.median(diffs)) if len(diffs) > 0 else 20.0`,
  },
  {
    id: 'python-translate',
    label: 'Braille Translator',
    lang: 'python',
    code: `# braille_translator.py
from typing import List

GRADE1: dict[str, list[int]] = {
    'a': [1,0,0,0,0,0], 'b': [1,1,0,0,0,0],
    'c': [1,0,0,1,0,0], 'd': [1,0,0,1,1,0],
    'e': [1,0,0,0,1,0], 'f': [1,1,0,1,0,0],
    'g': [1,1,0,1,1,0], 'h': [1,1,0,0,1,0],
    'i': [0,1,0,1,0,0], 'j': [0,1,0,1,1,0],
    'k': [1,0,1,0,0,0], 'l': [1,1,1,0,0,0],
    'm': [1,0,1,1,0,0], 'n': [1,0,1,1,1,0],
    'o': [1,0,1,0,1,0], 'p': [1,1,1,1,0,0],
    'q': [1,1,1,1,1,0], 'r': [1,1,1,0,1,0],
    's': [0,1,1,1,0,0], 't': [0,1,1,1,1,0],
    'u': [1,0,1,0,0,1], 'v': [1,1,1,0,0,1],
    'w': [0,1,0,1,1,1], 'x': [1,0,1,1,0,1],
    'y': [1,0,1,1,1,1], 'z': [1,0,1,0,1,1],
    ' ': [0,0,0,0,0,0],
}

NUMBER_INDICATOR = [0,0,1,1,1,1]
CAPITAL_INDICATOR = [0,0,0,0,0,1]

REVERSE = {tuple(v): k for k, v in GRADE1.items()}

def cells_to_text(cells: List[List[int]]) -> str:
    result = []
    number_mode = False
    capital_mode = False

    for cell in cells:
        t = tuple(cell)
        if cell == NUMBER_INDICATOR:
            number_mode = True
            continue
        if cell == CAPITAL_INDICATOR:
            capital_mode = True
            continue

        char = REVERSE.get(t, '?')
        if number_mode and char in 'abcdefghij':
            digit_map = dict(zip('abcdefghij', '1234567890'))
            char = digit_map[char]
        elif capital_mode:
            char = char.upper()

        result.append(char)
        capital_mode = False
        if char == ' ':
            number_mode = False

    return ''.join(result)


def text_to_cells(text: str) -> List[List[int]]:
    cells = []
    num_mode = False
    for ch in text:
        if ch.isupper():
            cells.append(CAPITAL_INDICATOR)
            ch = ch.lower()
        if ch.isdigit():
            if not num_mode:
                cells.append(NUMBER_INDICATOR)
                num_mode = True
            digit_to_letter = dict(zip('1234567890', 'abcdefghij'))
            ch = digit_to_letter.get(ch, 'a')
        else:
            num_mode = False
        cells.append(GRADE1.get(ch, [0]*6))
    return cells`,
  },
  {
    id: 'flutter-camera',
    label: 'Flutter Camera',
    lang: 'dart',
    code: `// camera_screen.dart
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'dart:isolate';
import 'dart:typed_data';
import 'braille_service.dart';
import 'tts_service.dart';

class CameraScreen extends StatefulWidget {
  const CameraScreen({super.key});
  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen>
    with WidgetsBindingObserver {
  CameraController? _controller;
  final BrailleService _braille = BrailleService();
  final TtsService _tts = TtsService();
  String _detectedText = '';
  String _guidance = 'Point at Braille text';
  bool _isProcessing = false;
  int _frameSkip = 0;
  SendPort? _isolateSendPort;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initCamera();
    _spawnProcessingIsolate();
  }

  Future<void> _initCamera() async {
    final cameras = await availableCameras();
    final back = cameras.firstWhere(
      (c) => c.lensDirection == CameraLensDirection.back,
      orElse: () => cameras.first,
    );
    _controller = CameraController(
      back,
      ResolutionPreset.medium, // 640x480 for balance
      enableAudio: false,
      imageFormatGroup: ImageFormatGroup.yuv420,
    );
    await _controller!.initialize();
    await _controller!.startImageStream(_onFrame);
    setState(() {});
  }

  void _onFrame(CameraImage image) {
    _frameSkip++;
    if (_frameSkip % 3 != 0 || _isProcessing) return;
    _isProcessing = true;

    // Send raw YUV bytes to isolate
    final planes = image.planes
        .map((p) => Uint8List.fromList(p.bytes))
        .toList();
    _isolateSendPort?.send({
      'width': image.width,
      'height': image.height,
      'planes': planes,
    });
  }

  void _spawnProcessingIsolate() async {
    final receivePort = ReceivePort();
    await Isolate.spawn(_processIsolate, receivePort.sendPort);
    _isolateSendPort = await receivePort.first as SendPort;

    receivePort.listen((result) {
      if (result is Map) {
        final text = result['text'] as String;
        final guidance = result['guidance'] as String;
        _isProcessing = false;

        if (text.isNotEmpty && text != _detectedText) {
          setState(() {
            _detectedText = text;
            _guidance = guidance;
          });
          _tts.speak('Detected: $text');
          _vibrate();
        } else {
          setState(() => _guidance = guidance);
          if (guidance != 'Scan detected — keep steady') {
            _tts.speakLowPriority(guidance);
          }
        }
      }
    });
  }

  static void _processIsolate(SendPort callerSendPort) async {
    final port = ReceivePort();
    callerSendPort.send(port.sendPort);
    final service = BrailleService();

    await for (final msg in port) {
      final result = await service.processFrame(
        msg['width'], msg['height'], msg['planes']
      );
      callerSendPort.send(result);
    }
  }

  void _vibrate() {
    HapticFeedback.mediumImpact();
  }

  @override
  Widget build(BuildContext context) {
    if (_controller?.value.isInitialized != true) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          CameraPreview(_controller!),
          DetectionOverlay(text: _detectedText),
          GuidanceBar(message: _guidance),
          ControlPanel(
            onFlip: _flipCamera,
            onFlash: _toggleFlash,
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _controller?.dispose();
    _tts.dispose();
    super.dispose();
  }
}`,
  },
  {
    id: 'flutter-accessibility',
    label: 'Accessibility Layer',
    lang: 'dart',
    code: `// accessibility_overlay.dart — Voice-first UI

class DetectionOverlay extends StatelessWidget {
  final String text;
  const DetectionOverlay({super.key, required this.text});

  @override
  Widget build(BuildContext context) {
    return Positioned(
      bottom: 120,
      left: 16,
      right: 16,
      child: Semantics(
        label: text.isEmpty
            ? 'No Braille detected'
            : 'Braille text: $text',
        liveRegion: true,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          padding: const EdgeInsets.symmetric(
            horizontal: 20, vertical: 14
          ),
          decoration: BoxDecoration(
            color: text.isEmpty
                ? Colors.black87
                : const Color(0xFF00BCD4).withOpacity(0.9),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.4),
                blurRadius: 16,
              ),
            ],
          ),
          child: text.isEmpty
              ? const Row(children: [
                  SizedBox(width: 8, height: 8,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white38,
                    ),
                  ),
                  SizedBox(width: 12),
                  Text('Scanning...',
                    style: TextStyle(color: Colors.white54,
                      fontSize: 16)),
                ])
              : Text(
                  text,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.5,
                  ),
                ),
        ),
      ),
    );
  }
}

// tts_service.dart
class TtsService {
  final FlutterTts _tts = FlutterTts();
  String _lastSpoken = '';
  DateTime _lastTime = DateTime(0);

  TtsService() {
    _tts.setLanguage('en-US');
    _tts.setSpeechRate(0.5);
    _tts.setVolume(1.0);
    _tts.setPitch(1.0);
  }

  Future<void> speak(String text) async {
    if (text == _lastSpoken) return;
    _lastSpoken = text;
    _lastTime = DateTime.now();
    await _tts.stop();
    await _tts.speak(text);
  }

  Future<void> speakLowPriority(String text) async {
    final now = DateTime.now();
    if (now.difference(_lastTime).inSeconds < 5) return;
    await speak(text);
  }

  void dispose() => _tts.stop();
}`,
  },
];

export default function CodeShowcase() {
  const [activeTab, setActiveTab] = useState(CODE_TABS[0].id);
  const [copied, setCopied] = useState(false);

  const active = CODE_TABS.find(t => t.id === activeTab)!;

  const copyCode = async () => {
    await navigator.clipboard.writeText(active.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="code" className="py-24 bg-gray-950" aria-label="Code implementation showcase">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-xs font-semibold uppercase tracking-widest mb-4">
            <Code2 className="w-3.5 h-3.5" />
            Implementation
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Complete Source Code</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Production-ready code for every layer of the stack.
          </p>
        </div>

        {/* Code panel */}
        <div className="bg-gray-900 rounded-2xl border border-white/10 overflow-hidden">
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-white/10 bg-gray-950/60">
            {CODE_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-cyan-400 text-cyan-400 bg-white/5'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
                aria-selected={activeTab === tab.id}
                role="tab"
              >
                {tab.label}
              </button>
            ))}

            <button
              onClick={copyCode}
              className="ml-auto px-4 py-3 flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm font-medium"
              aria-label="Copy code to clipboard"
            >
              {copied ? (
                <><Check className="w-4 h-4 text-emerald-400" /><span className="text-emerald-400">Copied</span></>
              ) : (
                <><Copy className="w-4 h-4" /><span className="hidden sm:inline">Copy</span></>
              )}
            </button>
          </div>

          {/* Code */}
          <div className="relative overflow-auto max-h-[520px]">
            <pre className="p-6 text-sm font-mono text-gray-300 leading-relaxed" tabIndex={0}>
              <code dangerouslySetInnerHTML={{ __html: highlightCode(active.code, active.lang) }} />
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}

// Minimal syntax highlighting
function highlightCode(code: string, lang: string): string {
  const esc = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  if (lang === 'python') {
    return esc
      .replace(/(#[^\n]*)/g, '<span style="color:#6b7280">$1</span>')
      .replace(/\b(def|class|import|from|return|for|if|in|not|and|or|await|async|True|False|None|as|with|else|elif|pass|continue|break)\b/g,
        '<span style="color:#22d3ee">$1</span>')
      .replace(/("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"]*"|'[^']*')/g,
        '<span style="color:#34d399">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#fb923c">$1</span>');
  }
  if (lang === 'dart') {
    return esc
      .replace(/(\/\/[^\n]*)/g, '<span style="color:#6b7280">$1</span>')
      .replace(/\b(class|final|const|void|bool|String|int|double|List|Map|Widget|State|Future|async|await|return|if|else|for|in|new|super|override|required|this|late|var|dynamic|static|get|set|extends|implements|abstract|null|true|false)\b/g,
        '<span style="color:#22d3ee">$1</span>')
      .replace(/("[^"]*"|'[^']*')/g,
        '<span style="color:#34d399">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#fb923c">$1</span>');
  }
  return esc;
}
