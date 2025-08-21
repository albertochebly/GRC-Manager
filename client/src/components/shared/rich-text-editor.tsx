import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight 
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = "Enter text...", className = "" }: RichTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  // Listen for image selection
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!editorRef.current) return;
      if (e.target instanceof HTMLImageElement && editorRef.current.contains(e.target)) {
        setSelectedImage(e.target);
      } else {
        setSelectedImage(null);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Handle paste event for images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!editorRef.current) return;
      if (e.clipboardData) {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.indexOf('image') !== -1) {
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                const imageUrl = event.target?.result as string;
                // Insert image at cursor
                document.execCommand('insertImage', false, imageUrl);
                onChange(editorRef.current.innerHTML);
              };
              reader.readAsDataURL(file);
              e.preventDefault();
              break;
            }
          }
        }
      }
    };
    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener('paste', handlePaste as any);
    }
    return () => {
      if (editor) {
        editor.removeEventListener('paste', handlePaste as any);
      }
    };
  }, [onChange]);

  const handleCommand = (command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInsertImage = () => {
    const url = window.prompt("Enter image URL:");
    if (url) {
      handleCommand('insertImage', url);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        handleCommand('insertImage', imageUrl);
      };
      reader.readAsDataURL(file);
      e.target.value = ""; // reset input
    }
  };

  // Image actions
  const handleResizeImage = () => {
    if (selectedImage) {
      const width = window.prompt("Enter image width in pixels (e.g. 400):", selectedImage.width.toString());
      if (width) {
        selectedImage.style.width = `${width}px`;
        onChange(editorRef.current?.innerHTML || "");
      }
    }
  };
  const handleAlignImage = (align: 'left' | 'center' | 'right') => {
    if (selectedImage) {
      selectedImage.style.display = align === 'center' ? 'block' : '';
      selectedImage.style.margin = align === 'center' ? '0 auto' : '';
      selectedImage.style.float = align === 'left' ? 'left' : align === 'right' ? 'right' : '';
      onChange(editorRef.current?.innerHTML || "");
    }
  };

  const handleContentChange = (event: React.FormEvent<HTMLDivElement>) => {
    const content = event.currentTarget.innerHTML;
    if (content !== value) {
      onChange(content);
    }
  };

  return (
    <Card className={className}>
      <div className="border-b p-2">
        <div className="flex gap-1 flex-wrap">
          {selectedImage ? (
            <>
              <Button type="button" variant="ghost" size="sm" onClick={handleResizeImage} data-testid="button-resize-image">Resize</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => handleAlignImage('left')} data-testid="button-align-image-left"><AlignLeft className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => handleAlignImage('center')} data-testid="button-align-image-center"><AlignCenter className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => handleAlignImage('right')} data-testid="button-align-image-right"><AlignRight className="h-4 w-4" /></Button>
            </>
          ) : (
            <>
              <Button type="button" variant="ghost" size="sm" onClick={() => handleCommand('bold')} data-testid="button-bold"><Bold className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => handleCommand('italic')} data-testid="button-italic"><Italic className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => handleCommand('underline')} data-testid="button-underline"><Underline className="h-4 w-4" /></Button>
              <div className="w-px h-6 bg-border mx-1" />
              <Button type="button" variant="ghost" size="sm" onClick={() => handleCommand('insertUnorderedList')} data-testid="button-bullet-list"><List className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => handleCommand('insertOrderedList')} data-testid="button-numbered-list"><ListOrdered className="h-4 w-4" /></Button>
              <div className="w-px h-6 bg-border mx-1" />
              <Button type="button" variant="ghost" size="sm" onClick={() => handleCommand('justifyLeft')} data-testid="button-align-left"><AlignLeft className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => handleCommand('justifyCenter')} data-testid="button-align-center"><AlignCenter className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => handleCommand('justifyRight')} data-testid="button-align-right"><AlignRight className="h-4 w-4" /></Button>
              {/* Image buttons */}
              <Button type="button" variant="ghost" size="sm" onClick={handleInsertImage} data-testid="button-insert-image-url">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="12.5" r="2.5"/><path d="M21 19l-5.5-7-4.5 6-2.5-3L3 19"/></svg>
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} data-testid="button-upload-image">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/><polyline points="7 9 12 4 17 9"/><line x1="12" y1="4" x2="12" y2="16"/></svg>
              </Button>
              <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
            </>
          )}
        </div>
      </div>
      <CardContent className="p-4">
        <div
          ref={editorRef}
          contentEditable
          className={`min-h-[200px] w-full outline-none prose prose-sm max-w-none ${isFocused ? 'ring-2 ring-ring ring-offset-2' : ''}`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onInput={handleContentChange}
          data-placeholder={placeholder}
          data-testid="editor-content"
        />
      </CardContent>
    </Card>
  );
}