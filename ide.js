let editor;
let pyodide = null;
let files = {};
let currentFile = "main.py";

// Monaco Editor setup
require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }});
require(['vs/editor/editor.main'], function () {
  editor = monaco.editor.create(document.getElementById('editor'), {
    value: '',
    language: 'python',
    theme: 'vs-dark',
    fontSize: 14,
    automaticLayout: true
  });
  loadFiles();
});

// Load Pyodide
async function initPyodide() {
  pyodide = await loadPyodide();
  logOutput("✅ Pyodide آماده است.");
}
initPyodide();

// Terminal logger
function logOutput(text) {
  const term = document.getElementById('terminal');
  term.textContent += "\n" + text;
  term.scrollTop = term.scrollHeight;
}

// File management
function loadFiles() {
  const saved = JSON.parse(localStorage.getItem("blackPythonFiles") || "{}");
  if (!saved["main.py"]) saved["main.py"] = 'print("Hello from Black Python IDE!")';
  files = saved;
  updateFileSelector();
  loadFile("main.py");
}

function saveFiles() {
  localStorage.setItem("blackPythonFiles", JSON.stringify(files));
}

function updateFileSelector() {
  const selector = document.getElementById("file-selector");
  selector.innerHTML = "";
  Object.keys(files).forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    selector.appendChild(opt);
  });
  selector.value = currentFile;
  selector.onchange = () => {
    saveCurrentCode();
    loadFile(selector.value);
  };
}

function saveCurrentCode() {
  if (currentFile) {
    files[currentFile] = editor.getValue();
    saveFiles();
  }
}

function loadFile(name) {
  currentFile = name;
  editor.setValue(files[name] || "");
  updateFileSelector();
}

function newFile() {
  const name = prompt("نام فایل جدید؟", "untitled.py");
  if (name && !files[name]) {
    saveCurrentCode();
    files[name] = "";
    loadFile(name);
    saveFiles();
  }
}

function deleteFile() {
  if (currentFile !== "main.py") {
    if (confirm(`حذف فایل ${currentFile}?`)) {
      delete files[currentFile];
      currentFile = "main.py";
      loadFile(currentFile);
      saveFiles();
    }
  } else {
    alert("نمیتوان فایل اصلی را حذف کرد!");
  }
}

// Run Python code
document.getElementById('run-btn').addEventListener('click', async () => {
  if (!pyodide) return logOutput("⏳ Pyodide در حال بارگذاری است...");
  saveCurrentCode();
  logOutput("▶ اجرای " + currentFile);
  try {
    await pyodide.loadPackagesFromImports(files[currentFile]);
    const result = await pyodide.runPythonAsync(files[currentFile]);
    if (result !== undefined) {
      logOutput(result.toString());
    }
  } catch (err) {
    logOutput("⛔ خطا:
" + err);
  }
});