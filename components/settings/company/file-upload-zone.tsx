'use client'

import React, { useRef, useState } from 'react'

export default function FileUploadZone({ onUpload }: { onUpload: (url: string) => void }) {
  const ref = useRef<HTMLInputElement | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)

    try {
      // placeholder: read as data URL and return as url (local preview)
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // in future replace with S3 / UploadThing upload
        onUpload(result)
        setLoading(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <div className="border-dashed border-2 rounded p-3">
      <input ref={ref} type="file" accept="image/*" onChange={handleFile} className="w-full" />
      {loading && <div className="text-sm text-muted-foreground mt-2">Subiendo...</div>}
    </div>
  )
}
