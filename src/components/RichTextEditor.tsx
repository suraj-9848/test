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

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  (
    {
      value,
      initialContent,
      onChange,
      placeholder = "Start typing...",
      className = "",
      height = "300px",
      minHeight = "150px",
    },
    ref,
  ) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isEditorReady, setIsEditorReady] = useState(false);
    const [editorContent, setEditorContent] = useState(
      value || initialContent || "",
    );

    useEffect(() => {
      setIsEditorReady(true);
      const content = value || initialContent || "";
      setEditorContent(content);
      if (editorRef.current && editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content;
      }
    }, []);

    useEffect(() => {
      if (value !== undefined && value !== editorContent) {
        setEditorContent(value);
        if (
          editorRef.current &&
          isEditorReady &&
          value !== editorRef.current.innerHTML
        ) {
          const selection = window.getSelection();
          const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

          editorRef.current.innerHTML = value;
          if (range && editorRef.current.contains(range.startContainer)) {
            try {
              selection?.removeAllRanges();
              selection?.addRange(range);
            } catch (e) {
              console.error("Failed to restore selection:", e);
            }
          }
        }
      }
    }, [value, editorContent, isEditorReady]);

    useImperativeHandle(ref, () => ({
      getContent: () => {
        return editorRef.current ? editorRef.current.innerHTML : editorContent;
      },
      setContent: (content: string) => {
        setEditorContent(content);
        if (editorRef.current) {
          editorRef.current.innerHTML = content;

          setTimeout(() => {
            if (editorRef.current) {
              const headings = editorRef.current.querySelectorAll(
                "h1, h2, h3, h4, h5, h6",
              );
              headings.forEach((heading) => {
                const headingElement = heading as HTMLElement;
                const level = parseInt(heading.tagName.charAt(1));
                headingElement.style.fontWeight = "bold";
                headingElement.style.margin = "16px 0 8px 0";
                headingElement.style.fontSize =
                  level === 1 ? "1.875rem" : level === 2 ? "1.5rem" : "1.25rem";
                headingElement.style.lineHeight = "1.2";
                headingElement.style.color = "#1f2937";
                headingElement.style.display = "block";
              });

              const lists = editorRef.current.querySelectorAll("ul, ol");
              lists.forEach((list) => {
                const listElement = list as HTMLElement;
                listElement.style.paddingLeft = "24px";
                listElement.style.margin = "8px 0";
                listElement.style.listStyleType =
                  list.tagName === "UL" ? "disc" : "decimal";
                listElement.style.display = "block";

                const listItems = list.querySelectorAll("li");
                listItems.forEach((li) => {
                  const liElement = li as HTMLElement;
                  liElement.style.margin = "4px 0";
                  liElement.style.listStyleType =
                    list.tagName === "UL" ? "disc" : "decimal";
                  liElement.style.listStylePosition = "outside";
                  liElement.style.display = "list-item";
                });
              });

              const codeBlocks = editorRef.current.querySelectorAll("pre");
              codeBlocks.forEach((pre) => {
                const preElement = pre as HTMLElement;
                preElement.style.backgroundColor = "#f1f5f9";
                preElement.style.border = "1px solid #e2e8f0";
                preElement.style.borderRadius = "8px";
                preElement.style.padding = "16px";
                preElement.style.margin = "16px 0";
                preElement.style.overflow = "auto";
                preElement.style.fontFamily =
                  'Monaco, Consolas, "Courier New", monospace';
                preElement.style.fontSize = "14px";
                preElement.style.lineHeight = "1.5";
                preElement.style.display = "block";
                preElement.style.width = "100%";
                preElement.style.boxSizing = "border-box";
                preElement.style.clear = "both";
                preElement.style.whiteSpace = "pre-wrap";
              });

              const blockquotes =
                editorRef.current.querySelectorAll("blockquote");
              blockquotes.forEach((bq) => {
                const bqElement = bq as HTMLElement;
                bqElement.style.borderLeft = "4px solid #3b82f6";
                bqElement.style.backgroundColor = "#eff6ff";
                bqElement.style.padding = "12px 16px";
                bqElement.style.margin = "16px 0";
                bqElement.style.borderRadius = "4px";
                bqElement.style.fontStyle = "italic";
                bqElement.style.display = "block";
              });
            }
          }, 10);
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

        // CRITICAL FIX: Maintain formatting during editing
        requestAnimationFrame(() => {
          if (editorRef.current) {
            // Re-apply styles to any new elements that might need them
            const headings = editorRef.current.querySelectorAll(
              "h1:not([data-styled]), h2:not([data-styled]), h3:not([data-styled])",
            );
            headings.forEach((heading) => {
              const headingElement = heading as HTMLElement;
              const level = parseInt(heading.tagName.charAt(1));
              headingElement.style.fontWeight = "bold";
              headingElement.style.margin = "16px 0 8px 0";
              headingElement.style.fontSize =
                level === 1 ? "1.875rem" : level === 2 ? "1.5rem" : "1.25rem";
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

    const handleKeyDown = (e: React.KeyboardEvent) => {
      // Handle Enter key for list continuation
      if (e.key === "Enter") {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const currentElement =
            range.startContainer.nodeType === Node.TEXT_NODE
              ? range.startContainer.parentElement
              : (range.startContainer as Element);

          // Check if we're in a list item
          const listItem = currentElement?.closest("li");
          if (listItem) {
            const list = listItem.parentElement;
            if (list && (list.tagName === "UL" || list.tagName === "OL")) {
              e.preventDefault();

              // Check if current list item is empty
              if (listItem.textContent?.trim() === "") {
                // Exit list mode - create a new paragraph
                const p = document.createElement("p");
                p.innerHTML = "<br>";

                list.parentNode?.insertBefore(p, list.nextSibling);

                // Move cursor to the new paragraph
                range.selectNodeContents(p);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);

                // Remove empty list item
                listItem.remove();

                // If list is now empty, remove it
                if (list.children.length === 0) {
                  list.remove();
                }

                handleInput();
                return;
              }

              // Create new list item
              const newLi = document.createElement("li");
              newLi.style.margin = "4px 0";
              newLi.style.listStyleType =
                list.tagName === "OL" ? "decimal" : "disc";
              newLi.innerHTML = "<br>"; // Add a line break for proper cursor positioning

              // Insert after current list item
              listItem.parentNode?.insertBefore(newLi, listItem.nextSibling);

              // Move cursor to new list item
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
      e.preventDefault();
      const text = e.clipboardData.getData("text/plain");
      const html = e.clipboardData.getData("text/html");

      // Use HTML if available, otherwise plain text
      const content = html || text;

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();

        if (html) {
          const div = document.createElement("div");
          div.innerHTML = content;
          const fragment = document.createDocumentFragment();
          while (div.firstChild) {
            fragment.appendChild(div.firstChild);
          }
          range.insertNode(fragment);
        } else {
          range.insertNode(document.createTextNode(content));
        }

        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        handleInput();
      }
    };

    const execCommand = (command: string, value?: string) => {
      document.execCommand(command, false, value);
      editorRef.current?.focus();
      handleInput();
    };

    const applyHeading = (level: number) => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

        // Get the current line/block element
        let blockElement = range.commonAncestorContainer;
        if (blockElement.nodeType === Node.TEXT_NODE) {
          blockElement = blockElement.parentNode!;
        }

        // Find the closest block element
        while (blockElement && blockElement !== editorRef.current) {
          if (blockElement.nodeType === Node.ELEMENT_NODE) {
            const element = blockElement as Element;
            if (
              ["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "LI"].includes(
                element.tagName,
              )
            ) {
              break;
            }
          }
          blockElement = blockElement.parentNode!;
        }

        if (blockElement && blockElement !== editorRef.current) {
          const element = blockElement as Element;

          // Don't convert list items to headings - create heading after the list
          if (element.tagName === "LI") {
            const list = element.closest("ul, ol");
            if (list) {
              const heading = document.createElement(`h${level}`);
              heading.innerHTML = element.innerHTML;
              heading.style.fontWeight = "bold";
              heading.style.margin = "16px 0 8px 0";
              heading.style.fontSize =
                level === 1 ? "1.875rem" : level === 2 ? "1.5rem" : "1.25rem";
              heading.style.lineHeight = "1.2";
              heading.style.color = "#1f2937";

              list.parentNode?.insertBefore(heading, list.nextSibling);

              // Remove the list item
              element.remove();

              // If list is empty, remove it
              if (list.children.length === 0) {
                list.remove();
              }

              // Move cursor to end of heading
              range.selectNodeContents(heading);
              range.collapse(false);
              selection.removeAllRanges();
              selection.addRange(range);

              handleInput();
              return;
            }
          }

          const heading = document.createElement(`h${level}`);
          heading.innerHTML = element.innerHTML;
          heading.style.fontWeight = "bold";
          heading.style.margin = "16px 0 8px 0";
          heading.style.fontSize =
            level === 1 ? "1.875rem" : level === 2 ? "1.5rem" : "1.25rem";
          heading.style.lineHeight = "1.2";
          heading.style.color = "#1f2937";

          element.parentNode?.replaceChild(heading, element);

          // Move cursor to end of heading
          range.selectNodeContents(heading);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          // Create new heading
          const heading = document.createElement(`h${level}`);
          heading.textContent = range.toString() || `Heading ${level}`;
          heading.style.fontWeight = "bold";
          heading.style.margin = "16px 0 8px 0";
          heading.style.fontSize =
            level === 1 ? "1.875rem" : level === 2 ? "1.5rem" : "1.25rem";
          heading.style.lineHeight = "1.2";
          heading.style.color = "#1f2937";

          range.deleteContents();
          range.insertNode(heading);

          // Move cursor after heading
          range.setStartAfter(heading);
          range.setEndAfter(heading);
          selection.removeAllRanges();
          selection.addRange(range);
        }

        handleInput();
      }
    };

    const insertCodeBlock = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

        // CRITICAL FIX: Ensure we're not inside other elements
        let currentElement = range.commonAncestorContainer;
        if (currentElement.nodeType === Node.TEXT_NODE) {
          currentElement = currentElement.parentElement!;
        }

        // If we're inside a list or other block element, insert after it
        const blockParent = (currentElement as Element)?.closest(
          "li, blockquote, h1, h2, h3, h4, h5, h6",
        );

        const pre = document.createElement("pre");
        const code = document.createElement("code");

        // CRITICAL: Set display and position styles
        pre.style.backgroundColor = "#f1f5f9";
        pre.style.border = "1px solid #e2e8f0";
        pre.style.borderRadius = "8px";
        pre.style.padding = "16px";
        pre.style.margin = "16px 0";
        pre.style.overflow = "auto";
        pre.style.fontFamily = 'Monaco, Consolas, "Courier New", monospace';
        pre.style.fontSize = "14px";
        pre.style.lineHeight = "1.5";
        pre.style.display = "block";
        pre.style.width = "100%";
        pre.style.boxSizing = "border-box";

        code.textContent =
          range.toString() ||
          '// Your code here\nconsole.log("Hello, World!");';
        pre.appendChild(code);

        if (blockParent) {
          // Insert after the block parent element
          blockParent.parentNode?.insertBefore(pre, blockParent.nextSibling);

          // Create a new paragraph after the code block for continued editing
          const newP = document.createElement("p");
          newP.innerHTML = "<br>";
          pre.parentNode?.insertBefore(newP, pre.nextSibling);

          // Move cursor to the new paragraph
          range.selectNodeContents(newP);
          range.collapse(true);
        } else {
          // Normal insertion
          range.deleteContents();
          range.insertNode(pre);

          // Create a new paragraph after the code block
          const newP = document.createElement("p");
          newP.innerHTML = "<br>";

          range.setStartAfter(pre);
          range.insertNode(newP);

          // Move cursor to the new paragraph
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
          // We're already in a list, don't create a nested list
          return;
        }

        const list = document.createElement(ordered ? "ol" : "ul");
        const li = document.createElement("li");

        // CRITICAL: Apply proper styles for storage and rendering
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
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const blockquote = document.createElement("blockquote");

        blockquote.style.borderLeft = "4px solid #3b82f6";
        blockquote.style.backgroundColor = "#eff6ff";
        blockquote.style.padding = "12px 16px";
        blockquote.style.margin = "16px 0";
        blockquote.style.borderRadius = "4px";
        blockquote.style.fontStyle = "italic";
        blockquote.style.display = "block";

        blockquote.textContent =
          range.toString() || "Insert your quote here...";

        range.deleteContents();
        range.insertNode(blockquote);

        // Move cursor after blockquote
        range.setStartAfter(blockquote);
        range.setEndAfter(blockquote);
        selection.removeAllRanges();
        selection.addRange(range);

        handleInput();
      }
    };

    const checkCurrentFormat = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return {};

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
    };

    const [currentFormat, setCurrentFormat] = useState(checkCurrentFormat());

    const updateFormatState = () => {
      setCurrentFormat(checkCurrentFormat());
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
        editor.addEventListener("input", updateFormatState);
        editor.addEventListener("keyup", updateFormatState);
        editor.addEventListener("mouseup", updateFormatState);

        return () => {
          document.removeEventListener(
            "selectionchange",
            handleSelectionChange,
          );
          editor.removeEventListener("input", updateFormatState);
          editor.removeEventListener("keyup", updateFormatState);
          editor.removeEventListener("mouseup", updateFormatState);
        };
      }
    }, [isEditorReady]);

    interface ToolbarButton {
      icon?: typeof Bold;
      command?: () => void;
      tooltip?: string;
      active?: boolean;
      divider?: boolean;
    }

    const toolbarButtons: ToolbarButton[] = [
      // Text formatting
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

      // Divider
      { divider: true },

      // Headings
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

      // Divider
      { divider: true },

      // Lists
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

      // Divider
      { divider: true },

      // Code and Quote
      { icon: Code, command: insertCodeBlock, tooltip: "Code Block" },
      { icon: Quote, command: insertQuote, tooltip: "Quote" },

      // Divider
      { divider: true },

      // Alignment
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

      // Divider
      { divider: true },

      // History
      { icon: Undo, command: () => execCommand("undo"), tooltip: "Undo" },
      { icon: Redo, command: () => execCommand("redo"), tooltip: "Redo" },
    ];

    return (
      <div
        className={`border border-gray-300 rounded-lg bg-white ${className}`}
      >
        {/* Toolbar */}
        <div className="border-b border-gray-300 p-3 bg-gray-50 rounded-t-lg">
          <div className="flex flex-wrap gap-1 items-center">
            {toolbarButtons.map((button, index) => {
              if (button.divider) {
                return (
                  <div key={index} className="w-px h-6 bg-gray-300 mx-1" />
                );
              }

              if (!button.icon || !button.command) {
                return null;
              }

              const IconComponent = button.icon;
              const isActive = button.active || false;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={button.command}
                  className={`p-2 rounded hover:bg-gray-200 transition-colors duration-200 ${
                    isActive
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "text-gray-700"
                  }`}
                  title={button.tooltip}
                >
                  <IconComponent size={16} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Editor */}
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

          {/* Placeholder */}
          {!editorContent && (
            <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
              {placeholder}
            </div>
          )}
        </div>

        {/* CRITICAL: Enhanced styling for editor content that matches backend storage */}
        <style jsx>{`
          [contenteditable] {
            outline: none;
          }

          /* Heading Styles - CRITICAL FOR BACKEND STORAGE */
          [contenteditable] h1 {
            font-size: 1.875rem !important;
            font-weight: 700 !important;
            line-height: 1.2 !important;
            margin: 16px 0 12px 0 !important;
            color: #1f2937 !important;
            display: block !important;
          }

          [contenteditable] h2 {
            font-size: 1.5rem !important;
            font-weight: 600 !important;
            line-height: 1.3 !important;
            margin: 14px 0 10px 0 !important;
            color: #374151 !important;
            display: block !important;
          }

          [contenteditable] h3 {
            font-size: 1.25rem !important;
            font-weight: 600 !important;
            line-height: 1.4 !important;
            margin: 12px 0 8px 0 !important;
            color: #4b5563 !important;
            display: block !important;
          }

          [contenteditable] p {
            margin: 8px 0 !important;
            line-height: 1.6 !important;
            display: block !important;
          }

          /* List Styles - CRITICAL FOR BACKEND STORAGE */
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

          /* Code and Quote Styles - CRITICAL FIX */
          [contenteditable] pre {
            background-color: #f1f5f9 !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 8px !important;
            padding: 16px !important;
            margin: 16px 0 !important;
            overflow-x: auto !important;
            font-family: Monaco, Consolas, "Courier New", monospace !important;
            font-size: 14px !important;
            line-height: 1.5 !important;
            display: block !important;
            width: 100% !important;
            box-sizing: border-box !important;
            clear: both !important;
            white-space: pre-wrap !important;
          }

          [contenteditable] code {
            background-color: #f1f5f9 !important;
            padding: 2px 4px !important;
            border-radius: 4px !important;
            font-family: Monaco, Consolas, "Courier New", monospace !important;
            font-size: 0.9em !important;
          }

          [contenteditable] pre code {
            background-color: transparent !important;
            padding: 0 !important;
            border-radius: 0 !important;
            display: block !important;
          }

          [contenteditable] blockquote {
            border-left: 4px solid #3b82f6 !important;
            background-color: #eff6ff !important;
            padding: 12px 16px !important;
            margin: 16px 0 !important;
            border-radius: 4px !important;
            font-style: italic !important;
            display: block !important;
          }

          /* Text Formatting */
          [contenteditable] strong {
            font-weight: 700 !important;
          }

          [contenteditable] em {
            font-style: italic !important;
          }

          [contenteditable] u {
            text-decoration: underline !important;
          }

          [contenteditable] s {
            text-decoration: line-through !important;
          }

          /* Placeholder */
          [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
            font-style: italic;
          }

          /* Ensure proper block formatting */
          [contenteditable] div {
            min-height: 1.5em;
          }

          /* Fix any layout issues */
          [contenteditable] * {
            box-sizing: border-box;
          }
        `}</style>
      </div>
    );
  },
);

RichTextEditor.displayName = "RichTextEditor";

export { RichTextEditor };
export default RichTextEditor;
