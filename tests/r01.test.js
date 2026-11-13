"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const ids = [
  "receipt-form",
  "payer",
  "recipient",
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
const listeners = {};
const fixedInstant = process.env.RECEIPT_TEST_INSTANT;
const testToday = fixedInstant ? new Date(fixedInstant) : new Date();
vm.runInNewContext(fs.readFileSync("script.js", "utf8"), {
  document: { getElementById: (id) => elements[id] },
  window: { addEventListener(name, handler) { listeners[name] = handler; } },
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
assert.equal(elements.print.disabled, true);
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
listeners.beforeprint();
assert.equal(elements.receipt.hidden, true);
console.log("R02: validação, representação do valor e bloqueio de impressão parcial aprovados.");

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
