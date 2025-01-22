'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AnnotationType, HighlightColor } from '../types/scripture'
import { LinkIcon, StickyNoteIcon, XIcon, ImageIcon } from 'lucide-react'

interface AnnotationMenuProps {
  position: { x: number; y: number; width?: number } | null;
  selectedText: string;
  onClose: () => void;
  onSave: (annotation: {
    selectedText: string,
    type: AnnotationType;
    color: HighlightColor;
    text: string;
    url?: string;
    photoUrl?: string;
  }) => void;
}

export function AnnotationMenu({ position, selectedText, onClose, onSave }: AnnotationMenuProps) {
  const [type, setType] = useState<AnnotationType>('note')
  const [color, setColor] = useState<HighlightColor>('yellow')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')

  if (!position) return null

  const handleSave = () => {
    onSave({
      selectedText,
      type,
      color,
      text,
      ...(url && { url }),
      ...(photoUrl && { photoUrl })
    })
    onClose()
  }

  return (
    <Card
      className="fixed z-50 w-[calc(100vw-2rem)] md:w-80 overflow-auto"
      style={{
        top: `${position.y}px`,
        left: position.width ? 
          `${Math.min(position.x, window.innerWidth - (position.width + 32))}px` : 
          `${Math.min(position.x, window.innerWidth - 320)}px`,
      }}
    >
      <CardContent className="p-3 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant={type === 'note' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setType('note')}
            >
              <StickyNoteIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={type === 'link' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setType('link')}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={type === 'photo' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setType('photo')}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <XIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Highlight Color</Label>
          <Select value={color} onValueChange={(value) => setColor(value as HighlightColor)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yellow">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-200" />
                  Yellow
                </div>
              </SelectItem>
              <SelectItem value="green">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-200" />
                  Green
                </div>
              </SelectItem>
              <SelectItem value="blue">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-200" />
                  Blue
                </div>
              </SelectItem>
              <SelectItem value="purple">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-purple-200" />
                  Purple
                </div>
              </SelectItem>
              <SelectItem value="pink">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-pink-200" />
                  Pink
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Note</Label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add your annotation..."
            className="h-20"
          />
        </div>

        {type === 'link' && (
          <div className="space-y-2">
            <Label>URL</Label>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        )}

        {(type === 'photo' || type === 'combo') && (
          <div className="space-y-2">
            <Label>Photo URL</Label>
            <Input
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        )}

        <Button onClick={handleSave} className="w-full">
          Save Annotation
        </Button>
      </CardContent>
    </Card>
  )
}

