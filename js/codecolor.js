// Configuração do Monaco Editor
require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});
        
let editor;
require(['vs/editor/editor.main'], () => {
    editor = monaco.editor.create(document.getElementById('codeEditor'), {
        value: localStorage.getItem("js_code") || `// Bem-vindo ao JS Terminal Pro
console.log("Execute códigos JavaScript em tempo real");

// Exemplo interativo
const calcularFatorial = n => 
n <= 1 ? 1 : n * calcularFatorial(n - 1);

console.log(\`Fatorial de 5: \${calcularFatorial(5)}\`);`,
        language: 'javascript',
        theme: 'vs-dark',
        fontFamily: 'Fira Code',
        fontSize: 14,
        lineNumbers: 'on',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        padding: { top: 20 },
        renderLineHighlight: 'none',
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
            useShadows: false
        },
        guides: { indentation: false }
    });

    // Tema Personalizado
    monaco.editor.defineTheme('moonlight-pro', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'keyword', foreground: '#6cb6ff' },
            { token: 'string', foreground: '#a3d4a9' },
            { token: 'number', foreground: '#d4a1ff' },
            { token: 'comment', foreground: '#4a4a6a', fontStyle: 'italic' },
            { token: 'operator', foreground: '#ff8f88' },
            { token: 'identifier', foreground: '#e3e4e6' }
        ],
        colors: {
            'editor.background': '#1a1a2f',
            'editor.foreground': '#e3e4e6',
            'editorLineNumber.foreground': '#4a4a6a',
            'editorCursor.foreground': '#6cb6ff',
            'editor.selectionBackground': '#6cb6ff30'
        }
    });
    monaco.editor.setTheme('moonlight-pro');
});

// Sistema de Cópia com Feedback
document.getElementById('copyBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(editor.getValue()).then(() => {
        const feedback = document.getElementById('copyFeedback');
        feedback.style.opacity = '1';
        setTimeout(() => feedback.style.opacity = '0', 1500);
    });
});

// Adicione no final do script.js
window.addEventListener('resize', () => {
  if(editor) {
      editor.layout();
  }
});