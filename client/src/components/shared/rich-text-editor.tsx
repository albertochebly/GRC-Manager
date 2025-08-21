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
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand('bold')}
            data-testid="button-bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand('italic')}
            data-testid="button-italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand('underline')}
            data-testid="button-underline"
          >
            <Underline className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand('insertUnorderedList')}
            data-testid="button-bullet-list"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand('insertOrderedList')}
            data-testid="button-numbered-list"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand('justifyLeft')}
            data-testid="button-align-left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand('justifyCenter')}
            data-testid="button-align-center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleCommand('justifyRight')}
            data-testid="button-align-right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          {/* Image buttons */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleInsertImage}
            data-testid="button-insert-image-url"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="12.5" r="2.5"/><path d="M21 19l-5.5-7-4.5 6-2.5-3L3 19"/></svg>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            data-testid="button-upload-image"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/><polyline points="7 9 12 4 17 9"/><line x1="12" y1="4" x2="12" y2="16"/></svg>
          </Button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      </div>
      <CardContent className="p-4">
        <div
          ref={editorRef}
          contentEditable
          className={`min-h-[200px] w-full outline-none prose prose-sm max-w-none ${
            isFocused ? 'ring-2 ring-ring ring-offset-2' : ''
          }`}
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