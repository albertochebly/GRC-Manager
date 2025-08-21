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
  const [pasteError, setPasteError] = useState<string>("");

  // Utility to enhance table HTML with borders and padding
  function enhanceTableHtml(html: string) {
    // Add border-collapse and width to <table>
    html = html.replace(/<table(.*?)>/gi, '<table$1 style="border-collapse:collapse;width:100%">');
    // Add border and padding to <td> and <th>
    html = html.replace(/<td(.*?)>/gi, '<td$1 style="border:1px solid #ccc;padding:4px">');
    html = html.replace(/<th(.*?)>/gi, '<th$1 style="border:1px solid #ccc;padding:4px">');
    return html;
  }

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

  // Table creation
  const handleInsertTable = () => {
    const rows = parseInt(window.prompt("Number of rows:", "2") || "2", 10);
    const cols = parseInt(window.prompt("Number of columns:", "2") || "2", 10);
    if (rows > 0 && cols > 0 && editorRef.current) {
      let tableHtml = '<table style="border-collapse:collapse;width:100%">';
      for (let r = 0; r < rows; r++) {
        tableHtml += '<tr>';
        for (let c = 0; c < cols; c++) {
          tableHtml += '<td style="border:1px solid #ccc;padding:4px">&nbsp;</td>';
        }
        tableHtml += '</tr>';
      }
      tableHtml += '</table>';
      document.execCommand('insertHTML', false, tableHtml);
      onChange(editorRef.current.innerHTML);
    }
  };

  // Paste handler for all formatting
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (e.clipboardData) {
      let html = e.clipboardData.getData('text/html');
      if (html) {
        // Convert Word/Office heading styles to semantic headings
        html = html.replace(/<p[^>]*class=["']?MsoTitle["']?[^>]*>(.*?)<\/p>/gi, '<h1>$1</h1>');
        html = html.replace(/<p[^>]*class=["']?MsoHeading1["']?[^>]*>(.*?)<\/p>/gi, '<h1>$1</h1>');
        html = html.replace(/<p[^>]*class=["']?MsoHeading2["']?[^>]*>(.*?)<\/p>/gi, '<h2>$1</h2>');
        html = html.replace(/<p[^>]*class=["']?MsoHeading3["']?[^>]*>(.*?)<\/p>/gi, '<h3>$1</h3>');
        html = html.replace(/<p[^>]*class=["']?MsoHeading4["']?[^>]*>(.*?)<\/p>/gi, '<h4>$1</h4>');
        html = html.replace(/<p[^>]*class=["']?MsoHeading5["']?[^>]*>(.*?)<\/p>/gi, '<h5>$1</h5>');
        html = html.replace(/<p[^>]*class=["']?MsoHeading6["']?[^>]*>(.*?)<\/p>/gi, '<h6>$1</h6>');

        // Preserve text alignment for <p>, <div>, <h1>-<h6> from Word/Office
        // Convert align="center" to style="text-align:center" for all block tags
        const blockTags = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        blockTags.forEach(tag => {
          // align="center|right|justify"
          html = html.replace(new RegExp(`<${tag}([^>]*)align=["']?(center|right|justify)["']?([^>]*)>(.*?)<\/${tag}>`, 'gi'),
            `<${tag}$1 style="text-align:$2"$3>$4</${tag}>`);
          // style="...text-align:center..."
          html = html.replace(new RegExp(`<${tag}([^>]*)style=["'][^"'>]*text-align:\s*center;?[^"'>]*["']([^>]*)>(.*?)<\/${tag}>`, 'gi'),
            `<${tag}$1 style="text-align:center"$2>$3</${tag}>`);
          html = html.replace(new RegExp(`<${tag}([^>]*)style=["'][^"'>]*text-align:\s*right;?[^"'>]*["']([^>]*)>(.*?)<\/${tag}>`, 'gi'),
            `<${tag}$1 style="text-align:right"$2>$3</${tag}>`);
          html = html.replace(new RegExp(`<${tag}([^>]*)style=["'][^"'>]*text-align:\s*justify;?[^"'>]*["']([^>]*)>(.*?)<\/${tag}>`, 'gi'),
            `<${tag}$1 style="text-align:justify"$2>$3</${tag}>`);
        });

        // Enhance tables if present, but otherwise insert raw HTML
        let enhancedHtml = html.includes('<table') ? enhanceTableHtml(html) : html;
        document.execCommand('insertHTML', false, enhancedHtml);
        onChange(editorRef.current?.innerHTML || "");
        e.preventDefault();
        setPasteError("");
        return;
      }
      // Fallback: insert plain text if no HTML
      const text = e.clipboardData.getData('text/plain');
      if (text) {
        document.execCommand('insertText', false, text);
        onChange(editorRef.current?.innerHTML || "");
        e.preventDefault();
        setPasteError("");
        return;
      }
    }
  setPasteError("No content found in clipboard.");
  setTimeout(() => setPasteError("") , 3000);
  };

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
              <Button type="button" variant="ghost" size="sm" onClick={handleInsertTable} data-testid="button-insert-table">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
              </Button>
              <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
            </>
          )}
        </div>
      </div>
      <CardContent className="p-4">
        {pasteError && (
          <div className="text-red-600 text-sm mb-2">{pasteError}</div>
        )}
        <div
          ref={editorRef}
          contentEditable
          className={`min-h-[200px] w-full outline-none prose prose-sm max-w-none ${isFocused ? 'ring-2 ring-ring ring-offset-2' : ''}`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onInput={handleContentChange}
          onPaste={handlePaste}
          data-placeholder={placeholder}
          data-testid="editor-content"
        />
      </CardContent>
    </Card>
  );
}