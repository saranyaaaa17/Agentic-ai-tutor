import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter, monospace',
  themeVariables: {
    primaryColor: '#0ea5e9',
    primaryTextColor: '#e2e8f0',
    primaryBorderColor: '#0ea5e9',
    lineColor: '#475569',
    secondaryColor: '#1e293b',
    tertiaryColor: '#0f172a',
    background: '#0f172a',
    mainBkg: '#1e293b',
    nodeBorder: '#334155',
    clusterBkg: '#1e293b',
    titleColor: '#94a3b8',
    edgeLabelBackground: '#0f172a',
  }
});

let diagramCount = 0;

const Mermaid = ({ chart }) => {
  const ref = useRef(null);
  const [error, setError] = useState(null);
  const [svg, setSvg] = useState('');

  useEffect(() => {
    if (!chart) return;
    setError(null);
    const id = `mermaid-diagram-${++diagramCount}`;
    mermaid.render(id, chart)
      .then(({ svg: renderedSvg }) => {
        setSvg(renderedSvg);
      })
      .catch(err => {
        console.warn('[Mermaid] Render error:', err);
        setError('Could not render diagram.');
      });
  }, [chart]);

  if (error) {
    return (
      <div className="my-3 p-3 rounded-xl bg-rose-900/20 border border-rose-500/20 text-rose-400 text-xs font-mono">
        ⚠ Diagram syntax error — {error}
        <pre className="mt-2 text-slate-500 text-[10px] whitespace-pre-wrap">{chart}</pre>
      </div>
    );
  }

  if (!svg) return (
    <div className="my-3 flex items-center gap-2 text-slate-500 text-xs">
      <div className="w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      Rendering diagram...
    </div>
  );

  return (
    <div
      ref={ref}
      className="my-4 p-4 rounded-xl bg-slate-900/70 border border-white/10 overflow-x-auto flex justify-center"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default Mermaid;
