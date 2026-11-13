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

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const units = [
  "", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove",
  "dez", "onze", "doze", "treze", "catorze", "quinze", "dezesseis",
  "dezessete", "dezoito", "dezenove",
];
const tens = ["", "", "vinte", "trinta", "quarenta", "cinquenta",
  "sessenta", "setenta", "oitenta", "noventa"];
const hundreds = ["", "cento", "duzentos", "trezentos", "quatrocentos",
  "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function parseAmount(value) {
  if (!/^(?:\d{1,9}|\d{1,3}(?:\.\d{3}){1,2})(?:,\d{1,2})?$/.test(value)) {
    return null;
  }
  const [whole, fraction = ""] = value.split(",");
  const cents = Number(whole.replaceAll(".", "")) * 100 +
    Number(fraction.padEnd(2, "0"));
  return cents > 0 ? cents : null;
}

function groupInWords(value) {
  if (value === 100) return "cem";

  const remainder = value % 100;
  const tail = remainder < 20
    ? units[remainder]
    : [tens[Math.floor(remainder / 10)], units[remainder % 10]]
      .filter(Boolean).join(" e ");
  return [hundreds[Math.floor(value / 100)], tail].filter(Boolean).join(" e ");
}

function integerInWords(value) {
  const millions = Math.floor(value / 1_000_000);
  const thousands = Math.floor(value / 1_000) % 1_000;
  const rest = value % 1_000;
  const groups = [];
  if (millions) {
    groups.push(millions === 1 ? "um milhão" : `${groupInWords(millions)} milhões`);
  }
  if (thousands) {
    groups.push(thousands === 1 ? "mil" : `${groupInWords(thousands)} mil`);
  }
  if (!rest) return groups.join(thousands < 100 || thousands % 100 === 0 ? " e " : " ");

  const last = groupInWords(rest);
  if (!groups.length) return last;
  return groups.join(" ") + (rest < 100 || rest % 100 === 0 ? " e " : " ") + last;
}

function amountInWords(cents) {
  const reais = Math.floor(cents / 100);
  const remainder = cents % 100;
  const parts = [];
  if (reais) {
    let denomination = "reais";
    if (reais === 1) denomination = "real";
    else if (reais % 1_000_000 === 0) denomination = "de reais";
    parts.push(`${integerInWords(reais)} ${denomination}`);
  }
  if (remainder) {
    parts.push(`${groupInWords(remainder)} ${remainder === 1 ? "centavo" : "centavos"}`);
  }
  return parts.join(" e ");
}

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
    values[id] = id === "amount" && value ? parseAmount(value) : value;
    error.textContent = value ? "" : message;
    if (values[id] === null) {
      error.textContent = "Informe um valor de 0,01 a 999.999.999,99 no formato brasileiro.";
    }
    if (!error.textContent) {
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

  document.getElementById("receipt-amount").textContent = currency.format(values.amount / 100);
  document.getElementById("receipt-statement").textContent =
    `Recebi de ${values.payer} a quantia de ${amountInWords(values.amount)}, referente a: ${values.description}`;
  document.getElementById("receipt-recipient").textContent = values.recipient;
  document.getElementById("receipt").hidden = false;
  document.getElementById("preview-status").textContent =
    "Prévia parcial. A data e a impressão ainda estão em desenvolvimento.";
  document.getElementById("preview-title").focus();
});

// A prévia parcial não deve ser emitida pelo menu de impressão do navegador.
window.addEventListener("beforeprint", () => {
  document.getElementById("receipt").hidden = true;
});
window.addEventListener("afterprint", invalidatePreview);
