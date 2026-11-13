"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const ids = [
  "receipt-form",
  "payer",
  "recipient",
  "document-type",
  "document-number",
  "description",
  "amount",
  "date",
  "place",
  "receipt",
  "print",
  "preview-status",
  "receipt-statement",
  "receipt-amount",
  "receipt-recipient",
  "receipt-document",
  "receipt-place-date",
  "preview-title",
];
const elements = Object.fromEntries(
  ids.map((id) => [
    id,
    {
      value: "",
      textContent: "",
      hidden: false,
      disabled: false,
      attributes: {},
      setAttribute(name, value) {
        this.attributes[name] = value;
      },
      removeAttribute(name) {
        delete this.attributes[name];
      },
      focus() {
        focused = id;
      },
      setSelectionRange(start) {
        this.selectionStart = start;
      },
      addEventListener(name, handler) {
        listeners[name] = handler;
      },
    },
  ]),
);
for (const id of [
  "payer",
  "recipient",
  "description",
  "amount",
  "date",
  "place",
]) {
  elements[`${id}-error`] = { textContent: "" };
}
let focused = null;
elements["document-number-error"] = { textContent: "" };
const listeners = {};
let printCount = 0;
const fixedInstant = process.env.RECEIPT_TEST_INSTANT;
const testToday = fixedInstant ? new Date(fixedInstant) : new Date();
vm.runInNewContext(fs.readFileSync("script.js", "utf8"), {
  document: { getElementById: (id) => elements[id] },
  window: { print() { printCount += 1; } },
  Date: class extends Date {
    constructor() {
      super(testToday.getTime());
    }
  },
});
const suggestedDate = elements.date.value;
assert.equal(suggestedDate, process.env.RECEIPT_EXPECTED_DATE ||
  new Intl.DateTimeFormat("pt-BR").format(testToday));
const submit = () => listeners.submit({ preventDefault() {} });
elements.date.value = "";
submit();
assert.equal(focused, "payer");
for (const id of [
  "payer",
  "recipient",
  "description",
  "amount",
  "date",
  "place",
]) {
  assert.ok(elements[`${id}-error`].textContent);
  assert.equal(elements[id].attributes["aria-invalid"], "true");
}
Object.assign(elements.payer, { value: "   " });
for (const [id, value] of Object.entries({
  recipient: "Pessoa Recebedora",
  description: "Serviço fictício",
  amount: "10,00",
  date: "29/02/2024",
  place: "Fortaleza - CE",
}))
  elements[id].value = value;
submit();
assert.equal(focused, "payer");
assert.equal(elements.receipt.hidden, true);
elements.payer.value = "Pessoa Pagadora";
submit();
assert.match(elements["receipt-statement"].textContent, /Pessoa Pagadora/);
assert.equal(elements["receipt-recipient"].textContent, "Pessoa Recebedora");
assert.equal(elements["payer-error"].textContent, "");
assert.equal(elements.payer.attributes["aria-invalid"], undefined);
assert.equal(elements.receipt.hidden, false);
assert.equal(elements.print.disabled, false);
listeners.input({ target: elements.payer });
assert.equal(elements.receipt.hidden, true);
console.log("R01: validação e identificação das partes aprovadas.");

for (const value of ["0", "0,00", "-1,00", "3.00,01", "1,001",
  "999.999.999,999", "1.000.000.000,00", "1.23", "1,"]) {
  elements.amount.value = value;
  submit();
  assert.equal(focused, "amount", value);
  assert.equal(elements.amount.attributes["aria-invalid"], "true", value);
  assert.ok(elements["amount-error"].textContent, value);
  assert.equal(elements.receipt.hidden, true, value);
}

for (const [value, numeric, words] of [
  ["3.000,01", "3.000,01", "três mil reais e um centavo"],
  ["0,01", "0,01", "um centavo"],
  ["0,99", "0,99", "noventa e nove centavos"],
  ["1", "1,00", "um real"],
  ["1,1", "1,10", "um real e dez centavos"],
  [" 3000,01 ", "3.000,01", "três mil reais e um centavo"],
  ["100", "100,00", "cem reais"],
  ["101", "101,00", "cento e um reais"],
  ["1.001", "1.001,00", "mil e um reais"],
  ["2.000.000", "2.000.000,00", "dois milhões de reais"],
  ["999.999.999,99", "999.999.999,99",
    "novecentos e noventa e nove milhões novecentos e noventa e nove mil " +
    "novecentos e noventa e nove reais e noventa e nove centavos"],
]) {
  elements.amount.value = value;
  submit();
  assert.equal(elements["receipt-amount"].textContent, `R$\u00a0${numeric}`, value);
  assert.ok(elements["receipt-statement"].textContent.includes(`a quantia de ${words},`), value);
  assert.equal(elements["amount-error"].textContent, "", value);
  assert.equal(elements.amount.attributes["aria-invalid"], undefined, value);
  assert.equal(elements.receipt.hidden, false, value);
}
console.log("R02: validação e representação do valor aprovadas.");

for (const value of ["29/02/2025", "29/02/1900", "31/04/2024", "01/13/2024",
  "00/01/2024", "01/01/0000", "01/01/10000", "09/2/2024", "2024-02-29", "29/02/"]) {
  elements.date.value = value;
  submit();
  assert.equal(focused, "date", value);
  assert.equal(elements.date.attributes["aria-invalid"], "true", value);
  assert.equal(elements["date-error"].textContent, "Informe uma data válida no formato dd/mm/yyyy.", value);
  assert.equal(elements.receipt.hidden, true, value);
}

for (const value of [suggestedDate, "29/02/2024", "29/02/2000", "01/01/0001", "31/12/9999"]) {
  elements.date.value = value;
  listeners.change();
  assert.equal(elements.receipt.hidden, true);
  submit();
  assert.equal(elements.receipt.hidden, false, value);
  assert.equal(elements["receipt-place-date"].textContent, `Fortaleza - CE, ${value}`);
  assert.equal(elements.date.attributes["aria-invalid"], undefined, value);
  assert.equal(elements["date-error"].textContent, "", value);
}
console.log("R03: sugestão local, validação e data do recibo aprovadas.");

function editDate(value, caret = value.length, inputType = "insertText") {
  elements.date.value = value;
  elements.date.selectionStart = caret;
  listeners.input({ target: elements.date, inputType });
}

elements.date.value = "";
for (const digit of "06092001") editDate(elements.date.value + digit);
assert.equal(elements.date.value, "06/09/2001");
assert.equal(elements.receipt.hidden, true);
submit();
assert.equal(elements["receipt-place-date"].textContent, "Fortaleza - CE, 06/09/2001");

editDate("06a092001", 9, "insertFromPaste");
assert.equal(elements.date.value, "06/09/2001");
editDate("0609/2001", 2, "deleteContentBackward");
assert.equal(elements.date.value, "06/09/2001");
assert.equal(elements.date.selectionStart, 2);
editDate("0609/2001", 2, "deleteContentForward");
assert.equal(elements.date.selectionStart, 3);

const type = elements["document-type"];
const number = elements["document-number"];
const receiptDocument = elements["receipt-document"];
assert.equal(number.disabled, true);
submit();
assert.equal(receiptDocument.hidden, true);

for (const [selectedType, raw, formatted] of [
  ["CPF", "02345678901", "023.456.789-01"],
  ["CNPJ", "02345678000131", "02.345.678/0001-31"],
  ["CNPJ", "tbz21zhv000185", "TB.Z21.ZHV/0001-85"],
  ["CNPJ", "TB.Z21.ZHV/0001-85", "TB.Z21.ZHV/0001-85"],
  ["RG", "023456789", "02.345.678-9"],
  ["RG", "  001234-X  ", "001234-X"],
]) {
  type.value = selectedType;
  listeners.change({ target: type });
  assert.equal(number.disabled, false);
  assert.equal(elements.receipt.hidden, true);
  number.value = raw;
  listeners.input({ target: number });
  listeners.change({ target: number });
  assert.equal(number.value, formatted);
  submit();
  assert.equal(receiptDocument.hidden, false);
  assert.equal(receiptDocument.textContent, `${selectedType} ${formatted}`);
  assert.equal(elements["receipt-recipient"].textContent, "Pessoa Recebedora");
}

for (const [selectedType, invalid] of [
  ["CPF", "1234567890"],
  ["CPF", "123.456.789-0X"],
  ["CNPJ", "123456780001999"],
  ["CNPJ", "TB.Z21.ZHV/0001-8X"],
  ["CNPJ", "TB.Z21.ZHV/0001-86"],
  ["CNPJ", "02.345.678/0001-99"],
  ["CNPJ", "00.000.000/0000-00"],
  ["CNPJ", "TÉ.Z21.ZHV/0001-85"],
]) {
  type.value = selectedType;
  number.value = invalid;
  submit();
  assert.equal(focused, "document-number");
  assert.equal(elements.receipt.hidden, true);
}

type.value = "RG";
number.value = "0".repeat(32);
submit();
assert.equal(receiptDocument.textContent, `RG ${number.value}`);
number.value += "0";
submit();
assert.equal(focused, "document-number");
assert.ok(elements["document-number-error"].textContent);
assert.equal(elements.receipt.hidden, true);

type.value = "Outro";
number.value = "001234-X";
submit();
assert.equal(focused, "document-type");
assert.equal(elements.receipt.hidden, true);

type.value = "";
listeners.change({ target: type });
assert.equal(number.disabled, true);
assert.equal(number.value, "");
submit();
assert.equal(receiptDocument.hidden, true);
assert.equal(receiptDocument.textContent, "");

type.value = "RG";
listeners.change({ target: type });
number.value = "   ";
submit();
assert.equal(elements.receipt.hidden, false);
assert.equal(receiptDocument.hidden, true);
console.log("R04: documento opcional, tipo, comprimento e zeros à esquerda aprovados.");

elements.description.value = "Serviço fictício\n<b>Segunda linha</b>";
listeners.input({ target: elements.description });
assert.equal(elements.print.disabled, true);
listeners.click();
assert.equal(printCount, 0);
submit();
assert.match(elements["receipt-statement"].textContent, /Serviço fictício\n<b>Segunda linha<\/b>/);
assert.equal(elements.print.disabled, false);
listeners.click();
assert.equal(printCount, 1);
assert.equal(elements.receipt.hidden, false);
elements.amount.value = "2,00";
listeners.input({ target: elements.amount });
assert.equal(elements.receipt.hidden, true);
assert.equal(elements.print.disabled, true);
listeners.click();
assert.equal(printCount, 1);
submit();
assert.equal(elements["receipt-amount"].textContent, "R$\u00a02,00");
listeners.click();
assert.equal(printCount, 2);
console.log("R05: prévia validada, atualização e botão de impressão aprovados.");
