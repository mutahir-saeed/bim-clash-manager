import { useState, useRef, useCallback } from "react";
import { Upload, Building2, Play } from "lucide-react";

export default function UploadZone({ onFileLoad, onLoadDemo, loading }) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = useCallback(
    (file) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => onFileLoad(e.target.result);
      reader.readAsText(file);
    },
    [onFileLoad]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleInputChange = (e) => {
    handleFile(e.target.files[0]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="text-center max-w-lg w-full animate-enter">
        {/* Animated 3D-ish building icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
          <Building2 className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">BIM Clash Manager</h1>
        <p className="text-sm text-slate-500 mb-8">
          Upload your Navisworks XML clash report to start analyzing
        </p>
        
        {/* Drop zone with dashed border animation */}
        <div
          className={`border-2 border-dashed rounded-xl p-10 transition-all cursor-pointer group ${
            dragOver ? "border-blue-500 bg-blue-100/50" : "border-blue-200 hover:border-blue-400 hover:bg-blue-50/50 bg-white"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xml"
            onChange={handleInputChange}
            className="hidden"
          />

          {loading ? (
            <div className="flex flex-col items-center gap-4 animate-enter">
              <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-slate-700">
                Parsing BIM data...
              </p>
            </div>
          ) : (
            <div className="animate-enter">
              <Upload className="w-8 h-8 text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-semibold text-slate-700">Drop XML file here</p>
              <p className="text-xs text-slate-400 mt-1">or click to browse</p>
            </div>
          )}
        </div>
        
        {/* Demo Button */}
        {!loading && (
          <div className="mt-6 animate-enter">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLoadDemo();
              }}
              className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors btn-press"
            >
              <Play className="w-3.5 h-3.5" />
              Or load demo data &rarr;
            </button>
          </div>
        )}
        
        {/* Feature pills */}
        {!loading && (
          <div className="flex flex-wrap justify-center gap-2 mt-10 animate-enter" style={{ animationDelay: "150ms" }}>
            {['Smart Grouping', 'BCF Export', '3D Viewer', 'AI Relevance'].map((f, i) => (
              <span key={i} className="text-[0.65rem] font-semibold px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-500 shadow-sm">
                {f}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
