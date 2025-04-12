document.addEventListener("DOMContentLoaded", function () {
  // DOM elements
  const codeEditor = document.getElementById("code-editor");
  const syntaxHighlighter = document.getElementById("syntax-highlighter");
  const codeContainer = document.getElementById("code-mirror-container");
  const executeBtn = document.getElementById("executeBtn");
  const clearTerminalBtn = document.getElementById("clearTerminalBtn");
  const clearCodeBtn = document.getElementById("clearCodeBtn");
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

  // Lista de palavras-chave potencialmente perigosas
  const dangerousKeywords = [
    "document",
    "window",
    "localStorage",
    "sessionStorage",
    "navigator",
    "location",
    "history",
    "fetch",
    "XMLHttpRequest",
    "WebSocket",
    "Worker",
    "eval",
    "Function",
    "setTimeout",
    "setInterval",
    "parent",
    "top",
    "frames",
    "globalThis",
    "constructor",
    "prototype",
    "__proto__",
    "RegExp",
    "Promise.resolve().constructor",
  ];

// Tokens para highlight de JavaScript
const jsTokens = {
  keywords: [
    "const", "let", "var", "function", "return", "if", "else", "for", "while", "do", 
    "switch", "case", "default", "break", "continue", "new", "delete", "typeof", 
    "instanceof", "void", "class", "extends", "super", "import", "export", "from", 
    "as", "try", "catch", "finally", "throw", "async", "await", "yield", "of", "in",
    "get", "set", "static", "this"
  ],
  operators: [
    "+", "-", "*", "/", "%", "=", "!", "<", ">", "?", ":", ".", ",", ";", "===", "==", 
    ">=", "<=", "++", "--", "&&", "||", "??", "?.", "+=", "-=", "*=", "/=", "%=", "!==", 
    "!=", "&", "|", "^", "<<", ">>", ">>>"
  ],
  builtins: [
    // Core objects e functions
    "console", "Math", "Date", "String", "Array", "Object", "Number", "Boolean", 
    "RegExp", "Map", "Set", "Promise", "JSON", "Error", "Symbol", 
    "parseInt", "parseFloat","alert", "prompt", "confirm",
    
    // Array Methods mais usados
    "push", "pop", "shift", "unshift", "splice", "slice", "concat", "join", 
    "forEach", "map", "filter", "reduce", "find", "includes", "sort",
    
    // String Methods mais usados
    "replace", "split", "substring", "toLowerCase", "toUpperCase", "trim", 
    "indexOf", "startsWith", "endsWith",
    
    // Object Methods mais usados
    "keys", "values", "entries", "assign", "hasOwnProperty",
    
    // Promise Methods
    "then", "catch", "finally", "all", "resolve", "reject"
  ],
  atoms: [
    "true", "false", "null", "undefined", "NaN", "Infinity"
  ],
  brackets: [
    "(", ")", "{", "}", "[", "]"
  ]
};

  // Aplicar coloração de sintaxe ao código
  function applyHighlighting(code) {
    if (!code) {
      syntaxHighlighter.innerHTML =
        '<span class="cm-comment">// Digite seu código aqui...</span>';
      return;
    }

    let html = "";
    let inString = null; // Marca se estamos dentro de uma string
    let inComment = false; // Marca se estamos dentro de um comentário
    let inTemplateInterpolation = false; // Marca se estamos dentro de uma interpolação ${...}
    let interpolationDepth = 0; // Contador para chaves aninhadas dentro da interpolação
    let token = "";
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
      // Destacar palavras potencialmente perigosas
      else if (dangerousKeywords.includes(token)) {
        return `<span class="cm-dangerous">${token}</span>`;
      }
      // Qualquer outro token é tratado como variável/propriedade
      else if (token.length > 0) {
        return `<span class="cm-variable">${token}</span>`;
      }
      return "";
    }

    while (i < code.length) {
      const char = code[i];
      const nextChar = code[i + 1] || "";

      // Verificar comentários de linha
      if (
        char === "/" &&
        nextChar === "/" &&
        !inString &&
        !inTemplateInterpolation
      ) {
        // Processa qualquer token acumulado antes do comentário
        if (token) {
          html += tokenize();
          token = "";
        }

        // Encontra o fim da linha ou o fim do código
        const endOfLine = code.indexOf("\n", i);
        const commentContent =
          endOfLine === -1 ? code.substring(i) : code.substring(i, endOfLine);

        html += `<span class="cm-comment">${escapeHTML(commentContent)}</span>`;
        i = endOfLine === -1 ? code.length : endOfLine;
        continue;
      }

      // Se estamos em uma interpolação de template string
      if (inTemplateInterpolation) {
        // Verificar chaves aninhadas
        if (char === "{") {
          if (token) {
            html += tokenize();
            token = "";
          }
          html += `<span class="cm-bracket">${escapeHTML(char)}</span>`;
          interpolationDepth++;
        } else if (char === "}") {
          if (token) {
            html += tokenize();
            token = "";
          }
          interpolationDepth--;

          if (interpolationDepth === 0) {
            // Fim da interpolação
            inTemplateInterpolation = false;
            html += `<span class="cm-bracket">}</span><span class="cm-string">`; // Reabre a string
          } else {
            html += `<span class="cm-bracket">${escapeHTML(char)}</span>`;
          }
        } else if (/[a-zA-Z0-9_$]/.test(char)) {
          token += char;
        } else if (char === " " || char === "\t" || char === "\n") {
          if (token) {
            html += tokenize();
            token = "";
          }
          html += char;
        } else {
          if (token) {
            html += tokenize();
            token = "";
          }

          // Verifica se é um bracket
          if (jsTokens.brackets.includes(char)) {
            html += `<span class="cm-bracket">${escapeHTML(char)}</span>`;
          }
          // Verifica operadores compostos
          else {
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
        }
      }
      // Verificar strings
      else if (
        (char === '"' || char === "'" || char === "`") &&
        (i === 0 || code[i - 1] !== "\\")
      ) {
        if (inString === null) {
          // Início de uma string
          if (token) {
            html += tokenize();
            token = "";
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
      // Se estamos dentro de uma string template, verifique interpolação
      else if (inString === "`" && char === "$" && nextChar === "{") {
        html += `</span>`; // Fecha a span da string
        html += `<span class="cm-operator">${escapeHTML("$")}</span>`;
        html += `<span class="cm-bracket">${escapeHTML("{")}</span>`;
        inTemplateInterpolation = true;
        interpolationDepth = 1;
        i++; // Pular o '{'
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
      else if (char === " " || char === "\t" || char === "\n") {
        if (token) {
          html += tokenize();
          token = "";
        }
        html += char;
      }
      // Operadores
      else {
        if (token) {
          html += tokenize();
          token = "";
        }

        // Verifica se é um bracket
        if (jsTokens.brackets.includes(char)) {
          html += `<span class="cm-bracket">${escapeHTML(char)}</span>`;
        }
        // Verifica operadores compostos
        else {
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
      }
      i++;
    }

    // Processar qualquer token restante
    if (token) {
      html += tokenize();
    }

    // Fechar qualquer string que não foi fechada
    if (inString !== null || inTemplateInterpolation) {
      html += "</span>";
    }

    // Processar quebras de linha para melhor leitura
    html = html.replace(/\n/g, "<br>");

    syntaxHighlighter.innerHTML = html;
  }

  // Escapar caracteres HTML
  function escapeHTML(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Sincronizar a rolagem entre a textarea e o highlighter
  function syncScroll() {
    syntaxHighlighter.scrollLeft = codeEditor.scrollLeft;
    syntaxHighlighter.scrollTop = codeEditor.scrollTop;
  }

  // Função de cópia
  function copyCode() {
    navigator.clipboard.writeText(codeEditor.value).then(() => {
      const feedback = document.getElementById("copyFeedback");
      feedback.classList.add("active");
      setTimeout(() => feedback.classList.remove("active"), 2000);
    });
  }

  // Verifica código em busca de palavras-chave perigosas
  function checkCodeSecurity(code) {
    const securityIssues = [];

    // Verificar acesso ao DOM e outros objetos perigosos
    dangerousKeywords.forEach((keyword) => {
      // Verifica palavras-chave perigosas (evita falsos positivos em strings)
      const regex = new RegExp(`(^|[^"'\\w])${keyword}\\s*(\\.|\\[|\\()`, "g");
      let match;

      while ((match = regex.exec(code)) !== null) {
        securityIssues.push({
          keyword: keyword,
          position: match.index + match[1].length,
        });
      }
    });

    // Verificar uso de eval e Function
    const evalRegex = /\beval\s*\(/g;
    const functionRegex = /\bnew\s+Function\s*\(/g;

    let match;
    while ((match = evalRegex.exec(code)) !== null) {
      securityIssues.push({
        keyword: "eval",
        position: match.index,
      });
    }

    while ((match = functionRegex.exec(code)) !== null) {
      securityIssues.push({
        keyword: "new Function",
        position: match.index,
      });
    }

    // Verificar possíveis loops infinitos
    const potentialInfiniteLoops = checkForInfiniteLoops(code);
    potentialInfiniteLoops.forEach((issue) => {
      securityIssues.push({
        keyword: "possível loop infinito",
        position: 0,
        message: issue.message,
      });
    });

    return securityIssues;
  }

  // Função para obter alternativas seguras baseadas na palavra-chave bloqueada
  function getSafeAlternative(keyword) {
    const alternatives = {
      "document": {
        explanation: "Acesso ao DOM (Document Object Model) não é permitido neste ambiente por razões de segurança.",
        alternative: "Este ambiente é focado em lógica JavaScript pura. Para manipulação de DOM, considere usar frameworks online como CodePen ou JSFiddle."
      },
      "window": {
        explanation: "Acesso ao objeto global 'window' não é permitido por razões de segurança.",
        alternative: "Você pode usar variáveis locais e objetos personalizados para simular funcionalidades."
      },
      "localStorage": {
        explanation: "Acesso ao localStorage não é permitido neste ambiente sandbox.",
        alternative: "Você pode simular armazenamento usando objetos JavaScript:\n\nconst storage = {};\nstorage.setItem = (key, value) => { storage[key] = value; };\nstorage.getItem = (key) => storage[key];"
      },
      "sessionStorage": {
        explanation: "Acesso ao sessionStorage não é permitido neste ambiente sandbox.",
        alternative: "Você pode simular armazenamento usando objetos JavaScript:\n\nconst session = {};\nsession.setItem = (key, value) => { session[key] = value; };\nsession.getItem = (key) => session[key];"
      },
      "navigator": {
        explanation: "Acesso ao objeto navigator (informações do navegador) não é permitido por questões de privacidade.",
        alternative: "Se você está tentando aprender sobre detecção de navegador, pode criar um objeto simulado:\n\nconst mockNavigator = { userAgent: 'Chrome/98.0' };"
      },
      "location": {
        explanation: "Acesso ao objeto location não é permitido para evitar redirecionamentos ou vazamento de informações.",
        alternative: "Para simular URLs, você pode usar uma string:\n\nconst currentURL = 'https://exemplo.com/pagina';"
      },
      "history": {
        explanation: "Acesso ao histórico de navegação não é permitido por razões de segurança.",
        alternative: "Para simular navegação, você pode criar um array de estados:\n\nconst mockHistory = [];\nmockHistory.push('/pagina1');"
      },
      "fetch": {
        explanation: "Requisições de rede não são permitidas neste ambiente sandbox.",
        alternative: "Você pode simular respostas de API:\n\nconst mockFetch = () => Promise.resolve({\n  json: () => Promise.resolve({ data: 'Resposta simulada' })\n});"
      },
      "XMLHttpRequest": {
        explanation: "Requisições XHR não são permitidas neste ambiente sandbox.",
        alternative: "Você pode simular respostas de API com objetos e Promises."
      },
      "WebSocket": {
        explanation: "Conexões WebSocket não são permitidas neste ambiente sandbox.",
        alternative: "Você pode simular comunicação em tempo real com eventos temporizados usando setTimeout."
      },
      "eval": {
        explanation: "A função eval() é extremamente perigosa pois executa qualquer código como string, criando vulnerabilidades.",
        alternative: "Em vez de eval, considere alternativas mais seguras como JSON.parse() para dados ou funções nomeadas."
      },
      "Function": {
        explanation: "O construtor Function é similar ao eval() e representa um risco de segurança.",
        alternative: "Defina funções normalmente usando function() {} ou arrow functions (() => {})."
      },
      "setTimeout": {
        explanation: "Timers não são permitidos neste ambiente para evitar problemas de desempenho.",
        alternative: "Para propósitos de aprendizado, você pode simular comportamento assíncrono usando Promise.resolve().then(() => { /* seu código */ });"
      },
      "setInterval": {
        explanation: "Intervalos não são permitidos neste ambiente para evitar loops infinitos e problemas de desempenho.",
        alternative: "Para demonstrar repetição, use loops regulares com contadores limitados."
      },
      "possível loop infinito": {
        explanation: "Seu código parece conter um padrão que pode resultar em um loop infinito.",
        alternative: "Certifique-se de que seus loops tenham uma condição de saída clara e que os valores usados na condição sejam modificados dentro do loop. Adicione um contador máximo de iterações para segurança."
      }
    };

    // Fallback para palavras-chave sem explicações específicas
    return alternatives[keyword] || {
      explanation: `O uso de '${keyword}' é restrito neste ambiente por razões de segurança.`,
      alternative: "Este terminal é otimizado para praticar lógica de programação JavaScript pura."
    };
  }

  // Função para verificar e limpar o código antes de salvar
  function validateCodeForStorage(code) {
    // Limitar tamanho para evitar ataques de DoS no localStorage
    const MAX_SIZE = 50000; // ~50KB
    if (code.length > MAX_SIZE) {
      writeToTerminal(
        `[Aviso] Código muito grande (${code.length} caracteres). Limitado a ${MAX_SIZE} caracteres.`,
        "terminal-warning"
      );
      return code.substring(0, MAX_SIZE);
    }
    return code;
  }

  // Load saved code from localStorage or use default
  function loadSavedCode() {
    try {
      const savedCode = localStorage.getItem("js_code");
      if (savedCode) {
        const validatedCode = validateCodeForStorage(savedCode);
        codeEditor.value = validatedCode;
      } else {
        codeEditor.value = defaultCode;
      }
      applyHighlighting(codeEditor.value);
    } catch (error) {
      console.error("Erro ao carregar código:", error);
      codeEditor.value = defaultCode;
      applyHighlighting(codeEditor.value);
    }
  }

  // Save code to localStorage
  function saveCode() {
    try {
      const validatedCode = validateCodeForStorage(codeEditor.value);
      localStorage.setItem("js_code", validatedCode);
    } catch (error) {
      console.error("Erro ao salvar código:", error);
      writeToTerminal(
        "Erro ao salvar código no localStorage",
        "terminal-error"
      );
    }
  }

  // Write to terminal with optional class
  function writeToTerminal(text, className = "") {
    const entry = document.createElement("div");
    entry.className = `terminal-entry ${className}`;
    // Garantir que o conteúdo seja tratado como texto seguro
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

  // Nova função para limpar o código
  function clearCode() {
    // Perguntar ao usuário se deseja limpar o código
    if (confirm("Tem certeza que deseja limpar todo o código?")) {
      codeEditor.value = "";
      applyHighlighting("");
      saveCode(); // Opcional: salvar o estado vazio no localStorage
      writeToTerminal("[Sistema] Editor de código limpo", "terminal-info");
    }
  }


  // Função para criar sandbox com proteção avançada contra loops infinitos
  function createSandbox() {
    // Cria um iframe isolado
    const sandbox = document.createElement("iframe");
    sandbox.style.display = "none";
    document.body.appendChild(sandbox);

    // Obtém a janela do iframe
    const sandboxWindow = sandbox.contentWindow;

    // Cria um console seguro
    const secureConsole = {
      log: function (...args) {
        const output = args
          .map((arg) => {
            if (typeof arg === "object") {
              try {
                return JSON.stringify(arg, null, 2);
              } catch (e) {
                return String(arg);
              }
            }
            return String(arg);
          })
          .join(" ");

        writeToTerminal(output);
      },
      error: function (...args) {
        const output = args.map((arg) => String(arg)).join(" ");
        writeToTerminal(output, "terminal-error");
      },
      warn: function (...args) {
        const output = args.map((arg) => String(arg)).join(" ");
        writeToTerminal(output, "terminal-warning");
      },
      info: function (...args) {
        const output = args.map((arg) => String(arg)).join(" ");
        writeToTerminal(output, "terminal-info");
      },
    };

    // Modifica o contexto global do iframe
    sandboxWindow.console = secureConsole;

    // Cria um timer para evitar scripts infinitos
    const codeExecutionTimeout = 3000; // 3 segundos

    // Retorna o sandbox e uma função para removê-lo
    return {
      window: sandboxWindow,
      console: secureConsole,
      timeout: codeExecutionTimeout,
      cleanup: function () {
        document.body.removeChild(sandbox);
      },
    };
  }

  // Função aprimorada para executar JavaScript com detecção avançada de loops infinitos
  function executeCode() {
    // Limpa o terminal silenciosamente antes de cada execução
    clearTerminalSilent();

    const code = codeEditor.value;

    if (!code.trim()) {
      writeToTerminal("Erro: Nenhum código para executar.", "terminal-error");
      return;
    }

    // Verificar por código potencialmente perigoso
    const securityIssues = checkCodeSecurity(code);

    if (securityIssues.length > 0) {
      writeToTerminal(
        "[Sistema] ⚠️ Código com restrições de segurança detectado:",
        "terminal-warning"
      );

      // Agrupar por palavra-chave para evitar repetição
      const uniqueIssues = [...new Set(securityIssues.map(issue => issue.keyword))];

      uniqueIssues.forEach((keyword) => {
        const { explanation, alternative } = getSafeAlternative(keyword);

        writeToTerminal(`🔒 ${keyword}:`, "terminal-keyword");
        writeToTerminal(`  ${explanation}`, "terminal-explanation");
        writeToTerminal(`  💡 Alternativa: ${alternative}`, "terminal-alternative");
      });

      writeToTerminal(
        "[Sistema] A execução foi cancelada. Corrija os problemas de segurança e tente novamente.",
        "terminal-info"
      );

      // Adicionar uma dica para o usuário
      writeToTerminal(
        "[Dica] Este ambiente é ideal para praticar algoritmos, estruturas de dados e lógica JavaScript. Para interações com o navegador, considere usar JSFiddle, CodePen ou CodeSandbox.",
        "terminal-tip"
      );

      return;
    }

    writeToTerminal("> Executando código JavaScript...", "terminal-info");
    const startTime = performance.now();

    try {
      // Criar um ambiente sandbox para execução
      const sandbox = createSandbox();

      // Adiciona um timeout para evitar scripts infinitos
      const timeoutId = setTimeout(() => {
        writeToTerminal(
          "Erro: A execução do código excedeu o tempo limite (3s)",
          "terminal-error"
        );
        sandbox.cleanup();
      }, sandbox.timeout);

      // Mock de input
      const mockInput = (prompt) => {
        writeToTerminal(prompt, "terminal-prompt");
        return "Usuário";
      };

      // Configurações avançadas para detecção de loops infinitos
      const loopProtection = `
        // Configuração de proteção contra loops infinitos
        const MAX_ITERATIONS = 10000;           // Limite de iterações para for/while/do-while
        const MAX_RECURSIVE_DEPTH = 500;        // Limite de profundidade de recursão
        const MAX_LOOP_TIME = 2000;             // Tempo máximo em ms para loops
        
        // Contadores para detecção
        let iterationCounter = 0;
        let recursionDepth = 0;
        let recursionStack = [];
        const loopStartTime = Date.now();
        
        // Função para verificar limites de execução
        function checkExecutionLimits(type = 'iteration') {
          // Verificar tempo limite
          if (Date.now() - loopStartTime > MAX_LOOP_TIME) {
            throw new Error("Tempo limite de execução excedido (possível loop infinito)");
          }
          
          // Verificar iterações
          if (type === 'iteration') {
            iterationCounter++;
            if (iterationCounter > MAX_ITERATIONS) {
              throw new Error("Limite de iterações excedido (possível loop infinito)");
            }
          }
          
          // Verificar recursão
          if (type === 'recursion') {
            recursionDepth++;
            if (recursionDepth > MAX_RECURSIVE_DEPTH) {
              throw new Error("Limite de recursão excedido (possível stack overflow)");
            }
          }
        }
        
        // Override das funções nativas que podem causar loops infinitos
        const originalFunctionApply = Function.prototype.apply;
        const originalFunctionCall = Function.prototype.call;
        
        // Substituir o apply para detectar recursão
        Function.prototype.apply = function(thisArg, args) {
          const fnName = this.name || 'anonymous';
          
          // Detectar recursão
          if (recursionStack.includes(fnName)) {
            checkExecutionLimits('recursion');
          }
          
          recursionStack.push(fnName);
          try {
            return originalFunctionApply.call(this, thisArg, args);
          } finally {
            recursionStack.pop();
            if (recursionStack.length === 0) {
              recursionDepth = 0;
            }
          }
        };
        
        // Substituir o call para detectar recursão
        Function.prototype.call = function(thisArg, ...args) {
          const fnName = this.name || 'anonymous';
          
          // Detectar recursão
          if (recursionStack.includes(fnName)) {
            checkExecutionLimits('recursion');
          }
          
          recursionStack.push(fnName);
          try {
            return originalFunctionCall.call(this, thisArg, ...args);
          } finally {
            recursionStack.pop();
            if (recursionStack.length === 0) {
              recursionDepth = 0;
            }
          }
        };
        
// Verificação básica para arrays muito grandes
const checkArraySize = (arr) => {
  if (arr && arr.length > MAX_ITERATIONS) {
    throw new Error("Array muito grande para operação");
  }
};

// Adicionamos apenas uma verificação básica sem modificar os métodos nativos
Object.defineProperty(Array.prototype, 'safeForEach', {
  value: function(callback) {
    checkArraySize(this);
    return Array.prototype.forEach.call(this, (item, index, array) => {
      checkExecutionLimits();
      return callback(item, index, array);
    });
  },
  enumerable: false
});
        
        // Instrumentalizar os loops nativos com Babel-like transformações
        // Nota: Isso seria implementado através de AST em um ambiente real
        // Aqui estamos apenas adicionando instruções para verificação manual
      `;

      // Prepara o código com proteções
      const preparedCode = `
      (function() {
        "use strict";
        let originalFunctionApply, originalFunctionCall;
    
        try {
          ${loopProtection}
          
          // Mock de funções
          const input = ${JSON.stringify(mockInput)};
          
          // Execução do código do usuário com checkpoints
          ${code
          .replace(/for\s*\([^)]*\)\s*\{/g, (match) => {
            return match + " checkExecutionLimits();";
          })
          .replace(/while\s*\([^)]*\)\s*\{/g, (match) => {
            return match + " checkExecutionLimits();";
          })
          .replace(/do\s*\{/g, (match) => {
            return match + " checkExecutionLimits();";
          })}
        } catch (error) {
          console.error("Erro durante execução: " + error.message);
        } finally {
          // Restaurar comportamento original das funções
          if (originalFunctionApply) {
            Function.prototype.apply = originalFunctionApply;
          }
          if (originalFunctionCall) {
            Function.prototype.call = originalFunctionCall;
          }
        }
      })();
    `;

      // Executar em um try-catch para capturar erros de sintaxe
      try {
        sandbox.window.eval(preparedCode);
      } catch (error) {
        writeToTerminal(`Erro de sintaxe: ${error.message}`, "terminal-error");
      }

      // Limpar o timeout se o código terminar antes do tempo
      clearTimeout(timeoutId);

      // Limpar o sandbox
      sandbox.cleanup();
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

  // Função para detectar padrões comuns de loops infinitos
  function checkForInfiniteLoops(code) {
    const infiniteLoopPatterns = [
      // While true sem break
      {
        pattern: /while\s*\(\s*true\s*\)[\s\S]*?(?!\s*break)/g,
        message: "Loop 'while(true)' sem instrução de saída detectado",
      },
      // For sem incremento/decremento ou com condição estática
      {
        pattern:
          /for\s*\([^;]*;\s*(?:[^;]*[><=]+ ?[^i][^;]*|true|1|![01]);\s*\)\s*\{/g,
        message: "Loop 'for' com condição estática detectado",
      },
      // While com condição estática diferente de true
      {
        pattern:
          /while\s*\(\s*(?:1|![01]|[^i][^=!<>]*[!=><]=+[^=][^i][^)]*)\s*\)/g,
        message: "Loop 'while' com condição estática detectado",
      },
      // Loops com incremento/decremento fora do bloco
      {
        pattern: /for\s*\([^;]*;\s*[^;]*;\s*\)\s*\{[^}]*(?:\+\+|\-\-)/g,
        message:
          "Loop 'for' com incremento dentro do bloco pode ser problemático",
      },
    ];

    const potentialIssues = [];

    // Verificar cada padrão
    infiniteLoopPatterns.forEach(({ pattern, message }) => {
      if (pattern.test(code)) {
        potentialIssues.push({ message });
      }
    });

    return potentialIssues;
  }

  // Atualizar a função de verificação de segurança para incluir detecção de loops infinitos
  function checkCodeSecurity(code) {
    const dangerousMatches = [];

    // Verificar acesso ao DOM e outros objetos perigosos
    dangerousKeywords.forEach((keyword) => {
      // Verifica palavras-chave perigosas (evita falsos positivos em strings)
      const regex = new RegExp(`(^|[^"'\\w])${keyword}\\s*(\\.|\\[|\\()`, "g");
      let match;

      while ((match = regex.exec(code)) !== null) {
        dangerousMatches.push({
          keyword: keyword,
          position: match.index + match[1].length,
        });
      }
    });

    // Verificar uso de eval e Function
    const evalRegex = /\beval\s*\(/g;
    const functionRegex = /\bnew\s+Function\s*\(/g;

    let match;
    while ((match = evalRegex.exec(code)) !== null) {
      dangerousMatches.push({
        keyword: "eval",
        position: match.index,
      });
    }

    while ((match = functionRegex.exec(code)) !== null) {
      dangerousMatches.push({
        keyword: "new Function",
        position: match.index,
      });
    }

    // Verificar possíveis loops infinitos
    const potentialInfiniteLoops = checkForInfiniteLoops(code);
    potentialInfiniteLoops.forEach((issue) => {
      dangerousMatches.push({
        keyword: "possível loop infinito",
        position: 0,
        message: issue.message,
      });
    });

    return dangerousMatches;
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

  // Garantir que o código e o layout estejam alinhados
  function updateLayout() {
    // Altura
    codeEditor.style.height = "auto";
    const newHeight = Math.max(codeEditor.scrollHeight, 120);
    codeEditor.style.height = `${newHeight}px`;
    syntaxHighlighter.style.height = `${newHeight}px`;
    codeContainer.style.height = `${newHeight}px`;

    // Largura
    const codeWidth = Math.max(
      codeEditor.scrollWidth,
      codeContainer.clientWidth
    );
    codeEditor.style.minWidth = `${codeWidth}px`;
    syntaxHighlighter.style.minWidth = `${codeWidth}px`;
  }

  // Event Listeners
  executeBtn.addEventListener("click", executeCode);
  clearTerminalBtn.addEventListener("click", clearTerminalWithMessage);
  clearCodeBtn.addEventListener("click", clearCode);
  copyBtn.addEventListener("click", copyCode);

  codeEditor.addEventListener("keydown", handleTabKey);
  codeEditor.addEventListener("input", () => {
    applyHighlighting(codeEditor.value);
    updateLayout();
    syncScroll();
  });
  codeEditor.addEventListener("scroll", syncScroll);

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

  // Adicionar estilo para palavras perigosas
  const styleElement = document.createElement("style");
  styleElement.textContent = `
      .cm-dangerous {
        color: #ff5f5f;
        text-decoration: wavy underline;
      }
      .terminal-warning {
        color: #f0ad4e;
      }
    `;
  document.head.appendChild(styleElement);

  // Welcome message
  writeToTerminal("Terminal JavaScript Interativo", "terminal-info");
  writeToTerminal(
    "Escreva seu código e clique em Executar ou pressione Ctrl+Enter",
    "terminal-info"
  );
  // writeToTerminal("⚠️ Esta é uma versão com segurança aprimorada", "terminal-info");
});


// É isso família, finalizamos esse monstro aqui. 
// Não tentem entender em casa. Tamo junto e até a próxima! 🔥💻
