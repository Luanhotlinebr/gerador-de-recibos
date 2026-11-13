"use strict";

const form = document.getElementById("receipt-form");
const receipt = document.getElementById("receipt");
const printButton = document.getElementById("print");
const previewStatus = document.getElementById("preview-status");
const dateField = document.getElementById("date");
const documentType = document.getElementById("document-type");
const documentNumber = document.getElementById("document-number");
const documentError = document.getElementById("document-number-error");
const documentTypes = new Set(["CPF", "CNPJ", "RG"]);
const documentFormats = {
  CPF: [/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4"],
  CNPJ: [/^([A-Z0-9]{2})([A-Z0-9]{3})([A-Z0-9]{3})([A-Z0-9]{4})(\d{2})$/, "$1.$2.$3/$4-$5"],
  RG: [/^(\d{2})(\d{3})(\d{3})(\d)$/, "$1.$2.$3-$4"],
};

function formatDocument(type, value) {
  if (!documentTypes.has(type)) return value;
  if (type === "CNPJ") value = value.replace(/[a-z]/g, (letter) => letter.toUpperCase());
  const [pattern, replacement] = documentFormats[type];
  return value.replace(pattern, replacement);
}

function hasDocumentFormat(type, value) {
  const compact = value.replace(/[./-]/g, "");
  const formatted = formatDocument(type, compact);
  return formatted !== compact && value === formatted;
}

function cnpjCheckDigit(base) {
  let sum = 0;
  for (let offset = 0; offset < base.length; offset += 1) {
    const code = base.charCodeAt(base.length - 1 - offset);
    sum += (code - 48) * (2 + offset % 8);
  }
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

function hasValidCnpjCheckDigits(value) {
  const compact = value.replace(/[./-]/g, "");
  if (compact === "00000000000000") return false;
  const base = compact.slice(0, 12);
  const first = cnpjCheckDigit(base);
  const second = cnpjCheckDigit(base + first);
  return compact === `${base}${first}${second}`;
}
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

function localDateValue(today) {
  return [
    String(today.getDate()).padStart(2, "0"),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getFullYear()).padStart(4, "0"),
  ].join("/");
}

function formatDateInput(field, inputType) {
  const original = field.value;
  const digits = original.replace(/\D/g, "").slice(0, 8);
  const formatted = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)]
    .filter(Boolean).join("/");
  if (original === formatted) return;

  const digitsBeforeCaret = original.slice(0, field.selectionStart).replace(/\D/g, "").length;
  const digitPosition = Math.min(digitsBeforeCaret, digits.length);
  let caret = digitPosition;
  if (digitPosition > 2) caret += 1;
  if (digitPosition > 4) caret += 1;
  if (inputType === "deleteContentForward" && formatted[caret] === "/") caret += 1;
  field.value = formatted;
  field.setSelectionRange(caret, caret);
}

function parseCalendarDate(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;

  const [, day, month, year] = match;
  const yearNumber = Number(year);
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  const leapYear = yearNumber % 4 === 0 &&
    (yearNumber % 100 !== 0 || yearNumber % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (yearNumber === 0 || monthNumber < 1 || monthNumber > 12 ||
      dayNumber < 1 || dayNumber > daysInMonth[monthNumber - 1]) {
    return null;
  }
  return value;
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
  receipt.hidden = true;
  printButton.disabled = true;
  previewStatus.hidden = false;
}

dateField.value = localDateValue(new Date());
documentNumber.disabled = !documentTypes.has(documentType.value);
form.addEventListener("input", (event) => {
  if (event.target === dateField) formatDateInput(dateField, event.inputType);
  if (event.target === documentNumber && documentType.value !== "RG") {
    const formatted = formatDocument(documentType.value, documentNumber.value);
    if (formatted !== documentNumber.value) documentNumber.value = formatted;
  }
  invalidatePreview();
});
form.addEventListener("change", (event) => {
  if (event?.target === documentType) {
    documentNumber.disabled = !documentTypes.has(documentType.value);
    if (documentNumber.disabled) documentNumber.value = "";
    documentType.removeAttribute("aria-invalid");
    documentNumber.removeAttribute("aria-invalid");
    documentError.textContent = "";
  }
  if (event?.target === documentNumber || event?.target === documentType) {
    documentNumber.value = formatDocument(documentType.value, documentNumber.value.trim());
  }
  invalidatePreview();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  invalidatePreview();

  let firstInvalid = null;
  const values = {};
  const identification = {
    type: documentType.value,
    number: formatDocument(documentType.value, documentNumber.value.trim()),
  };
  documentType.removeAttribute("aria-invalid");
  documentNumber.removeAttribute("aria-invalid");
  documentError.textContent = "";
  let invalidDocumentField;
  if (identification.number && !documentTypes.has(identification.type)) {
    documentError.textContent = "Selecione CPF, CNPJ ou RG.";
    invalidDocumentField = documentType;
  } else if (identification.number.length > 32) {
    documentError.textContent = "Informe um documento com até 32 caracteres.";
    invalidDocumentField = documentNumber;
  } else if (identification.number && identification.type !== "RG" &&
      !hasDocumentFormat(identification.type, identification.number)) {
    documentError.textContent = identification.type === "CPF"
      ? "Informe um CPF com 11 dígitos."
      : "Informe um CNPJ com 12 letras ou números, seguidos de dois dígitos.";
    invalidDocumentField = documentNumber;
  } else if (identification.number && identification.type === "CNPJ" &&
      !hasValidCnpjCheckDigits(identification.number)) {
    documentError.textContent = "Confira os dois dígitos verificadores do CNPJ.";
    invalidDocumentField = documentNumber;
  }
  invalidDocumentField?.setAttribute("aria-invalid", "true");

  for (const [id, message] of requiredFields) {
    if (id === "description") firstInvalid ||= invalidDocumentField;
    const field = document.getElementById(id);
    const value = field.value.trim();
    const error = document.getElementById(`${id}-error`);
    values[id] = value;
    error.textContent = value ? "" : message;
    if (id === "amount" && value) {
      values.amount = parseAmount(value);
      if (values.amount === null) {
        error.textContent = "Informe um valor de 0,01 a 999.999.999,99 no formato brasileiro.";
      }
    }
    if (id === "date" && value) {
      values.date = parseCalendarDate(value);
      if (values.date === null) {
        error.textContent = "Informe uma data válida no formato dd/mm/yyyy.";
      }
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
  const receiptDocument = document.getElementById("receipt-document");
  documentNumber.value = identification.number;
  receiptDocument.textContent = identification.number
    ? `${identification.type} ${identification.number}`
    : "";
  receiptDocument.hidden = !identification.number;
  document.getElementById("receipt-place-date").textContent =
    `${values.place}, ${values.date}`;
  receipt.hidden = false;
  printButton.disabled = false;
  previewStatus.hidden = true;
  document.getElementById("preview-title").focus();
});

printButton.addEventListener("click", () => {
  if (!receipt.hidden) window.print();
});
