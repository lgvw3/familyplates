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
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea"
import { Label } from "@/components/ui/label"
import { AnnotationType, HighlightColor } from '../types/scripture'
import { LinkIcon, StickyNoteIcon, XIcon, ImageIcon, MessageSquareIcon } from 'lucide-react'

interface AnnotationMenuProps {
  position: { x: number; y: number; width?: number } | null;
  onClose: () => void;
  onSave: (annotation: {
    text: string;
    type: AnnotationType;
    color: HighlightColor;
    url?: string;
    photoUrl?: string;
  }) => void;
  onAskQuestion?: (selectedText: string, context: {
    book: string;
    chapter: number;
    verseNumbers: number[];
  }) => void;
  selectedText?: string;
  context?: {
    book: string;
    chapter: number;
    verseNumbers: number[];
  };
}

export function AnnotationMenu({ 
  position, 
  onClose, 
  onSave, 
  onAskQuestion,
  selectedText,
  context 
}: AnnotationMenuProps) {
  const [type, setType] = useState<AnnotationType>('note')
  const [color, setColor] = useState<HighlightColor>('yellow')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')

  if (!position) return null

  const handleSave = () => {
    onSave({
      type,
      color,
      text,
      ...(url && { url }),
      ...(photoUrl && { photoUrl })
    })
    setText('')
    onClose()
  }

  const handleAskQuestion = () => {
    if (onAskQuestion && selectedText && context) {
      onAskQuestion(selectedText, context)
    }
  }

  return (
    <Card
      className="fixed bottom-0 left-0 right-0 z-50 w-full md:w-80 md:left-1/2 md:-translate-x-1/2 overflow-auto"
      style={{
        maxHeight: '80vh',
        boxShadow: '0 -4px 6px -1px rgb(0 0 0 / 0.1)',
        transform: `translateY(${position ? '0' : '100%'})`,
        transition: 'transform 300ms ease-in-out'
      }}
    >
      <CardContent className="p-3 space-y-4">
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-2 md:hidden" />

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

        {/* Ask Question Button - Only show if we have selected text and context */}
        {selectedText && context && onAskQuestion && (
          <div className="space-y-2">
            <Button 
              onClick={handleAskQuestion} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              variant="default"
            >
              <MessageSquareIcon className="h-4 w-4 mr-2" />
              Ask AI about this text
            </Button>
            <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-2 rounded">
              <p className="font-medium">Selected text:</p>
              <p className="italic">&ldquo;{selectedText}&rdquo;</p>
              <p className="mt-1">
                {context.book} {context.chapter}:{context.verseNumbers.join(', ')}
              </p>
            </div>
          </div>
        )}

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
          <AutoResizeTextarea
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

