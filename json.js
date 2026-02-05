const editor = document.getElementById("json-editor");
const output = document.getElementById("output");
const validateBtn = document.getElementById("validate-btn");
const formatBtn = document.getElementById("format-btn");
const clearBtn = document.getElementById("clear-btn");

function setOutput(text) {
  output.textContent = text;
}

function parseJson() {
  const raw = editor.value.trim();

  if (!raw) {
    throw new Error("El editor está vacío. Agrega un JSON para validar.");
  }

  return JSON.parse(raw);
}

function validateJson() {
  try {
    parseJson();
    setOutput("JSON válido. Sin errores de sintaxis.");
  } catch (error) {
    setOutput(`Error de sintaxis:\n${error.message || String(error)}`);
  }
}

function formatJson() {
  try {
    const data = parseJson();
    const formatted = JSON.stringify(data, null, 2);
    editor.value = formatted;
    setOutput("JSON formateado correctamente.");
  } catch (error) {
    setOutput(`No se pudo formatear:\n${error.message || String(error)}`);
  }
}

validateBtn.addEventListener("click", validateJson);
formatBtn.addEventListener("click", formatJson);
clearBtn.addEventListener("click", () => setOutput("Salida limpia."));
