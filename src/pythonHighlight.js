// pythonHighlight.js - lightweight Python syntax highlighter (no CDN, no deps)
// Dracula palette tuned for the app's dark theme.
window.PythonHighlighter = (function () {
  'use strict';

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function span(color, text) {
    return '<span style="color:' + color + '">' + esc(text) + '</span>';
  }

  const KEYWORDS = new Set([
    'False','None','True','and','as','assert','async','await',
    'break','class','continue','def','del','elif','else','except',
    'finally','for','from','global','if','import','in','is',
    'lambda','nonlocal','not','or','pass','raise','return',
    'try','while','with','yield'
  ]);
  const BUILTINS = new Set([
    'abs','all','any','bin','bool','dict','dir','enumerate','float',
    'format','getattr','hasattr','hex','input','int','isinstance',
    'issubclass','iter','len','list','map','max','min','next',
    'object','open','ord','pow','print','range','repr','reversed',
    'round','set','setattr','slice','sorted','str','sum','super',
    'tuple','type','vars','zip'
  ]);

  // Dracula-inspired palette
  const C = {
    keyword:   '#ff79c6',
    builtin:   '#8be9fd',
    string:    '#f1fa8c',
    comment:   '#6272a4',
    number:    '#bd93f9',
    fn:        '#50fa7b',
    decorator: '#ffb86c',
  };

  function highlight(code) {
    let out = '';
    let i = 0;
    const n = code.length;

    while (i < n) {
      // Comment
      if (code[i] === '#') {
        let j = i;
        while (j < n && code[j] !== '\n') j++;
        out += span(C.comment, code.slice(i, j));
        i = j;
        continue;
      }

      // Triple-quoted string  """  or  '''
      const q3 = code.slice(i, i + 3);
      if (q3 === '"""' || q3 === "'''") {
        let j = i + 3;
        while (j < n && code.slice(j, j + 3) !== q3) {
          if (code[j] === '\\') j++;
          j++;
        }
        j += 3;
        out += span(C.string, code.slice(i, j));
        i = j;
        continue;
      }

      // f / r / b prefix before a string
      const pfx = code[i];
      if ('fFrRbBuU'.includes(pfx) && i + 1 < n && (code[i + 1] === '"' || code[i + 1] === "'")) {
        const q = code[i + 1];
        let j = i + 2;
        while (j < n && code[j] !== q && code[j] !== '\n') {
          if (code[j] === '\\') j++;
          j++;
        }
        j++;
        out += span(C.string, code.slice(i, j));
        i = j;
        continue;
      }

      // Single / double quoted string
      if (code[i] === '"' || code[i] === "'") {
        const q = code[i];
        let j = i + 1;
        while (j < n && code[j] !== q && code[j] !== '\n') {
          if (code[j] === '\\') j++;
          j++;
        }
        j++;
        out += span(C.string, code.slice(i, j));
        i = j;
        continue;
      }

      // Decorator  @name
      if (code[i] === '@') {
        let j = i + 1;
        while (j < n && /[\w.]/.test(code[j])) j++;
        out += span(C.decorator, code.slice(i, j));
        i = j;
        continue;
      }

      // Number literal  (digits, dots, underscore, optional exponent)
      if (/[0-9]/.test(code[i])) {
        let j = i;
        while (j < n && /[0-9._xXoObBa-fA-F]/.test(code[j])) j++;
        if (j < n && (code[j] === 'e' || code[j] === 'E')) {
          j++;
          if (j < n && (code[j] === '+' || code[j] === '-')) j++;
          while (j < n && /[0-9]/.test(code[j])) j++;
        }
        out += span(C.number, code.slice(i, j));
        i = j;
        continue;
      }

      // Identifier → keyword / builtin / function-call / plain
      if (/[a-zA-Z_]/.test(code[i])) {
        let j = i;
        while (j < n && /\w/.test(code[j])) j++;
        const word = code.slice(i, j);
        // peek past whitespace for '('
        let k = j;
        while (k < n && code[k] === ' ') k++;
        const callParen = code[k] === '(';

        if (KEYWORDS.has(word)) {
          out += span(C.keyword, word);
        } else if (callParen) {
          out += span(BUILTINS.has(word) ? C.builtin : C.fn, word);
        } else if (BUILTINS.has(word)) {
          out += span(C.builtin, word);
        } else {
          out += esc(word);
        }
        i = j;
        continue;
      }

      // Fallback: operators, punctuation, whitespace, newlines
      out += esc(code[i]);
      i++;
    }

    return out;
  }

  return { highlight };
})();
