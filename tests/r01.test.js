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
  window: { addEventListener() {} },
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
