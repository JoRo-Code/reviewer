
import { StreamLanguage } from '@codemirror/language';
import { go } from '@codemirror/legacy-modes/mode/go';
import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night';
import CodeMirror from '@uiw/react-codemirror';
import { FC, useEffect, useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';



interface Props {
  html: string;
  editable?: boolean;
  onChange?: (value: string) => void;
}

export const HtmlBlock: FC<Props> = ({
  html,
  editable = false,
  onChange = () => {},
}) => {
  const [copyText, setCopyText] = useState<string>('Copy');
  const sanitizedHTML = DOMPurify.sanitize(html);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCopyText('Copy');
    }, 2000);

    return () => clearTimeout(timeout);
  }, [copyText]);

  return (
    <div className="relative">
      <button
        className="absolute right-0 top-0 z-10 rounded bg-[#1A1B26] p-1 text-xs text-white hover:bg-[#2D2E3A] active:bg-[#2D2E3A]"
        onClick={() => {
          navigator.clipboard.writeText(html);
          setCopyText('Copied!');
        }}
      >
        {copyText}
      </button>

    <div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} /></div>
  );
};