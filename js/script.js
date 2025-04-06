document.addEventListener("DOMContentLoaded", function () {
  // DOM elements
  const codeEditor = document.getElementById("code-editor");
  const syntaxHighlighter = document.getElementById("syntax-highlighter");
  const codeContainer = document.getElementById("code-mirror-container");
  const executeBtn = document.getElementById("executeBtn");
  const clearTerminalBtn = document.getElementById("clearTerminalBtn");
  const terminal = document.getElementById("terminal");
  const copyBtn = document.getElementById("copyBtn");
  const executionStats = document.getElementById("executionStats");

  // Default code
  const defaultCode = `// Exemplo simples em JavaScript
console.log("Olá, mundo!");

// Prompt simulado
const nome = "Usuário";
console.log(\`Bem-vindo, \${nome}!\`);


`;

  // Tokens para highlight de JavaScript
  const jsTokens = {
    keywords: [
      "const", "let", "var", "function", "return", "if", "else", "for", "while", "do",
      "switch", "case", "default", "break", "continue", "new", "delete", "typeof",
      "instanceof", "void", "class", "extends", "super", "import", "export", "from",
      "as", "try", "catch", "finally", "throw", "async", "await", "yield", "of", "in"
    ],
    operators: [
      "+", "-", "*", "/", "%", "=", "!", "<", ">", "?", ":", ".", ",", ";",
      "===", "==", ">=", "<=", "++", "--", "&&", "||", "??", "?."
    ],
    builtins: [
      "console", "Math", "Date", "String", "Array", "Object", "Number",
      "Boolean", "RegExp", "Map", "Set", "Promise", "JSON", "Error"
    ],
    atoms: ["true", "false", "null", "undefined", "NaN", "Infinity"]
  };

  // Aplicar coloração de sintaxe ao código
  function applyHighlighting(code) {
    if (!code) {
      syntaxHighlighter.innerHTML = '<span class="cm-comment">// Digite seu código aqui...</span>';
      return;
    }

    let html = '';
    let inString = null; // Marca se estamos dentro de uma string
    let inComment = false; // Marca se estamos dentro de um comentário
    let token = '';
    let i = 0;

    function tokenize() {
      // Verifica se é uma keyword
      if (jsTokens.keywords.includes(token)) {
        return `<span class="cm-keyword">${token}</span>`;
      }
      // Verifica se é um operador
      else if (jsTokens.operators.includes(token)) {
        return `<span class="cm-operator">${token}</span>`;
      }
      // Verifica se é um builtin
      else if (jsTokens.builtins.includes(token)) {
        return `<span class="cm-builtin">${token}</span>`;
      }
      // Verifica se é um atom (boolean, null, etc)
      else if (jsTokens.atoms.includes(token)) {
        return `<span class="cm-atom">${token}</span>`;
      }
      // Números
      else if (/^\d+(\.\d+)?$/.test(token)) {
        return `<span class="cm-number">${token}</span>`;
      }
      // Qualquer outro token é tratado como variável/propriedade
      else if (token.length > 0) {
        return `<span class="cm-variable">${token}</span>`;
      }
      return '';
    }

    while (i < code.length) {
      const char = code[i];
      const nextChar = code[i + 1] || '';

      // Verificar comentários de linha
      if (char === '/' && nextChar === '/' && !inString) {
        // Processa qualquer token acumulado antes do comentário
        if (token) {
          html += tokenize();
          token = '';
        }

        // Encontra o fim da linha ou o fim do código
        const endOfLine = code.indexOf('\n', i);
        const commentContent = endOfLine === -1
          ? code.substring(i)
          : code.substring(i, endOfLine);

        html += `<span class="cm-comment">${escapeHTML(commentContent)}</span>`;
        i = endOfLine === -1 ? code.length : endOfLine;
        continue;
      }

      // Verificar strings
      if ((char === '"' || char === "'" || char === '`') && (i === 0 || code[i - 1] !== '\\')) {
        if (inString === null) {
          // Início de uma string
          if (token) {
            html += tokenize();
            token = '';
          }
          inString = char;
          html += `<span class="cm-string">${escapeHTML(char)}`;
        } else if (inString === char) {
          // Fim da string
          html += `${escapeHTML(char)}</span>`;
          inString = null;
        } else {
          // Outro tipo de aspas dentro da string
          html += escapeHTML(char);
        }
      }
      // Se estamos dentro de uma string, adicionar caractere
      else if (inString !== null) {
        html += escapeHTML(char);
      }
      // Identificadores e palavras-chave
      else if (/[a-zA-Z0-9_$]/.test(char)) {
        token += char;
      }
      // Espaços e quebras de linha
      else if (char === ' ' || char === '\t' || char === '\n') {
        if (token) {
          html += tokenize();
          token = '';
        }
        html += char;
      }
      // Operadores
      else {
        if (token) {
          html += tokenize();
          token = '';
        }

        // Verificar operadores compostos como ==, ===, etc.
        let op = char;
        if (jsTokens.operators.includes(char + nextChar)) {
          op = char + nextChar;
          i++;
        }

        if (jsTokens.operators.includes(op)) {
          html += `<span class="cm-operator">${escapeHTML(op)}</span>`;
        } else {
          html += escapeHTML(char);
        }
      }

      i++;
    }

    // Processar qualquer token restante
    if (token) {
      html += tokenize();
    }

    // Fechar qualquer string que não foi fechada
    if (inString !== null) {
      html += '</span>';
    }

    // Processar quebras de linha para melhor leitura
    html = html.replace(/\n/g, '<br>');

    syntaxHighlighter.innerHTML = html;
  }

  // Escapar caracteres HTML
  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Sincronizar a rolagem entre a textarea e o highlighter
  function syncScroll() {
    syntaxHighlighter.scrollTop = codeEditor.scrollTop;
    syntaxHighlighter.scrollLeft = codeEditor.scrollLeft;
  }

  // Função de cópia
  function copyCode() {
    navigator.clipboard.writeText(codeEditor.value).then(() => {
      const feedback = document.getElementById("copyFeedback");
      feedback.classList.add("active");
      setTimeout(() => feedback.classList.remove("active"), 2000);
    });
  }

  // Load saved code from localStorage or use default
  function loadSavedCode() {
    const savedCode = localStorage.getItem("js_code");
    codeEditor.value = savedCode || defaultCode;
    applyHighlighting(codeEditor.value);
  }

  // Save code to localStorage
  function saveCode() {
    localStorage.setItem("js_code", codeEditor.value);
  }

  // Write to terminal with optional class
  function writeToTerminal(text, className = "") {
    const entry = document.createElement("div");
    entry.className = `terminal-entry ${className}`;
    entry.textContent = text;
    terminal.appendChild(entry);
    terminal.scrollTop = terminal.scrollHeight;
  }

  // Função principal de limpeza (sem mensagem)
  function clearTerminalSilent() {
    terminal.innerHTML = "";
    executionStats.textContent = "";
  }

  // Função para limpar COM mensagem (usada pelo botão)
  function clearTerminalWithMessage() {
    clearTerminalSilent();
    writeToTerminal("[Sistema] Terminal limpo", "terminal-info");
  }

  // Execute JavaScript code
  function executeCode() {
    // Limpa o terminal silenciosamente antes de cada execução
    clearTerminalSilent();

    const code = codeEditor.value;

    if (!code.trim()) {
      writeToTerminal("Erro: Nenhum código para executar.", "terminal-error");
      return;
    }

    // Mantenha o restante do código igual...
    writeToTerminal("> Executando código JavaScript...", "terminal-info");
    const startTime = performance.now();

    try {
      const logs = [];
      const originalConsoleLog = console.log;

      // Captura dos logs
      console.log = (...args) => {
        logs.push(args.join(" "));
        originalConsoleLog(...args);
      };

      // Mock de input
      const mockInput = (prompt) => {
        writeToTerminal(prompt, "terminal-prompt");
        return "Usuário";
      };

      // Execução segura
      const userCode = new Function(
        "input",
        "console",
        `try {
          ${code}
        } catch (error) {
          console.log('Erro durante execução:', error.message);
        }`
      );

      userCode(mockInput, console);
      console.log = originalConsoleLog;

      // Exibir resultados
      if (logs.length > 0) {
        logs.forEach((line) => writeToTerminal(line));
      } else {
        writeToTerminal("Código executado sem saída.", "terminal-info");
      }
    } catch (error) {
      writeToTerminal(`Erro crítico: ${error.message}`, "terminal-error");
    }

    // Footer de execução
    writeToTerminal("┌────────────────────────────┐", "terminal-info");
    writeToTerminal("│      FIM DA EXECUÇÃO        │", "terminal-info");
    writeToTerminal("└────────────────────────────┘", "terminal-info");

    // Estatísticas
    const endTime = performance.now();
    executionStats.textContent = `⏱️ Tempo: ${(endTime - startTime).toFixed(
      2
    )}ms`;
    saveCode();
  }

  // Handle tab key in textarea
  function handleTabKey(e) {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = codeEditor.selectionStart;
      const end = codeEditor.selectionEnd;

      // Insert tab at cursor position
      codeEditor.value =
        codeEditor.value.substring(0, start) +
        "  " +
        codeEditor.value.substring(end);

      // Move cursor after the tab
      codeEditor.selectionStart = codeEditor.selectionEnd = start + 2;

      // Update highlighting
      applyHighlighting(codeEditor.value);
    }
  }

  // Correção: Função para posicionar corretamente o cursor
  function updateCursorPosition() {
    // Garante que o cursor esteja visível
    const selStart = codeEditor.selectionStart;
    const selEnd = codeEditor.selectionEnd;
    
    // Re-aplicar a seleção para garantir que o cursor se mantenha no lugar correto
    setTimeout(() => {
      codeEditor.selectionStart = selStart;
      codeEditor.selectionEnd = selEnd;
    }, 0);
  }

  // Garantir que o código e o layout estejam alinhados
  function updateLayout() {
    // Configuração corrigida para permitir scroll e interação natural
    syntaxHighlighter.style.overflow = "hidden"; // O codeContainer lidará com o scroll
    
    // Dimensões iguais
    codeEditor.style.height = "100%";
    codeEditor.style.width = "100%";
    syntaxHighlighter.style.height = "100%"; 
    syntaxHighlighter.style.width = "100%";
    
    // Garantir que o padding seja igual
    const computedStyle = window.getComputedStyle(codeContainer);
    const padding = computedStyle.padding;
    
    // Aplicar o mesmo padding para manter o alinhamento perfeito
    codeEditor.style.padding = padding;
    syntaxHighlighter.style.padding = padding;
    
    // Fonte e espaçamento
    const fontFamily = "'Fira Code', monospace";
    const lineHeight = "1.6";
    const fontSize = computedStyle.fontSize;
    
    codeEditor.style.fontFamily = fontFamily;
    codeEditor.style.lineHeight = lineHeight;
    codeEditor.style.fontSize = fontSize;
    
    syntaxHighlighter.style.fontFamily = fontFamily;
    syntaxHighlighter.style.lineHeight = lineHeight;
    syntaxHighlighter.style.fontSize = fontSize;
  }

  // Event Listeners
  executeBtn.addEventListener("click", executeCode);
  clearTerminalBtn.addEventListener("click", clearTerminalWithMessage);
  copyBtn.addEventListener("click", copyCode);

  codeEditor.addEventListener("keydown", handleTabKey);
  
  // Corrigido: Eventos atualizados para melhor sincronização
  codeEditor.addEventListener("input", function() {
    applyHighlighting(codeEditor.value);
    updateCursorPosition();
  });
  
  codeEditor.addEventListener("scroll", syncScroll);
  codeEditor.addEventListener("click", updateCursorPosition);
  codeEditor.addEventListener("keyup", updateCursorPosition);
  
  // Capturar mudanças de seleção para posicionamento preciso do cursor
  codeEditor.addEventListener("select", updateCursorPosition);

  window.addEventListener("resize", updateLayout);

  // Support for Ctrl+Enter to execute code
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.key === "Enter") {
      executeCode();
    }
  });

  // Initialize
  loadSavedCode();
  updateLayout();

  // Welcome message
  writeToTerminal("Terminal JavaScript Interativo", "terminal-info");
  writeToTerminal(
    "Escreva seu código e clique em Executar ou pressione Ctrl+Enter\n",
    "terminal-info"
  );
});