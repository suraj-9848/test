import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Bold,
  Italic,
  Underline,
  Code,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  Undo,
  Redo,
  Image,
  Link,
} from "lucide-react";

export interface RichTextEditorHandle {
  getContent: () => string;
  setContent: (content: string) => void;
}

interface RichTextEditorProps {
  value?: string;
  initialContent?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  height?: string;
  minHeight?: string;
}

const EnhancedRichTextEditor = forwardRef<
  RichTextEditorHandle,
  RichTextEditorProps
>(
  (
    {
      value,
      initialContent,
      onChange,
      placeholder = "Start writing your blog...",
      className = "",
      height = "400px",
      minHeight = "200px",
    },
    ref,
  ) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isEditorReady, setIsEditorReady] = useState(false);
    const [editorContent, setEditorContent] = useState(
      value || initialContent || "",
    );
    const [showImageUrlInput, setShowImageUrlInput] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [savedSelection, setSavedSelection] = useState<Range | null>(null);

    useEffect(() => {
      setIsEditorReady(true);
      const content = value || initialContent || "";
      setEditorContent(content);
      if (editorRef.current && content) {
        editorRef.current.innerHTML = content;
      }
    }, []);

    useEffect(() => {
      if (value !== undefined && value !== editorContent) {
        setEditorContent(value);
        if (editorRef.current && isEditorReady) {
          editorRef.current.innerHTML = value;
        }
      }
    }, [value, isEditorReady]);

    useImperativeHandle(ref, () => ({
      getContent: () => {
        return editorRef.current ? editorRef.current.innerHTML : editorContent;
      },
      setContent: (content: string) => {
        setEditorContent(content);
        if (editorRef.current) {
          editorRef.current.innerHTML = content;
          handleInput();
        }
        if (onChange) {
          onChange(content);
        }
      },
    }));

    const handleInput = () => {
      if (editorRef.current) {
        const content = editorRef.current.innerHTML;
        setEditorContent(content);

        // Apply styles to any new elements that might need them
        requestAnimationFrame(() => {
          if (editorRef.current) {
            const headings = editorRef.current.querySelectorAll(
              "h1:not([data-styled]), h2:not([data-styled]), h3:not([data-styled])",
            );
            headings.forEach((heading) => {
              const headingElement = heading as HTMLElement;
              const level = parseInt(heading.tagName.charAt(1));
              headingElement.style.fontWeight = "bold";
              headingElement.style.margin = "16px 0 8px 0";
              headingElement.style.fontSize =
                level === 1 ? "2.25rem" : level === 2 ? "1.875rem" : "1.5rem";
              headingElement.style.lineHeight = "1.2";
              headingElement.style.color = "#1f2937";
              headingElement.style.display = "block";
              headingElement.setAttribute("data-styled", "true");
            });

            const lists = editorRef.current.querySelectorAll(
              "ul:not([data-styled]), ol:not([data-styled])",
            );
            lists.forEach((list) => {
              const listElement = list as HTMLElement;
              listElement.style.paddingLeft = "24px";
              listElement.style.margin = "8px 0";
              listElement.style.listStyleType =
                list.tagName === "UL" ? "disc" : "decimal";
              listElement.style.display = "block";
              listElement.setAttribute("data-styled", "true");

              const listItems = list.querySelectorAll("li:not([data-styled])");
              listItems.forEach((li) => {
                const liElement = li as HTMLElement;
                liElement.style.margin = "4px 0";
                liElement.style.listStyleType =
                  list.tagName === "UL" ? "disc" : "decimal";
                liElement.style.listStylePosition = "outside";
                liElement.style.display = "list-item";
                liElement.setAttribute("data-styled", "true");
              });
            });
          }
        });

        if (onChange) {
          onChange(content);
        }
      }
    };

    // Save current selection when editor loses focus
    const saveSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        setSavedSelection(selection.getRangeAt(0).cloneRange());
      }
    };

    // Restore saved selection
    const restoreSelection = () => {
      if (savedSelection && editorRef.current) {
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(savedSelection);
        editorRef.current.focus();
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const currentElement =
            range.startContainer.nodeType === Node.TEXT_NODE
              ? range.startContainer.parentElement
              : (range.startContainer as Element);

          const listItem = currentElement?.closest("li");
          if (listItem) {
            const list = listItem.parentElement;
            if (list && (list.tagName === "UL" || list.tagName === "OL")) {
              e.preventDefault();

              if (listItem.textContent?.trim() === "") {
                const p = document.createElement("p");
                p.innerHTML = "<br>";
                list.parentNode?.insertBefore(p, list.nextSibling);
                range.selectNodeContents(p);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
                listItem.remove();
                if (list.children.length === 0) {
                  list.remove();
                }
                handleInput();
                return;
              }

              const newLi = document.createElement("li");
              newLi.style.margin = "4px 0";
              newLi.style.listStyleType =
                list.tagName === "OL" ? "decimal" : "disc";
              newLi.style.listStylePosition = "outside";
              newLi.style.display = "list-item";
              newLi.innerHTML = "<br>";
              listItem.parentNode?.insertBefore(newLi, listItem.nextSibling);
              range.selectNodeContents(newLi);
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
              handleInput();
              return;
            }
          }
        }
      }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
      const text = e.clipboardData.getData("text/plain");
      const html = e.clipboardData.getData("text/html");

      // Check if pasted text is a URL that looks like an image
      const urlRegex = /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
      if (urlRegex.test(text.trim())) {
        e.preventDefault();
        insertImageFromUrl(text.trim());
        return;
      }

      // Handle normal paste
      e.preventDefault();
      const content = html || text;

      if (content) {
        document.execCommand("insertHTML", false, content);
        handleInput();
      }
    };

    const execCommand = (command: string, value?: string) => {
      if (!editorRef.current) return;

      editorRef.current.focus();
      document.execCommand(command, false, value);

      setTimeout(() => {
        updateFormatState();
        handleInput();
      }, 10);
    };

    const applyHeading = (level: number) => {
      if (!editorRef.current) return;

      editorRef.current.focus();

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);

      // Get selected text or use default
      const selectedText = range.toString() || `Heading ${level}`;

      // Define heading styles based on level
      let headingHtml = "";
      switch (level) {
        case 1:
          headingHtml = `<h1 style="font-size: 2.25rem; font-weight: 700; line-height: 1.2; margin: 24px 0 16px 0; color: #1f2937; display: block;">${selectedText}</h1>`;
          break;
        case 2:
          headingHtml = `<h2 style="font-size: 1.875rem; font-weight: 600; line-height: 1.3; margin: 20px 0 12px 0; color: #374151; display: block;">${selectedText}</h2>`;
          break;
        case 3:
          headingHtml = `<h3 style="font-size: 1.5rem; font-weight: 600; line-height: 1.4; margin: 16px 0 8px 0; color: #4b5563; display: block;">${selectedText}</h3>`;
          break;
      }

      range.deleteContents();
      document.execCommand("insertHTML", false, headingHtml + "<p><br></p>");

      handleInput();
    };

    const insertImage = () => {
      saveSelection();
      setShowImageUrlInput(true);
    };

    const insertImageFromUrl = (url: string) => {
      if (!url.trim()) return;

      try {
        new URL(url);

        if (!editorRef.current) return;

        if (savedSelection) {
          restoreSelection();
        } else {
          editorRef.current.focus();
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }

        const imageHtml = `<img src="${url}" alt="Blog image" class="blog-image" style="width: 70%; max-width: 100%; height: auto; border-radius: 8px; display: block; margin: 20px auto; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">`;
        const paragraphHtml = "<p><br></p>";

        document.execCommand("insertHTML", false, imageHtml + paragraphHtml);

        handleInput();

        setImageUrl("");
        setShowImageUrlInput(false);
        setSavedSelection(null);
      } catch (error) {
        console.error("Error inserting image:", error);
        alert("Please enter a valid URL");
      }
    };

    const handleImageUrlSubmit = () => {
      insertImageFromUrl(imageUrl);
    };

    const handleImageUrlKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleImageUrlSubmit();
      } else if (e.key === "Escape") {
        setShowImageUrlInput(false);
        setImageUrl("");
        setSavedSelection(null);
      }
    };

    const insertCodeBlock = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

        // Get selected text or use default
        const selectedText =
          range.toString() ||
          '// Your code here\nconsole.log("Hello, World!");';

        // Find if we're inside a block element
        let currentElement = range.commonAncestorContainer;
        if (currentElement.nodeType === Node.TEXT_NODE) {
          currentElement = currentElement.parentElement!;
        }

        const blockParent = (currentElement as Element)?.closest(
          "li, blockquote, h1, h2, h3, h4, h5, h6",
        );

        const pre = document.createElement("pre");
        const code = document.createElement("code");

        // Apply nice light theme styling
        pre.style.backgroundColor = "#f8fafc";
        pre.style.border = "2px solid #e2e8f0";
        pre.style.borderRadius = "12px";
        pre.style.padding = "20px";
        pre.style.margin = "16px 0";
        pre.style.overflow = "auto";
        pre.style.fontFamily = 'Monaco, Consolas, "Courier New", monospace';
        pre.style.fontSize = "14px";
        pre.style.lineHeight = "1.6";
        pre.style.display = "block";
        pre.style.width = "100%";
        pre.style.boxSizing = "border-box";
        pre.style.color = "#334155";
        pre.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";

        code.style.backgroundColor = "transparent";
        code.style.padding = "0";
        code.style.border = "none";
        code.style.color = "#0f172a";
        code.style.display = "block";
        code.style.fontFamily = "inherit";
        code.textContent = selectedText;

        pre.appendChild(code);

        if (blockParent) {
          blockParent.parentNode?.insertBefore(pre, blockParent.nextSibling);
          const newP = document.createElement("p");
          newP.innerHTML = "<br>";
          pre.parentNode?.insertBefore(newP, pre.nextSibling);
          range.selectNodeContents(newP);
          range.collapse(true);
        } else {
          range.deleteContents();
          range.insertNode(pre);
          const newP = document.createElement("p");
          newP.innerHTML = "<br>";
          range.setStartAfter(pre);
          range.insertNode(newP);
          range.selectNodeContents(newP);
          range.collapse(true);
        }

        selection.removeAllRanges();
        selection.addRange(range);
        handleInput();
      }
    };

    const insertList = (ordered: boolean) => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

        // Check if we're already in a list
        const currentLi =
          range.startContainer.nodeType === Node.TEXT_NODE
            ? range.startContainer.parentElement?.closest("li")
            : (range.startContainer as Element)?.closest("li");

        if (currentLi) {
          return;
        }

        const list = document.createElement(ordered ? "ol" : "ul");
        const li = document.createElement("li");

        // Apply proper styles
        list.style.paddingLeft = "24px";
        list.style.margin = "8px 0";
        list.style.listStyleType = ordered ? "decimal" : "disc";
        list.style.display = "block";

        li.style.margin = "4px 0";
        li.style.listStyleType = ordered ? "decimal" : "disc";
        li.style.listStylePosition = "outside";
        li.style.display = "list-item";

        const selectedText = range.toString();
        if (selectedText) {
          li.textContent = selectedText;
          range.deleteContents();
        } else {
          li.innerHTML = "List item";
        }

        list.appendChild(li);
        range.insertNode(list);

        // Move cursor to end of list item
        range.selectNodeContents(li);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);

        handleInput();
      }
    };

    const insertQuote = () => {
      if (!editorRef.current) return;

      editorRef.current.focus();

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const selectedText = range.toString() || "Insert your quote here...";

      const quoteHtml = `<blockquote style="border-left: 4px solid #3b82f6; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 16px 20px; margin: 16px 0; border-radius: 4px; font-style: italic; display: block; color: #1e40af; position: relative;">${selectedText}</blockquote><p><br></p>`;

      range.deleteContents();
      document.execCommand("insertHTML", false, quoteHtml);
      handleInput();
    };

    // Check current formatting state
    const checkCurrentFormat = () => {
      if (!editorRef.current)
        return { bold: false, italic: false, underline: false };

      try {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0)
          return { bold: false, italic: false, underline: false };

        const range = selection.getRangeAt(0);
        const element =
          range.startContainer.nodeType === Node.TEXT_NODE
            ? range.startContainer.parentElement
            : (range.startContainer as Element);

        return {
          bold: document.queryCommandState("bold"),
          italic: document.queryCommandState("italic"),
          underline: document.queryCommandState("underline"),
          h1: element?.closest("h1") !== null,
          h2: element?.closest("h2") !== null,
          h3: element?.closest("h3") !== null,
          ul: element?.closest("ul") !== null,
          ol: element?.closest("ol") !== null,
        };
      } catch {
        return { bold: false, italic: false, underline: false };
      }
    };

    const [currentFormat, setCurrentFormat] = useState(checkCurrentFormat());

    const updateFormatState = () => {
      const newFormat = checkCurrentFormat();
      setCurrentFormat(newFormat);
    };

    useEffect(() => {
      const editor = editorRef.current;
      if (editor) {
        const handleSelectionChange = () => {
          if (
            document.activeElement === editor ||
            editor.contains(document.activeElement)
          ) {
            updateFormatState();
          }
        };

        document.addEventListener("selectionchange", handleSelectionChange);
        editor.addEventListener("keyup", updateFormatState);
        editor.addEventListener("mouseup", updateFormatState);
        editor.addEventListener("blur", saveSelection);

        return () => {
          document.removeEventListener(
            "selectionchange",
            handleSelectionChange,
          );
          editor.removeEventListener("keyup", updateFormatState);
          editor.removeEventListener("mouseup", updateFormatState);
          editor.removeEventListener("blur", saveSelection);
        };
      }
    }, [isEditorReady]);

    const toolbarButtons = [
      {
        icon: Bold,
        command: () => execCommand("bold"),
        tooltip: "Bold",
        active: currentFormat.bold,
      },
      {
        icon: Italic,
        command: () => execCommand("italic"),
        tooltip: "Italic",
        active: currentFormat.italic,
      },
      {
        icon: Underline,
        command: () => execCommand("underline"),
        tooltip: "Underline",
        active: currentFormat.underline,
      },
      { divider: true },
      {
        icon: Heading1,
        command: () => applyHeading(1),
        tooltip: "Heading 1",
        active: currentFormat.h1,
      },
      {
        icon: Heading2,
        command: () => applyHeading(2),
        tooltip: "Heading 2",
        active: currentFormat.h2,
      },
      {
        icon: Heading3,
        command: () => applyHeading(3),
        tooltip: "Heading 3",
        active: currentFormat.h3,
      },
      { divider: true },
      {
        icon: List,
        command: () => insertList(false),
        tooltip: "Bullet List",
        active: currentFormat.ul,
      },
      {
        icon: ListOrdered,
        command: () => insertList(true),
        tooltip: "Numbered List",
        active: currentFormat.ol,
      },
      { divider: true },
      { icon: Image, command: insertImage, tooltip: "Insert Image (URL)" },
      { icon: Code, command: insertCodeBlock, tooltip: "Code Block" },
      { icon: Quote, command: insertQuote, tooltip: "Quote" },
      { divider: true },
      {
        icon: AlignLeft,
        command: () => execCommand("justifyLeft"),
        tooltip: "Align Left",
      },
      {
        icon: AlignCenter,
        command: () => execCommand("justifyCenter"),
        tooltip: "Align Center",
      },
      {
        icon: AlignRight,
        command: () => execCommand("justifyRight"),
        tooltip: "Align Right",
      },
      { divider: true },
      { icon: Undo, command: () => execCommand("undo"), tooltip: "Undo" },
      { icon: Redo, command: () => execCommand("redo"), tooltip: "Redo" },
    ];

    return (
      <div
        className={`border border-gray-300 rounded-lg bg-white ${className}`}
      >
        <div className="border-b border-gray-300 p-3 bg-gray-50 rounded-t-lg">
          <div className="flex flex-wrap gap-1 items-center">
            {toolbarButtons.map((button, index) => {
              if (button.divider) {
                return (
                  <div key={index} className="w-px h-6 bg-gray-300 mx-1" />
                );
              }

              const IconComponent = button.icon;
              if (!IconComponent) return null;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={button.command}
                  className={`p-2 rounded transition-all duration-200 ${
                    button.active
                      ? "bg-blue-500 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                  title={button.tooltip}
                >
                  <IconComponent size={16} />
                </button>
              );
            })}
          </div>

          {showImageUrlInput && (
            <div className="mt-3 p-3 bg-white border border-gray-200 rounded-md">
              <div className="flex items-center gap-2">
                <Link size={16} className="text-gray-500" />
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={handleImageUrlKeyPress}
                  placeholder="Enter image URL..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={handleImageUrlSubmit}
                  disabled={!imageUrl.trim()}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Insert
                </button>
                <button
                  onClick={() => {
                    setShowImageUrlInput(false);
                    setImageUrl("");
                    setSavedSelection(null);
                  }}
                  className="px-3 py-2 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Enter a valid image URL or paste an image URL directly into the
                editor
              </p>
            </div>
          )}
        </div>

        <div className="relative">
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            onMouseUp={updateFormatState}
            onKeyUp={updateFormatState}
            className="p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
            style={{ height: height, minHeight: minHeight, overflowY: "auto" }}
            suppressContentEditableWarning={true}
            data-placeholder={placeholder}
          />

          {!editorContent && (
            <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
              {placeholder}
            </div>
          )}
        </div>

        <style jsx>{`
          [contenteditable] {
            outline: none;
          }

          /* Heading Styles */
          [contenteditable] h1 {
            font-size: 2.25rem !important;
            font-weight: 700 !important;
            line-height: 1.2 !important;
            margin: 24px 0 16px 0 !important;
            color: #1f2937 !important;
            display: block !important;
          }

          [contenteditable] h2 {
            font-size: 1.875rem !important;
            font-weight: 600 !important;
            line-height: 1.3 !important;
            margin: 20px 0 12px 0 !important;
            color: #374151 !important;
            display: block !important;
          }

          [contenteditable] h3 {
            font-size: 1.5rem !important;
            font-weight: 600 !important;
            line-height: 1.4 !important;
            margin: 16px 0 8px 0 !important;
            color: #4b5563 !important;
            display: block !important;
          }

          [contenteditable] p {
            margin: 8px 0 !important;
            line-height: 1.6 !important;
            display: block !important;
            min-height: 1.5em !important;
          }

          /* List Styles */
          [contenteditable] ul {
            padding-left: 24px !important;
            margin: 8px 0 !important;
            list-style-type: disc !important;
            display: block !important;
          }

          [contenteditable] ol {
            padding-left: 24px !important;
            margin: 8px 0 !important;
            list-style-type: decimal !important;
            display: block !important;
          }

          [contenteditable] li {
            margin: 4px 0 !important;
            line-height: 1.5 !important;
            display: list-item !important;
            list-style-position: outside !important;
          }

          [contenteditable] ul li {
            list-style-type: disc !important;
          }

          [contenteditable] ol li {
            list-style-type: decimal !important;
          }

          /* Beautiful Light Code Block Styles */
          [contenteditable] pre {
            background: #f8fafc !important;
            border: 2px solid #e2e8f0 !important;
            border-radius: 12px !important;
            padding: 20px !important;
            margin: 16px 0 !important;
            overflow-x: auto !important;
            font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace !important;
            font-size: 14px !important;
            line-height: 1.6 !important;
            display: block !important;
            white-space: pre-wrap !important;
            color: #334155 !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
            transition: all 0.2s ease !important;
          }

          [contenteditable] pre:hover {
            border-color: #cbd5e1 !important;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
          }

          [contenteditable] pre code {
            background: transparent !important;
            padding: 0 !important;
            border: none !important;
            color: #0f172a !important;
            display: block !important;
            font-family: inherit !important;
            font-size: inherit !important;
          }

          [contenteditable] code {
            background: #f1f5f9 !important;
            color: #e11d48 !important;
            padding: 2px 6px !important;
            border-radius: 4px !important;
            font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace !important;
            font-size: 0.9em !important;
          }

          /* Enhanced Blockquote Styles */
          [contenteditable] blockquote {
            border-left: 4px solid #3b82f6 !important;
            background: linear-gradient(
              135deg,
              #eff6ff 0%,
              #dbeafe 100%
            ) !important;
            padding: 16px 20px !important;
            margin: 16px 0 !important;
            border-radius: 4px !important;
            font-style: italic !important;
            display: block !important;
            color: #1e40af !important;
            position: relative !important;
          }

          [contenteditable] blockquote::before {
            content: '"' !important;
            font-size: 2em !important;
            color: #3b82f6 !important;
            position: absolute !important;
            top: 8px !important;
            left: 12px !important;
            opacity: 0.5 !important;
          }

          /* Image Styles */
          [contenteditable] img,
          [contenteditable] .blog-image {
            width: 70% !important;
            max-width: 100% !important;
            height: auto !important;
            border-radius: 8px !important;
            display: block !important;
            margin: 20px auto !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
            transition: all 0.2s ease !important;
          }

          [contenteditable] img:hover,
          [contenteditable] .blog-image:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15) !important;
          }

          /* Text formatting */
          [contenteditable] strong {
            font-weight: 700 !important;
          }

          [contenteditable] em {
            font-style: italic !important;
          }

          [contenteditable] u {
            text-decoration: underline !important;
          }

          /* Placeholder */
          [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
            font-style: italic;
          }

          /* Focus styles */
          [contenteditable]:focus {
            outline: none !important;
          }

          /* Responsive Image Styles */
          @media (max-width: 768px) {
            [contenteditable] img,
            [contenteditable] .blog-image {
              width: 85% !important;
            }
          }

          @media (max-width: 480px) {
            [contenteditable] img,
            [contenteditable] .blog-image {
              width: 95% !important;
              margin: 16px auto !important;
            }
          }
        `}</style>
      </div>
    );
  },
);

EnhancedRichTextEditor.displayName = "EnhancedRichTextEditor";

export default EnhancedRichTextEditor;
