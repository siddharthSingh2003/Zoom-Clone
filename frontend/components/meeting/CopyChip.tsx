"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyChip({
  value,
  label,
  className = "",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable; ignore
    }
  };

  return (
    <button
      onClick={copy}
      title={`Copy ${label ?? value}`}
      className={`inline-flex items-center gap-1.5 rounded bg-white/10 px-2 py-1 font-mono text-sm text-gray-200 hover:bg-white/20 cursor-pointer ${className}`}
    >
      {label ?? value}
      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
    </button>
  );
}
