'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateProfileAvatar } from '@/lib/auth/profile-actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

const AVATAR_SIZE = 512
const MAX_SOURCE_BYTES = 30_000_000
const APPLE_PHOTO_EXTENSION = /\.(?:heic|heif)$/i

async function prepareAvatar(file: File) {
  if (!file.type.startsWith('image/') && !APPLE_PHOTO_EXTENSION.test(file.name)) {
    throw new Error('Please choose a photo from your library or camera.')
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('That photo is too large. Please choose a standard iPhone photo instead of ProRAW.')
  }
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = new Image()
    try {
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = () => reject(new Error('Image loading failed'))
        image.src = objectUrl
      })
    } catch {
      throw new Error('This photo could not be read. On older iPhones, try a screenshot or a JPEG photo.')
    }
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('This photo has no readable image data.')
    const side = Math.min(image.naturalWidth, image.naturalHeight)
    const sourceX = (image.naturalWidth - side) / 2
    const sourceY = (image.naturalHeight - side) / 2
    const canvas = document.createElement('canvas')
    canvas.width = AVATAR_SIZE
    canvas.height = AVATAR_SIZE
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Your browser could not prepare this image.')
    context.drawImage(image, sourceX, sourceY, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE)
    const webp = canvas.toDataURL('image/webp', 0.84)
    if (webp.startsWith('data:image/webp')) return webp

    // Older Safari versions can fall back to PNG when WebP export is not
    // available. JPEG keeps a camera photo comfortably below the action limit.
    return canvas.toDataURL('image/jpeg', 0.84)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export function ProfileAvatarEditor({ name, avatar, editable }: {
  name: string
  avatar?: string
  editable: boolean
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState(avatar)
  const [saving, setSaving] = useState(false)

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setSaving(true)
    try {
      const prepared = await prepareAvatar(file)
      setPreview(prepared)
      const result = await updateProfileAvatar(prepared)
      if (result.message !== 'Success') {
        setPreview(avatar)
        toast.warning(result.message)
        return
      }
      toast.success('Profile photo updated!')
      router.refresh()
    } catch (error) {
      setPreview(avatar)
      toast.warning(error instanceof Error ? error.message : 'Could not prepare that image.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative shrink-0">
      <Avatar className="size-28 border bg-muted shadow-sm sm:size-32">
        <AvatarImage src={preview} alt={`${name}'s profile photo`} className="object-cover" />
        <AvatarFallback className="text-3xl font-semibold">{getInitials(name)}</AvatarFallback>
      </Avatar>
      {editable && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,.heic,.heif"
            className="sr-only"
            onChange={handleFile}
            disabled={saving}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={saving}
            className="absolute bottom-0 right-0 flex size-10 items-center justify-center rounded-full border bg-background shadow-md transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            aria-label="Update profile photo"
            title="Update profile photo"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
          </button>
        </>
      )}
    </div>
  )
}
