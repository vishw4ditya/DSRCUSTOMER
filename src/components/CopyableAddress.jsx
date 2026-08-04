import { useState } from 'react';

export default function CopyableAddress({ address }) {
  const [copied, setCopied] = useState(false);

  if (!address) return <span>-</span>;

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      // Fallback for browsers/contexts where the Clipboard API is unavailable
      const textarea = document.createElement('textarea');
      textarea.value = address;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <span className="copyable-address">
      <span className="copyable-address-text">{address}</span>
      <button
        type="button"
        className="copy-icon-btn"
        onClick={handleCopy}
        title="Copy full address"
        aria-label="Copy full address"
      >
        {copied ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
      {copied && <span className="copy-toast">Copied</span>}
    </span>
  );
}
