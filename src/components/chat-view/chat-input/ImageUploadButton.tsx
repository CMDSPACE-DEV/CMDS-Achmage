import { ImageUp } from 'lucide-react'
import { ChangeEvent, useRef } from 'react'

import { ChatIconButton } from '../ChatIconButton'

export function ImageUploadButton({
  onUpload,
}: {
  onUpload: (files: File[]) => void | Promise<void>
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length > 0) {
      void onUpload(files)
    }
    event.target.value = ''
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="smtcmp-visually-hidden-input"
      />
      <ChatIconButton
        icon={ImageUp}
        label="Attach image"
        tooltip="Attach one or more images"
        onClick={() => inputRef.current?.click()}
      />
    </>
  )
}
