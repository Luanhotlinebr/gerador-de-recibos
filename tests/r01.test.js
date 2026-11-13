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
vm.runInNewContext(fs.readFileSync("script.js", "utf8"), {
  document: { getElementById: (id) => elements[id] },
  window: { addEventListener(name, handler) { listeners[name] = handler; } },
});
const submit = () => listeners.submit({ preventDefault() {} });
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
  date: "2024-02-29",
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
listeners.input();
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
