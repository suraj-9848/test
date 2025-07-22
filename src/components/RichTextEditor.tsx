import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { debounce } from "lodash";

export type RichTextEditorHandle = {
  getContent: () => string;
  setContent: (content: string) => void;
};

interface RichTextEditorProps {
  initialContent?: string;
  onChange?: (html: string) => void;
}

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(
  ({ initialContent, onChange }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<Quill | null>(null);
    const quillContainerId = useRef<string>(
      `quill-editor-${Math.random().toString(36).substr(2, 9)}`
    );
    const isUpdatingContent = useRef(false);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      const editorDiv = document.createElement("div");
      editorDiv.id = quillContainerId.current;
      editorDiv.style.height = "300px";
      editorDiv.style.border = "1px solid #ccc";
      editorDiv.style.borderRadius = "4px";
      container.appendChild(editorDiv);
      const quillInstance = new Quill(editorDiv, {
        theme: "snow",
        modules: {
          toolbar: [
            ["blockquote", "code-block"],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["clean"],
          ],
          keyboard: {
            bindings: {
              tab: {
                key: 9,
                handler: function (
                  range: { index: number; length: number },
                  context: { quill: Quill }
                ) {
                  context.quill.insertText(range.index, "    ");
                  context.quill.setSelection(range.index + 4, 0);
                  return true;
                },
              },
            },
          },
        },
        placeholder: "Write your question here...",
      });
      quillRef.current = quillInstance;
      if (initialContent) {
        isUpdatingContent.current = true;
        quillInstance.setContents(
          quillInstance.clipboard.convert({ html: initialContent || "" })
        );
        isUpdatingContent.current = false;
      }
      if (onChange) {
        const debouncedOnChange = debounce((html: string) => {
          if (!isUpdatingContent.current) {
            onChange(html);
          }
        }, 300);
        quillInstance.on("text-change", () => {
          debouncedOnChange(quillInstance.root.innerHTML);
        });
        return () => {
          quillInstance.off("text-change");
          debouncedOnChange.cancel();
        };
      }
      return () => {
        if (quillRef.current) {
          quillRef.current.off("text-change");
          quillRef.current = null;
        }
        if (container) {
          while (container.firstChild) {
            container.removeChild(container.firstChild);
          }
        }
      };
    }, [initialContent, onChange]);

    useEffect(() => {
      if (
        quillRef.current &&
        initialContent !== undefined &&
        !isUpdatingContent.current
      ) {
        const currentHtml = quillRef.current.root.innerHTML;
        const normalize = (str: string) => str.replace(/\s+/g, "").trim();
        if (normalize(currentHtml) !== normalize(initialContent)) {
          isUpdatingContent.current = true;
          const selection = quillRef.current.getSelection();
          quillRef.current.setContents(
            quillRef.current.clipboard.convert({ html: initialContent || "" })
          );
          if (selection) {
            quillRef.current.setSelection(selection.index, selection.length);
          }
          isUpdatingContent.current = false;
        }
      }
    }, [initialContent]);

    useImperativeHandle(ref, () => ({
      getContent: () => {
        return quillRef.current ? quillRef.current.root.innerHTML : "";
      },
      setContent: (content: string) => {
        if (quillRef.current && !isUpdatingContent.current) {
          isUpdatingContent.current = true;
          const selection = quillRef.current.getSelection();
          quillRef.current.setContents(
            quillRef.current.clipboard.convert({ html: content || "" })
          );
          if (selection) {
            quillRef.current.setSelection(selection.index, selection.length);
          }
          isUpdatingContent.current = false;
        }
      },
    }));

    return <div ref={containerRef} />;
  }
);

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;
