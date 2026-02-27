'use client'
import { useRef, useState, useCallback } from 'react'
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Asset } from './editor-types'
import { createClient, isPocketBaseConfigured } from '@/lib/supabase'

const ALLOWED_EXTS = new Set(['.png', '.jpg', '.jpeg', '.pdf', '.svg', '.eps', '.tiff', '.tif'])
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ImageUpload({
  assets,
  onAssetsChange,
  onInsertMarkdown,
}: {
  assets: Asset[]
  onAssetsChange: (assets: Asset[]) => void
  onInsertMarkdown: (text: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const uploadFile = useCallback(async (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ext || !ALLOWED_EXTS.has(ext)) {
      setError(`Unsupported format "${ext}". Use PNG, JPG, PDF, SVG, EPS, or TIFF.`)
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large (${formatSize(file.size)}). Maximum 10 MB.`)
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const headers: Record<string, string> = {}
      if (isPocketBaseConfigured) {
        const pb = createClient()
        if (pb.authStore.isValid && pb.authStore.token) {
          headers['Authorization'] = `Bearer ${pb.authStore.token}`
        }
      }

      const resp = await fetch('/api/assets/upload', {
        method: 'POST',
        headers,
        body: formData,
      })

      if (!resp.ok) {
        const data = await resp.json().catch(() => null)
        throw new Error(data?.message || `Upload failed (${resp.status})`)
      }

      const asset: Asset = await resp.json()
      onAssetsChange([...assets, asset])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [assets, onAssetsChange])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void uploadFile(file)
    if (e.target) e.target.value = '' // reset for re-upload of same file
  }, [uploadFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) void uploadFile(file)
  }, [uploadFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const removeAsset = useCallback(async (assetId: string) => {
    try {
      await fetch(`/api/assets/${assetId}`, { method: 'DELETE' })
    } catch { /* best-effort cleanup */ }
    onAssetsChange(assets.filter(a => a.assetId !== assetId))
  }, [assets, onAssetsChange])

  const insertAsset = useCallback((asset: Asset) => {
    onInsertMarkdown(`![${asset.originalName}](${asset.filename})`)
  }, [onInsertMarkdown])

  return (
    <div className="space-y-2">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          flex cursor-pointer items-center justify-center gap-2 border border-dashed px-3 py-2.5
          font-mono text-[10px] uppercase tracking-[0.1em] transition-colors
          ${dragOver
            ? 'border-[#FF3333] bg-[#FF3333]/5 text-[#FF3333]'
            : 'border-[#111111]/20 text-[#111111]/50 hover:border-[#111111]/40 hover:text-[#111111]/70'
          }
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <Upload className="h-3.5 w-3.5" />
        {uploading ? 'Uploading...' : 'Drop image or click to upload'}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.pdf,.svg,.eps,.tiff,.tif"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-1.5 text-[11px] text-red-600"
          >
            <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Asset list */}
      <AnimatePresence>
        {assets.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-1"
          >
            {assets.map(asset => (
              <motion.div
                key={asset.assetId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="group flex items-center gap-2 border border-[#111111]/8 bg-white px-2 py-1.5"
              >
                <ImageIcon className="h-3 w-3 flex-shrink-0 text-[#111111]/40" />
                <button
                  onClick={() => insertAsset(asset)}
                  className="flex-1 truncate text-left font-mono text-[10px] text-[#111111]/50 hover:text-[#FF3333] transition-colors"
                  title={`Click to insert ![${asset.originalName}](${asset.filename}) into manuscript`}
                >
                  {asset.originalName}
                </button>
                <span className="font-mono text-[9px] text-[#111111]/40">
                  {formatSize(asset.size)}
                </span>
                <button
                  onClick={() => removeAsset(asset.assetId)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[#111111]/40 hover:text-[#FF3333]"
                  title="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
