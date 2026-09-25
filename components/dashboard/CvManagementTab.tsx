/**
 * File: /components/dashboard/CvManagementTab.tsx
 * Purpose: Secure dashboard system administration CV/Resume file repository and upload control panel.
 * Designed specifically for SRE Owners & Admins to safely manage public CV assets stored in Vercel Blob.
 */

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  FileText, Upload, Trash2, Check, Copy, RefreshCw, 
  AlertTriangle, ExternalLink, ShieldCheck, FileDown, CheckCircle, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CvMetadata } from '../../types';

export const CvManagementTab: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState<'en' | 'fr'>('en');
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [metadata, setMetadata] = useState<{ en: CvMetadata | null; fr: CvMetadata | null }>({ en: null, fr: null });
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCvMetadata = async () => {
    setIsLoadingMeta(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/cv/metadata');
      if (res.ok) {
        const data = await res.json();
        setMetadata({
          en: data.en || null,
          fr: data.fr || null
        });
      } else {
        setErrorMsg('Failed to sync CV metadata pipeline.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error occurred querying CV registry.');
    } finally {
      setIsLoadingMeta(false);
    }
  };

  useEffect(() => {
    fetchCvMetadata();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      setErrorMsg('Security Block: Invalid file type. Only standard PDF files are authorized for upload.');
      setFile(null);
      return;
    }
    // Limit to 10MB
    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMsg('Payload Block: File size exceeds the authorized 10MB transmission threshold.');
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Action Block: Please choose or drop a PDF file first.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      if (!token) {
        setErrorMsg('Authentication Block: Session expired. Re-authenticate.');
        setIsUploading(false);
        return;
      }

      setUploadProgress(40);

      const formData = new FormData();
      formData.append('cvFile', file);
      formData.append('language', selectedLang);

      setUploadProgress(65);

      const res = await fetch('/api/admin/cv/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      setUploadProgress(85);

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(data.message || `CV for ${selectedLang === 'en' ? 'English' : 'French'} successfully deployed.`);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        // Refresh local cache-state
        await fetchCvMetadata();
      } else {
        setErrorMsg(data.error || 'The CV deployment pipeline encountered an error.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Terminal error establishing CV connection.');
    } finally {
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 400);
    }
  };

  const handleDelete = async (lang: 'en' | 'fr') => {
    if (!window.confirm(`Warning: Are you sure you want to securely purge the custom CV file for ${lang === 'en' ? 'English' : 'French'}? It will fallback to the default file.`)) {
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;
      if (!token) {
        setErrorMsg('Authentication Block: Missing credentials.');
        return;
      }

      const res = await fetch(`/api/admin/cv/${lang}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'Asset purged and metadata reset to defaults.');
        await fetchCvMetadata();
      } else {
        setErrorMsg(data.error || 'Failed to execute secure purge on blob asset.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Fatal error clearing asset.');
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const activeMeta = selectedLang === 'en' ? metadata.en : metadata.fr;

  return (
    <div className="space-y-6 text-left" id="cv-management-panel">
      
      {/* Overview Block */}
      <div className="bg-[#101214] border border-[#1F2225] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <FileText size={180} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-[#26F0C4]/10 rounded-xl">
              <ShieldCheck className="text-[#26F0C4]" size={20} />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">Vercel Storage & CV Repository</h2>
          </div>
          <p className="text-sm text-zinc-400 max-w-3xl leading-relaxed">
            Manage your dynamic, high-security resumes safely. Choose a language channel, calculate cryptographic SHA-256 hashes automatically upon upload, and deploy assets directly to production Vercel Blob containers with instantaneous cache-busting logic.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Upload Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#101214] border border-[#1F2225] rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-5 flex items-center gap-2">
              <Upload size={16} className="text-[#26F0C4]" />
              CV Telemetry Upload Engine
            </h3>

            <form onSubmit={handleUpload} className="space-y-5">
              
              {/* Language Selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2.5">
                  Select Language Target
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setSelectedLang('en'); setSuccessMsg(null); setErrorMsg(null); }}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-xs border transition-all duration-150 ${
                      selectedLang === 'en'
                        ? 'bg-[#26F0C4]/10 border-[#26F0C4] text-white shadow-lg shadow-[#26F0C4]/5'
                        : 'bg-transparent border-[#1F2225] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <span>🇬🇧 English Channel</span>
                    {selectedLang === 'en' && <Check size={14} className="text-[#26F0C4]" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedLang('fr'); setSuccessMsg(null); setErrorMsg(null); }}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-xs border transition-all duration-150 ${
                      selectedLang === 'fr'
                        ? 'bg-[#26F0C4]/10 border-[#26F0C4] text-white shadow-lg shadow-[#26F0C4]/5'
                        : 'bg-transparent border-[#1F2225] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <span>🇫🇷 French Channel</span>
                    {selectedLang === 'fr' && <Check size={14} className="text-[#26F0C4]" />}
                  </button>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2.5">
                  PDF Binary Source
                </label>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[200px] ${
                    isDragActive
                      ? 'border-[#26F0C4] bg-[#26F0C4]/5 text-white scale-[0.99]'
                      : file
                        ? 'border-zinc-700 bg-zinc-900/40 text-zinc-300'
                        : 'border-[#1F2225] hover:border-zinc-700 text-zinc-400 hover:bg-zinc-900/10'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {file ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-zinc-800/80 rounded-2xl w-fit mx-auto text-zinc-300 border border-zinc-700">
                        <FileText size={32} className="text-[#26F0C4]" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white truncate max-w-[280px]">{file.name}</p>
                        <p className="text-[10px] font-mono text-zinc-500 mt-1">{formatBytes(file.size)}</p>
                      </div>
                      <div className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-1 px-3 rounded-full inline-block">
                        Ready to Decompile & Deploy
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-zinc-900/80 rounded-2xl w-fit mx-auto text-zinc-500 border border-[#1F2225]">
                        <Upload size={28} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-zinc-300">Drag & drop your new PDF CV here</p>
                        <p className="text-[10px] text-zinc-500">or click to browse local files (max 10MB)</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress and Actions */}
              <div className="space-y-4 pt-2">
                <AnimatePresence>
                  {isUploading && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-zinc-900/50 border border-[#1F2225] rounded-xl p-3 space-y-2"
                    >
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-[#26F0C4] flex items-center gap-1.5 animate-pulse">
                          <RefreshCw size={10} className="animate-spin" />
                          Streaming chunks to Vercel Blob...
                        </span>
                        <span className="text-zinc-400">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-[#1F2225]">
                        <div
                          className="bg-[#26F0C4] h-full transition-all duration-300 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-3">
                  {file && (
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      disabled={isUploading}
                      className="py-3 px-5 border border-zinc-700 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 rounded-xl text-xs font-semibold tracking-wide transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!file || isUploading}
                    className="flex-grow py-3 px-5 bg-gradient-to-r from-[#26F0C4] to-[#14c39f] hover:from-[#1fcfa9] hover:to-[#109e81] disabled:from-zinc-800 disabled:to-zinc-800 text-zinc-950 disabled:text-zinc-600 rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-lg disabled:shadow-none hover:shadow-[#26F0C4]/15 active:scale-95 disabled:pointer-events-none"
                  >
                    {isUploading ? 'Deploying...' : 'Decompile & Deploy to Vercel Blob'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>

        {/* Metadata Registry Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#101214] border border-[#1F2225] rounded-2xl p-6 shadow-xl h-full flex flex-col">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-5 flex items-center gap-2">
              <Info size={16} className="text-[#26F0C4]" />
              Active Target Registry
            </h3>

            {isLoadingMeta ? (
              <div className="flex-grow flex flex-col items-center justify-center py-20 text-zinc-500 gap-3">
                <RefreshCw size={24} className="animate-spin text-[#26F0C4]" />
                <span className="text-xs font-mono">Synchronizing CV register...</span>
              </div>
            ) : (
              <div className="flex-grow flex flex-col justify-between space-y-6">
                <div>
                  <div className="border border-[#1F2225] rounded-xl bg-zinc-950/40 p-4 mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        {selectedLang === 'en' ? '🇬🇧 English Target' : '🇫🇷 French Target'}
                      </span>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md border ${
                        activeMeta 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                      }`}>
                        {activeMeta ? 'Active Custom' : 'Default Fallback'}
                      </span>
                    </div>

                    {activeMeta ? (
                      <div className="space-y-4 text-xs">
                        {/* URL */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Blob Asset URL</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              readOnly
                              value={activeMeta.blobUrl}
                              className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg p-2 font-mono text-[10px] w-full select-all outline-none"
                            />
                            <a
                              href={activeMeta.blobUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors shrink-0"
                              title="Test URL"
                            >
                              <ExternalLink size={14} />
                            </a>
                          </div>
                        </div>

                        {/* Hash SHA256 */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">SHA-256 Signature</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              readOnly
                              value={activeMeta.sha256}
                              className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg p-2 font-mono text-[9px] w-full select-all outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => copyToClipboard(activeMeta.sha256, 'hash')}
                              className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors shrink-0"
                              title="Copy Hash Signature"
                            >
                              {copiedText === 'hash' ? <Check size={14} className="text-[#26F0C4]" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>

                        {/* File Details Grid */}
                        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#1F2225]">
                          <div>
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Size</span>
                            <span className="font-mono text-[11px] text-zinc-300">{formatBytes(activeMeta.fileSize)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Deployed At</span>
                            <span className="font-mono text-[10px] text-zinc-300 block leading-tight">
                              {new Date(activeMeta.uploadedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-zinc-500 space-y-2">
                        <FileDown size={24} className="mx-auto opacity-30" />
                        <div className="text-[11px] font-mono">Static CDN Asset Active</div>
                        <p className="text-[10px] text-zinc-600 max-w-xs mx-auto">
                          The portfolio is currently serving the static sitemap fallback CV for this language channel. Uploading a custom PDF replaces it safely.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Secure Deletion / Purge Controls */}
                {activeMeta && (
                  <div className="pt-4 border-t border-[#1F2225] space-y-3">
                    <div className="bg-red-500/5 border border-red-500/10 p-3.5 rounded-xl flex items-start gap-2.5">
                      <AlertTriangle className="text-[#FF4A6B] shrink-0 mt-0.5" size={16} />
                      <div>
                        <h4 className="text-[11px] font-bold text-red-400 uppercase tracking-wide">Danger Zone: Purge Asset</h4>
                        <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                          Securely deleting this custom file completely purges the binary from Vercel Blob Storage containers and deletes metadata logs. Serves the static sitemap fallback immediately.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(selectedLang)}
                      className="w-full py-2.5 px-4 border border-red-500/20 hover:border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={13} />
                      Securely Purge Custom {selectedLang === 'en' ? 'EN' : 'FR'} CV
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Global Status Banner Messages */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3"
          >
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <CheckCircle size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wide">Success Block</p>
              <p className="text-xs text-zinc-300 mt-0.5">{successMsg}</p>
            </div>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3"
          >
            <div className="p-1.5 bg-red-500/20 text-red-400 rounded-lg">
              <AlertTriangle size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-red-400 uppercase tracking-wide">Error Intercepted</p>
              <p className="text-xs text-zinc-300 mt-0.5">{errorMsg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
};
