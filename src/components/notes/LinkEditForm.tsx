import React, { useState, useEffect } from 'react';
import { X, Check, Loader2 } from 'lucide-react';

interface LinkEditFormProps {
  initialTitle: string;
  initialUrl: string;
  onSave: (title: string, url: string) => void;
  onCancel: () => void;
}

export const LinkEditForm: React.FC<LinkEditFormProps> = ({
  initialTitle,
  initialUrl,
  onSave,
  onCancel
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Auto-fetch if title is empty and we have a valid-looking URL
    if (url && !initialTitle && !title && url.match(/^https?:\/\//)) {
      fetchTitle(url);
    }
  }, []);

  const fetchTitle = async (targetUrl: string) => {
    setLoading(true);
    try {
      // Priority 1: Noembed (Great for YouTube, Vimeo, etc. and CORS friendly)
      const noembedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(targetUrl)}`);
      const noembedData = await noembedRes.json();
      if (noembedData.title) {
        setTitle(noembedData.title);
        return;
      }
    } catch (e) {
      // Try generic fallback
    }

    try {
      // Priority 2: Microlink
      const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(targetUrl)}`);
      const data = await res.json();
      if (data.status === 'success' && data.data.title) {
        setTitle(data.data.title);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-1 bg-[#171717] border border-[#262626] rounded px-1.5 py-0.5 align-middle" onClick={e => e.stopPropagation()}>
      <div className="relative">
        <input
          autoFocus
          className={`bg-[#262626] text-[10px] text-[#e5e5e5] placeholder-[#525252] outline-none w-20 rounded-sm px-1 border-none ${loading ? 'pr-4' : ''}`}
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => {
            e.stopPropagation();
            if (e.key === 'Enter') onSave(title, url);
            if (e.key === 'Escape') onCancel();
          }}
        />
        {loading && <Loader2 size={8} className="absolute right-1 top-1/2 -translate-y-1/2 animate-spin text-[#737373]" />}
      </div>
      <input
        className="bg-transparent text-[10px] text-[#737373] placeholder-[#525252] outline-none w-24 border-b border-[#262626] focus:border-[#404040]"
        placeholder="URL"
        value={url}
        onChange={e => setUrl(e.target.value)}
        onBlur={() => {
          if (url && !title && url !== initialUrl) fetchTitle(url);
        }}
        onKeyDown={e => {
          e.stopPropagation();
          if (e.key === 'Enter') onSave(title, url);
          if (e.key === 'Escape') onCancel();
        }}
      />
      <button onClick={onCancel} className="text-[#737373] hover:text-[#e5e5e5]"><X size={10} /></button>
      <button
        onClick={() => onSave(title, url)}
        className="text-green-500 hover:text-green-400"
      ><Check size={10} /></button>
    </span>
  );
};
