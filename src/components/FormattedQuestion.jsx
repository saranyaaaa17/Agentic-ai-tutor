import React from 'react';

/**
 * Formats question text to properly display:
 * - Code blocks with syntax highlighting
 * - Inline code with monospace font
 * - Mathematical equations in readable format
 * - Proper line breaks and indentation
 */
export const FormattedQuestion = ({ text }) => {
  if (!text) return null;

  // Split by code blocks (```...```)
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index)
      });
    }

    // Add code block
    parts.push({
      type: 'code-block',
      language: match[1] || 'text',
      content: match[2].trim()
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex)
    });
  }

  // If no code blocks found, treat entire text as one part
  if (parts.length === 0) {
    parts.push({ type: 'text', content: text });
  }

  return (
    <div className="text-2xl md:text-3xl font-bold text-white leading-snug">
      <div className="space-y-4">
        {parts.map((part, index) => {
          if (part.type === 'code-block') {
            return (
              <pre
                key={index}
                className="bg-slate-950 border border-cyan-500/20 rounded-xl p-4 overflow-x-auto my-4"
              >
                <code className="text-cyan-300 font-mono text-sm md:text-base leading-relaxed font-normal">
                  {part.content}
                </code>
              </pre>
            );
          } else {
            // Process inline code and backticks
            return (
              <div key={index} className="leading-snug">
                {formatInlineCode(part.content)}
              </div>
            );
          }
        })}
      </div>
    </div>
  );
};

/**
 * Format inline code (text with `backticks`) and equations
 */
const formatInlineCode = (text) => {
  // Split by inline code (`...`)
  const inlineCodeRegex = /`([^`]+)`/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = inlineCodeRegex.exec(text)) !== null) {
    // Add text before inline code
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.slice(lastIndex, match.index)}
        </span>
      );
    }

    // Add inline code
    parts.push(
      <code
        key={`code-${match.index}`}
        className="bg-slate-800/60 text-cyan-400 px-2 py-0.5 rounded font-mono text-sm border border-cyan-500/20"
      >
        {match[1]}
      </code>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(
      <span key={`text-${lastIndex}`}>
        {text.slice(lastIndex)}
      </span>
    );
  }

  return parts.length > 0 ? parts : text;
};

export default FormattedQuestion;
