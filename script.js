"use strict";

const form = document.getElementById("receipt-form");
const requiredFields = [
  ["payer", "Informe quem pagou."],
  ["recipient", "Informe quem recebeu."],
  ["description", "Informe a descrição do pagamento."],
  ["amount", "Informe o valor."],
  ["date", "Informe a data."],
  ["place", "Informe o local."],
];

function invalidatePreview() {
  document.getElementById("receipt").hidden = true;
  document.getElementById("print").disabled = true;
  document.getElementById("preview-status").hidden = false;
  document.getElementById("preview-status").textContent =
    "A prévia aparece aqui após o preenchimento.";
}

form.addEventListener("input", invalidatePreview);
form.addEventListener("change", invalidatePreview);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  invalidatePreview();

  let firstInvalid = null;
  const values = {};
  for (const [id, message] of requiredFields) {
    const field = document.getElementById(id);
    const value = field.value.trim();
    const error = document.getElementById(`${id}-error`);
    values[id] = value;
    error.textContent = value ? "" : message;
    if (value) {
      field.removeAttribute("aria-invalid");
    } else {
      field.setAttribute("aria-invalid", "true");
      firstInvalid ||= field;
    }
  }

  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  // A emissão depende da validação de valor e data prevista em R02 e R03.
  document.getElementById("receipt-statement").textContent =
    `Recebi de ${values.payer}, referente a: ${values.description}`;
  document.getElementById("receipt-recipient").textContent = values.recipient;
  document.getElementById("receipt").hidden = false;
  document.getElementById("preview-status").textContent =
    "Prévia parcial: valor, data e impressão ainda não estão disponíveis.";
  document.getElementById("preview-title").focus();
});

// A prévia parcial não deve ser emitida pelo menu de impressão do navegador.
window.addEventListener("beforeprint", () => {
  document.getElementById("receipt").hidden = true;
});
window.addEventListener("afterprint", invalidatePreview);
