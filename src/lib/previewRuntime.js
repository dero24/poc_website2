// Dynamic preview runtime: detects packages, normalizes code, and builds HTML with CDNs

export const CDN_REGISTRY = {
  'react':       { url: 'https://unpkg.com/react@18/umd/react.development.js', global: 'React', critical: true },
  'react-dom':   { url: 'https://unpkg.com/react-dom@18/umd/react-dom.development.js', global: 'ReactDOM', critical: true },
  'framer-motion': { url: 'https://unpkg.com/framer-motion@11/dist/framer-motion.js', global: 'FramerMotion' },
  'lucide-react':  { url: 'https://unpkg.com/lucide-react@0.263.1/dist/umd/lucide-react.js', global: 'LucideReact' },
  'recharts':      { url: 'https://unpkg.com/recharts@2.8.0/umd/Recharts.js', global: 'Recharts' },
  'axios':         { url: 'https://unpkg.com/axios@1.5.0/dist/axios.min.js', global: 'axios' },
  'marked':        { url: 'https://unpkg.com/marked@9.1.2/marked.min.js', global: 'marked' },
  'prop-types':    { url: 'https://unpkg.com/prop-types@15.8.1/prop-types.min.js', global: 'PropTypes' }
};

export function detectPackages(code = '') {
  const registry = {
    'react': [/\bReact\b/, /from\s+['"]react['"]/],
    'react-dom': [/\bReactDOM\b/, /from\s+['"]react-dom['"]/],
    'framer-motion': [/from\s+['"]framer-motion['"]/ , /\bmotion\./, /\bAnimatePresence\b/],
    'lucide-react': [/from\s+['"]lucide-react['"]/ , /<\s*Lucide[\s>]/],
    'recharts': [/from\s+['"]recharts['"]/ , /\b(LineChart|BarChart|PieChart|AreaChart|XAxis|YAxis)\b/],
    'axios': [/from\s+['"]axios['"]/ , /\baxios\./],
    'marked': [/from\s+['"]marked['"]/ , /\bmarked\./],
    'prop-types': [/from\s+['"]prop-types['"]/ , /\bPropTypes\./]
  };

  const detected = new Set(['react', 'react-dom']);
  for (const [pkg, tests] of Object.entries(registry)) {
    if (tests.some((r) => r.test(code))) detected.add(pkg);
  }

  const cdnImports = Array.from(code.matchAll(/from\s+['"](https?:\/\/[^'"\s]+)['"]/g)).map(m => m[1]);
  const bareImports = Array.from(code.matchAll(/from\s+['"]([^'"\s]+)['"]/g)).map(m => m[1]);
  const unknown = bareImports.filter((name) => !CDN_REGISTRY[name] && !/^https?:\/\//.test(name) && !['react','react-dom'].includes(name));

  const hasEsm = /\bimport\b|\bexport\b/.test(code);
  const ambiguous = unknown.length > 0 || (hasEsm && bareImports.length > 0);

  return { packages: Array.from(detected), cdnImports, unknown, ambiguous };
}

function stripESM(code = '') {
  let cleaned = code.replace(/```jsx?\n?/gi, '').replace(/```/g, '');
  const lines = cleaned.split('\n').filter((line) => !line.trim().startsWith('import '));
  cleaned = lines.join('\n');

  cleaned = cleaned.replace(/export\s+default\s+function\s+([A-Za-z0-9_]+)\s*\(/g, 'function $1(');
  cleaned = cleaned.replace(/export\s+default\s+class\s+([A-Za-z0-9_]+)\s*/g, 'class $1 ');
  cleaned = cleaned.replace(/export\s+default\s+const\s+([A-Za-z0-9_]+)\s*=\s*/g, 'const $1 = ');
  cleaned = cleaned.replace(/export\s+default\s+let\s+([A-Za-z0-9_]+)\s*=\s*/g, 'let $1 = ');
  cleaned = cleaned.replace(/export\s+default\s*\(/g, 'const GeneratedApp = (');
  cleaned = cleaned.replace(/export\s+default\s*;/g, '');
  cleaned = cleaned.replace(/export\s+default\s+([A-Za-z0-9_]+)\s*;/g, '');
  return cleaned.trim();
}

export function transformAppCode(code = '') {
  const stripped = stripESM(code);
  const prelude = [
    'const React = window.React;',
    'const ReactDOM = window.ReactDOM;',
    'const { useState, useEffect, useRef, useMemo, useCallback, Fragment, forwardRef, Component } = React || {};',
    'const { motion, AnimatePresence } = window;',
    'const PropTypes = window.PropTypes;',
    'const Recharts = window.Recharts || {};',
    'const { LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = Recharts;'
  ].join('\n');

  const render = `
try {
  const AppComponent = (typeof App !== 'undefined') ? App : (typeof GeneratedApp !== 'undefined' ? GeneratedApp : (typeof window !== 'undefined' && window.__APP_DEFAULT__) || (function(){ return React.createElement('div', { className: 'p-8 text-center' }, 'App component not found'); }));
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(React.createElement(AppComponent));
  window.parent && window.parent.postMessage({ type: 'preview-loaded', success: true }, '*');
} catch (error) {
  console.error('Preview render error:', error);
  window.parent && window.parent.postMessage({ type: 'preview-error', error: error?.message || 'Render error' }, '*');
}`.trim();

  return `${prelude}\n\n${stripped}\n\n${render}`;
}

function installFallbacksSource() {
  return `(${function installFallbacks(){
    window.React ||= { createElement:(t,p,...c)=>({t,p,c}), forwardRef:(fn)=>fn, useState:(v)=>[v,()=>{}], useEffect:()=>{}, useRef:()=>({current:null}), useMemo:(f)=>f(), useCallback:(f)=>f, Fragment:'fragment', Component:class{ setState(){} } };
    window.ReactDOM ||= { createRoot: () => ({ render: ()=>{} }) };
    if (!window.motion) {
      window.motion = new Proxy({}, { get:(_,tag)=> (props={}) => {
        const { children, ...rest } = props || {}; const clean={...rest}; delete clean.initial; delete clean.animate; delete clean.exit; delete clean.transition; delete clean.variants; delete clean.whileHover; delete clean.whileTap; delete clean.drag; delete clean.dragConstraints; return React.createElement(tag, clean, children);
      }});
      window.AnimatePresence ||= ({children}) => children || null;
    }
    window.Lucide ||= ({ name, className, ...rest }) => React.createElement('span', { className, ...rest }, name || 'icon');
    window.Recharts ||= {}; ['LineChart','BarChart','PieChart','AreaChart','Line','Bar','Pie','Area','XAxis','YAxis','CartesianGrid','Tooltip','Legend','ResponsiveContainer'].forEach(k=>{window.Recharts[k] ||= (()=>null)});
    window.PropTypes ||= { oneOfType: ()=>null, shape: ()=>null, arrayOf: ()=>null, string:null, number:null, bool:null, func:null, object:null, node:null };
  }}).toString() )()`;
}

function makeScriptTag({ src, content, type, async, defer, crossorigin, integrity }) {
  const attrs = [];
  if (type) attrs.push(`type="${type}"`);
  if (src) attrs.push(`src="${src}"`);
  if (async) attrs.push('async');
  if (defer) attrs.push('defer');
  if (crossorigin) attrs.push(`crossorigin="${crossorigin}"`);
  if (integrity) attrs.push(`integrity="${integrity}"`);
  const attrString = attrs.length ? ' ' + attrs.join(' ') : '';
  if (content) {
    return `<script${attrString}>${content.replace(/<\/(script)/gi, '<\\/$1')}</script>`;
  }
  return `<script${attrString}></script>`;
}

export function buildPreviewHTML(code = '', detection = null) {
  const det = detection || detectPackages(code);
  const critical = ['react','react-dom'];
  const scripts = [
    { src: 'https://unpkg.com/@babel/standalone/babel.min.js' },
    { src: 'https://cdn.tailwindcss.com' },
    ...critical.map((k) => ({ src: CDN_REGISTRY[k].url })),
    ...det.packages.filter((k)=>!critical.includes(k)).map((k) => CDN_REGISTRY[k]?.url ? ({ src: CDN_REGISTRY[k].url }) : null).filter(Boolean),
    ...det.cdnImports.map((url) => ({ src: url }))
  ];

  const head = scripts.map((s)=> makeScriptTag({ src: s.src, crossorigin: 'anonymous' })).join('\n');
  const fallbacks = makeScriptTag({ content: installFallbacksSource() });
  const transformed = transformAppCode(code);
  const appScript = makeScriptTag({ type: 'text/babel', content: transformed });
  const bridge = makeScriptTag({ content: `(()=>{const ok=()=>parent&&parent.postMessage({type:'preview-loaded',success:true},'*');if(document.readyState==='complete'){ok()}else{addEventListener('load',ok,{once:true})}addEventListener('error',(e)=>{const m=(e.error&&e.error.message)||e.message||'Preview error';parent&&parent.postMessage({type:'preview-error',error:m},'*')});})();` });

  return `<!DOCTYPE html><html><head>${head}</head><body><div id="root"></div>${fallbacks}${appScript}${bridge}</body></html>`;
}
