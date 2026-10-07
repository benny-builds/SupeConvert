import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { wailsBridge } from '../services/wails';
import {
  FolderOutput,
  Tag,
  Cpu,
  Folder,
  ChevronRight,
  ChevronDown,
  Sparkles,
  FileType,
  Search,
  Check
} from 'lucide-react';

const QUICK_FORMATS = [
  { id: 'jpg', name: 'JPEG', ext: '.jpg' },
  { id: 'png', name: 'PNG', ext: '.png' },
  { id: 'webp', name: 'WebP', ext: '.webp' },
  { id: 'bmp', name: 'BMP', ext: '.bmp' },
  { id: 'tiff', name: 'TIFF', ext: '.tiff' },
  { id: 'gif', name: 'GIF', ext: '.gif' },
  { id: 'ico', name: 'ICO', ext: '.ico' },
  { id: 'tga', name: 'TGA', ext: '.tga' },
];

const ALL_EXTENDED_FORMATS = [
  // Web & Standard
  { id: 'jpg', name: 'JPEG Image', ext: '.jpg' },
  { id: 'png', name: 'PNG Portable Network Graphics', ext: '.png' },
  { id: 'webp', name: 'WebP Image', ext: '.webp' },
  { id: 'bmp', name: 'BMP Bitmap', ext: '.bmp' },
  { id: 'tiff', name: 'TIFF Tagged Image Format', ext: '.tiff' },
  { id: 'gif', name: 'GIF Graphics Interchange Format', ext: '.gif' },
  { id: 'ico', name: 'ICO Windows Icon', ext: '.ico' },
  { id: 'tga', name: 'TGA Truevision Targa', ext: '.tga' },

  // Next-Gen & High-Efficiency
  { id: 'avif', name: 'AVIF AV1 Image File', ext: '.avif' },
  { id: 'heic', name: 'HEIC High Efficiency Image', ext: '.heic' },
  { id: 'heif', name: 'HEIF High Efficiency Format', ext: '.heif' },
  { id: 'jxl', name: 'JPEG XL Image', ext: '.jxl' },
  { id: 'qoi', name: 'QOI Quite OK Image', ext: '.qoi' },
  { id: 'flif', name: 'FLIF Free Lossless Image', ext: '.flif' },

  // Vector & Documents
  { id: 'pdf', name: 'PDF Portable Document Format', ext: '.pdf' },
  { id: 'svg', name: 'SVG Scalable Vector Graphics', ext: '.svg' },
  { id: 'eps', name: 'EPS Encapsulated PostScript', ext: '.eps' },
  { id: 'ps', name: 'PS PostScript Document', ext: '.ps' },
  { id: 'emf', name: 'EMF Enhanced Metafile', ext: '.emf' },
  { id: 'wmf', name: 'WMF Windows Metafile', ext: '.wmf' },

  // Professional & Game Textures
  { id: 'psd', name: 'PSD Adobe Photoshop', ext: '.psd' },
  { id: 'dds', name: 'DDS DirectDraw Surface', ext: '.dds' },
  { id: 'pcx', name: 'PCX ZSoft Paintbrush', ext: '.pcx' },
  { id: 'sgi', name: 'SGI Silicon Graphics Image', ext: '.sgi' },
  { id: 'exr', name: 'EXR OpenEXR High Dynamic Range', ext: '.exr' },
  { id: 'hdr', name: 'HDR Radiance RGBE', ext: '.hdr' },
  { id: 'dcm', name: 'DICOM Medical Image', ext: '.dcm' },
  { id: 'pcd', name: 'PCD Kodak Photo CD', ext: '.pcd' },
  { id: 'rla', name: 'RLA Alias/Wavefront', ext: '.rla' },
  { id: 'rle', name: 'RLE Utah Run-Length Encoded', ext: '.rle' },
  { id: 'sct', name: 'SCT Scitex Handshake', ext: '.sct' },
  { id: 'vtf', name: 'VTF Valve Texture Format', ext: '.vtf' },
  { id: 'sun', name: 'SUN Sun Rasterfile', ext: '.sun' },
  { id: 'ras', name: 'RAS Sun Raster', ext: '.ras' },

  // JPEG 2000 & Specialized
  { id: 'jp2', name: 'JP2 JPEG 2000 Part 1', ext: '.jp2' },
  { id: 'j2k', name: 'J2K JPEG 2000 Codestream', ext: '.j2k' },
  { id: 'jng', name: 'JNG JPEG Network Graphics', ext: '.jng' },
  { id: 'jpm', name: 'JPM JPEG 2000 Multi-layer', ext: '.jpm' },

  // Netpbm Family
  { id: 'ppm', name: 'PPM Portable Pixmap', ext: '.ppm' },
  { id: 'pgm', name: 'PGM Portable Graymap', ext: '.pgm' },
  { id: 'pbm', name: 'PBM Portable Bitmap', ext: '.pbm' },
  { id: 'pnm', name: 'PNM Portable Anymap', ext: '.pnm' },
  { id: 'pam', name: 'PAM Portable Arbitrary Map', ext: '.pam' },
  { id: 'pfm', name: 'PFM Portable Float Map', ext: '.pfm' },
  { id: 'phm', name: 'PHM Portable Half Float Map', ext: '.phm' },

  // Unix & Desktop Formats
  { id: 'xbm', name: 'XBM X BitMap', ext: '.xbm' },
  { id: 'xpm', name: 'XPM X PixMap', ext: '.xpm' },
  { id: 'xwd', name: 'XWD X Window Dump', ext: '.xwd' },
  { id: 'miff', name: 'MIFF ImageMagick Format', ext: '.miff' },
  { id: 'viff', name: 'VIFF Khoros Visualization', ext: '.viff' },
  { id: 'mtv', name: 'MTV Raytracer Image', ext: '.mtv' },
  { id: 'wbmp', name: 'WBMP Wireless Bitmap', ext: '.wbmp' },
  { id: 'yuv', name: 'YUV CCIR 601 Raw', ext: '.yuv' },

  // Cinema & Broadcast
  { id: 'cin', name: 'CIN Kodak Cineon Film', ext: '.cin' },
  { id: 'dpx', name: 'DPX Digital Picture Exchange', ext: '.dpx' },
  { id: 'mng', name: 'MNG Multiple-image Network Graphics', ext: '.mng' },
  { id: 'raw', name: 'RAW Raw Bayer Digital Image', ext: '.raw' },
  { id: 'palm', name: 'PALM Palm Pixmap', ext: '.palm' },
  { id: 'otb', name: 'OTB On-the-Air Bitmap', ext: '.otb' },
  { id: 'p7', name: 'P7 Xv Visual Image', ext: '.p7' },
  { id: 'pict', name: 'PICT Apple Macintosh QuickDraw', ext: '.pict' },

  // Specialized & Legacy Graphics
  { id: 'cut', name: 'CUT Dr. HALO Cutfile', ext: '.cut' },
  { id: 'g3', name: 'G3 Group 3 Fax', ext: '.g3' },
  { id: 'g4', name: 'G4 Group 4 Fax', ext: '.g4' },
  { id: 'farbfeld', name: 'Farbfeld Uncompressed Image', ext: '.farbfeld' },
  { id: 'hrz', name: 'HRZ Slow Scan TV', ext: '.hrz' },
  { id: 'mpo', name: 'MPO Multi-Picture Format 3D', ext: '.mpo' },
  { id: 'pcl', name: 'PCL Printer Command Language', ext: '.pcl' },
  { id: 'pix', name: 'PIX Alias Image', ext: '.pix' },
  { id: 'pwt', name: 'PWT PlayStation Texture', ext: '.pwt' },
  { id: 'scr', name: 'SCR ZX Spectrum Screen', ext: '.scr' },
  { id: 'tim', name: 'TIM PlayStation Graphics', ext: '.tim' },
  { id: 'vda', name: 'VDA Truevision Image', ext: '.vda' },
  { id: 'vst', name: 'VST Truevision Video', ext: '.vst' },
  { id: 'xcf', name: 'XCF GIMP Image', ext: '.xcf' },
];

export const OutputSettings: React.FC = () => {
  const {
    outputDir,
    setOutputDir,
    targetFormat,
    setTargetFormat,
    quality,
    setQuality,
    namingPattern,
    setNamingPattern,
    workers,
    setWorkers,
    files,
  } = useAppStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOutputDir = async () => {
    const dir = await wailsBridge.selectFolder();
    if (dir) {
      setOutputDir(dir);
    }
  };

  const insertToken = (token: string) => {
    setNamingPattern(namingPattern + token);
  };

  const sampleFileName = files[0] ? files[0].split(/[\\/]/).pop()?.replace(/\.[^/.]+$/, '') || 'photo_001' : 'sample';
  const livePreviewName = namingPattern
    .replace('{name}', sampleFileName)
    .replace('{w}', '1920')
    .replace('{h}', '1080')
    .replace('{index}', '1')
    .replace('{ext}', targetFormat);

  const selectedFormatObj = ALL_EXTENDED_FORMATS.find((f) => f.id === targetFormat) || {
    id: targetFormat,
    name: targetFormat.toUpperCase(),
    ext: `.${targetFormat}`,
  };

  const filteredFormats = ALL_EXTENDED_FORMATS.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.ext.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderFolderBreadcrumbs = () => {
    if (!outputDir) return <span className="text-muted-foreground italic">No folder selected</span>;
    const parts = outputDir.split(/[\\/]/).filter(Boolean);

    return (
      <div className="flex items-center flex-wrap gap-1 font-mono text-xs text-foreground">
        <Folder className="w-3.5 h-3.5 text-foreground flex-shrink-0" />
        {parts.map((p, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
            <span className={`px-1.5 py-0.5 rounded ${i === parts.length - 1 ? 'bg-muted text-foreground font-semibold' : 'bg-muted text-muted-foreground'}`}>
              {p}
            </span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground border border-border rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border bg-muted/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOutput className="w-4 h-4 text-foreground" />
          <h2 className="font-semibold text-xs text-foreground">Output Settings</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* Destination Folder */}
        <div className="bg-muted/30 border border-border rounded-md p-3 space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-xs text-foreground flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-foreground" /> Destination Folder
            </label>
            <button
              onClick={handleSelectOutputDir}
              className="shadcn-btn-primary h-7 px-3 text-xs font-semibold"
            >
              {outputDir ? 'Change' : 'Select'}
            </button>
          </div>
          <div className="p-2 rounded-md bg-background border border-border overflow-x-auto">
            {renderFolderBreadcrumbs()}
          </div>
        </div>

        {/* Target Format Custom Selector */}
        <div className="bg-muted/30 border border-border rounded-md p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-xs text-foreground flex items-center gap-1.5">
              <FileType className="w-3.5 h-3.5 text-foreground" /> Target Format
            </label>
            <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-mono font-medium text-muted-foreground border border-border/80">
              {ALL_EXTENDED_FORMATS.length}+ Formats
            </span>
          </div>

          {/* Custom Searchable Dropdown Trigger */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-background border border-border hover:border-primary/50 text-foreground rounded-md px-3 py-2 text-xs flex items-center justify-between shadow-xs transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2 truncate font-mono">
                <span className="px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold">
                  {selectedFormatObj.ext.toUpperCase()}
                </span>
                <span className="font-semibold text-foreground truncate">{selectedFormatObj.name}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-transform duration-200 flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Custom Dropdown Popover */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-popover text-popover-foreground border border-border rounded-lg shadow-xl p-2 space-y-2 max-h-64 overflow-hidden flex flex-col animate-in fade-in-50 slide-in-from-top-1">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={`Search ${ALL_EXTENDED_FORMATS.length}+ formats...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-md bg-muted/60 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary font-mono text-foreground"
                    autoFocus
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
                  {filteredFormats.length > 0 ? (
                    filteredFormats.map((fmt) => {
                      const isSelected = targetFormat === fmt.id;
                      return (
                        <div
                          key={fmt.id}
                          onClick={() => {
                            setTargetFormat(fmt.id);
                            setIsDropdownOpen(false);
                            setSearchQuery('');
                          }}
                          className={`flex items-center justify-between p-2 rounded-md text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-primary text-primary-foreground font-semibold'
                              : 'hover:bg-muted text-foreground'
                          }`}
                        >
                          <span className="truncate">{fmt.name}</span>
                          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                            <span className="font-mono text-[10px] opacity-80">{fmt.ext}</span>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center text-xs text-muted-foreground italic">
                      No formats match "{searchQuery}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Preset Buttons (4x2 Grid) */}
          <div className="grid grid-cols-4 gap-1 pt-1">
            {QUICK_FORMATS.map((fmt) => {
              const isSelected = targetFormat === fmt.id;
              return (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setTargetFormat(fmt.id)}
                  className={`py-1.5 px-1 rounded-md border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-xs'
                      : 'bg-background border-border hover:bg-muted text-muted-foreground hover:text-foreground font-medium'
                  }`}
                >
                  <div className="text-[11px] font-bold leading-tight">{fmt.name}</div>
                  <div className="text-[9px] font-mono opacity-85 leading-tight">{fmt.ext}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quality Slider */}
        {(targetFormat === 'jpg' || targetFormat === 'webp') && (
          <div className="bg-muted/30 border border-border rounded-md p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-xs text-foreground">
                Quality ({quality}%)
              </label>
              <span className="text-xs font-mono text-foreground font-bold">{quality}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        )}

        {/* Naming Pattern Builder */}
        <div className="bg-muted/30 border border-border rounded-md p-3 space-y-2.5">
          <label className="font-semibold text-xs text-foreground flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-foreground" /> Filename Pattern
          </label>

          <input
            type="text"
            value={namingPattern}
            onChange={(e) => setNamingPattern(e.target.value)}
            className="w-full px-2.5 py-1 rounded-md bg-background border border-input font-mono text-xs text-foreground"
          />

          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] text-muted-foreground mr-1">Chips:</span>
            {['{name}', '{w}', '{h}', '{index}', '{ext}'].map((tok) => (
              <button
                key={tok}
                onClick={() => insertToken(tok)}
                className="px-1.5 py-0.5 rounded-md bg-background hover:bg-muted text-muted-foreground hover:text-foreground border border-border text-[11px] font-mono transition-colors"
              >
                {tok}
              </button>
            ))}
          </div>

          <div className="p-2 rounded-md bg-background border border-border font-mono text-xs flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-foreground flex-shrink-0" />
            <span className="text-primary font-semibold truncate">{livePreviewName}</span>
          </div>
        </div>

        {/* Threads Slider */}
        <div className="bg-muted/30 border border-border rounded-md p-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-xs text-foreground flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-foreground" /> Parallel Worker Threads
            </label>
            <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground font-mono text-xs font-bold">
              {workers} {workers === 1 ? 'Thread' : 'Threads'}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="16"
            value={workers}
            onChange={(e) => setWorkers(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
      </div>
    </div>
  );
};
