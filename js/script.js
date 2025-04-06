document.addEventListener("DOMContentLoaded", function () {
  // DOM elements
  const codeEditor = document.getElementById("codeEditor");
  const executeBtn = document.getElementById("executeBtn");
  const clearTerminalBtn = document.getElementById("clearTerminalBtn");
  const terminal = document.getElementById("terminal");
  const copyBtn = document.getElementById("copyBtn"); // Novo elemento
  const executionStats = document.getElementById("executionStats");

  // Default code
  const defaultCode = `// Exemplo simples em JavaScript
console.log("Olá, mundo!");

// Prompt simulado
const nome = "Usuário";
console.log(\`Bem-vindo, \${nome}!\`);

// Um cálculo simples
const a = 10;
const b = 5;
const soma = a + b;
console.log(\`A soma de \${a} e \${b} é \${soma}\`);`;

  // Função de cópia
  function copyCode() {
    navigator.clipboard.writeText(codeEditor.value).then(() => {
      const feedback = document.getElementById("copyFeedback");
      feedback.classList.add("copy-feedback");
      setTimeout(() => feedback.classList.remove("copy-feedback"), 1500);
    });
  }

  // Load saved code from localStorage or use default
  function loadSavedCode() {
    const savedCode = localStorage.getItem("js_code");
    codeEditor.value = savedCode || defaultCode;
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

  // Clear terminal
  function clearTerminal() {
    terminal.innerHTML = "";
    executionStats.textContent = "";
  }


  // Execute JavaScript code
  function executeCode() {
    // Limpa o terminal antes de cada execução
    clearTerminal();

    const code = codeEditor.value;

    if (!code.trim()) {
      writeToTerminal("Erro: Nenhum código para executar.", "terminal-error");
      return;
    }

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
        "    " +
        codeEditor.value.substring(end);

      // Move cursor after the tab
      codeEditor.selectionStart = codeEditor.selectionEnd = start + 4;
    }
  }

  // Event Listeners
  executeBtn.addEventListener("click", executeCode);
  clearTerminalBtn.addEventListener("click", clearTerminal);
  copyBtn.addEventListener("click", copyCode); // Novo listener
  codeEditor.addEventListener("keydown", handleTabKey);

  // Support for Ctrl+Enter to execute code
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.key === "Enter") {
      executeCode();
    }
  });

  // Load theme preference
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
  }

  // Initialize
  loadSavedCode();

  // Welcome message
  writeToTerminal("Terminal JavaScript Interativo", "terminal-info");
  writeToTerminal(
    "Escreva seu código e clique em Executar ou pressione Ctrl+Enter\n",
    "terminal-info"
  );
});