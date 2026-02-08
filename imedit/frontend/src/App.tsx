import { useState, useCallback, useEffect, useRef } from 'react';
import { Upload } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Header from './components/Header';
import { Toast } from './components/Toast';
import type { Tool, EditorHandle } from './components/Editor';

function App() {
  const [tool, setTool] = useState<Tool>('brush');
  const [color, setColor] = useState('#ff0000');
  const [brushSize, setBrushSize] = useState(5);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [yoloCrop, setYoloCrop] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  const editorRef = useRef<EditorHandle>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
  }, []);

  const handleUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setImageUrl(url);
      }
    };
    input.click();
  }, []);

  const handleUrlLoad = useCallback(() => {
    const url = prompt('Enter image URL:');
    if (url) {
      setImageUrl(url);
    }
  }, []);

  const handleDownload = useCallback(() => {
    editorRef.current?.download();
  }, []);

  const handleClearDrawing = useCallback(() => {
    editorRef.current?.clear();
  }, []);

  // Stable callback for image load
  const handleImageLoad = useCallback((dim: { width: number; height: number }) => {
    console.log('Loaded:', dim);
  }, []);

  // Handle Paste & Copy shortcuts
  useEffect(() => {
    const handleEvents = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
          e.preventDefault();
          editorRef.current?.copyToClipboard();
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              const url = URL.createObjectURL(blob);
              setImageUrl(url);
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleEvents);
    window.addEventListener('paste', handlePaste);
    return () => {
        window.removeEventListener('keydown', handleEvents);
        window.removeEventListener('paste', handlePaste);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-900">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          tool={tool}
          setTool={setTool}
          color={color}
          setColor={setColor}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          onUploadClick={handleUpload}
          onUrlClick={handleUrlLoad}
          onDownloadClick={handleDownload}
          onClearDrawing={handleClearDrawing}
          yoloCrop={yoloCrop}
          setYoloCrop={setYoloCrop}
        />
        <main className="flex-1 relative bg-slate-200">
          {!imageUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 text-slate-400">
              <div className="w-20 h-20 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
                <Upload className="w-10 h-10 text-slate-300" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-500">Paste or drop an image here</p>
                <p className="text-sm">Or use the sidebar to open a file</p>
              </div>
            </div>
          ) : (
            <Editor 
              ref={editorRef}
              tool={tool}
              color={color}
              brushSize={brushSize}
              imageUrl={imageUrl}
              onImageLoad={handleImageLoad}
              yoloCrop={yoloCrop}
              onToast={showToast}
            />
          )}
        </main>
      </div>
      <Toast message={toastMsg} onClose={() => setToastMsg(null)} />
    </div>
  );
}

export default App;