const fs = require('fs');
const vm = require('vm');

function createElement() {
  return {
    children: [],
    style: {},
    dataset: {},
    className: '',
    classList: {
      add() {},
      remove() {},
      contains() { return false; }
    },
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    addEventListener(eventName, handler) {
      this[eventName] = handler;
    },
    set innerHTML(value) {
      this._innerHTML = value;
    },
    get innerHTML() {
      return this._innerHTML || '';
    },
    scrollIntoView() {},
    querySelector() { return null; },
    querySelectorAll() { return []; }
  };
}

const checkboxList = [{ value: 'Manicure' }];
const listaHorarios = createElement();
const modal = createElement();
modal.classList = {
  add() { modal._active = true; },
  remove() { modal._active = false; },
  contains(name) { return !!modal._active && name === 'active'; }
};
const documentStub = {
  _handlers: {},
  addEventListener(eventName, cb) {
    this._handlers[eventName] = cb;
  },
  querySelectorAll(selector) {
    if (selector === '.servico-check:checked') return checkboxList;
    if (selector === '.fc-daygrid-day') return [];
    if (selector === '.horario-card-mobile') return listaHorarios.children.filter(c => c && c.className && c.className.includes('horario-card-mobile'));
    return [];
  },
  querySelector(selector) {
    if (selector === '[data-date="2026-09-09"]') {
      return { classList: { add() {}, remove() {} } };
    }
    return null;
  },
  getElementById(id) {
    if (id === 'calendar') return {};
    if (id === 'listaHorarios') return listaHorarios;
    if (id === 'dataSelecionada') return { textContent: '', style: {} };
    if (id === 'horariosDisponiveis') return { style: { display: 'none' }, scrollIntoView() {} };
    if (id === 'modalAgendamento') return modal;
    if (id === 'confirmarAgendamento') return { dataset: {} };
    if (id === 'nomeCliente') return { value: 'Maria', trim() { return 'Maria'; } };
    if (id === 'telefoneCliente') return { value: '(19) 98765-4321', trim() { return '(19) 98765-4321'; } };
    if (id === 'observacaoCliente') return { value: 'Penteado leve', trim() { return 'Penteado leve'; } };
    if (id === 'confirmarWhatsApp') return { checked: true };
    if (id === 'confirmarGoogleCalendar') return { checked: true };
    return null;
  },
  createElement() {
    return createElement();
  },
  body: { style: {} }
};

const context = {
  document: documentStub,
  window: { open() {} },
  localStorage: {
    store: [],
    getItem() { return JSON.stringify(this.store); },
    setItem(key, value) { this.store = JSON.parse(value); }
  },
  FullCalendar: {
    Calendar: class {
      constructor(el, opts) { this.el = el; this.opts = opts; }
      render() {}
    }
  },
  Date,
  Math,
  setTimeout(fn) { fn(); return 0; },
  clearTimeout() {},
  alert() {},
  encodeURIComponent
};

vm.createContext(context);
vm.runInContext(fs.readFileSync('calendar.js', 'utf8'), context);

if (typeof documentStub._handlers.DOMContentLoaded !== 'function') {
  throw new Error('DOMContentLoaded não registrado.');
}

documentStub._handlers.DOMContentLoaded();
context.selecionarData('2026-09-09');

if (listaHorarios.children.length === 0) {
  throw new Error('Nenhum horário foi gerado após a seleção da data.');
}

const card = listaHorarios.children.find(c => c && c.className && c.className.includes('horario-card-mobile'));
if (!card) {
  throw new Error('Nenhum cartão de horário foi criado.');
}
if (typeof card.click !== 'function') {
  throw new Error('O clique no horário não foi registrado.');
}

card.click();
if (!modal._active) {
  throw new Error('O modal de agendamento não abriu após clicar no horário.');
}

console.log('FLOW_MOBILE_COMPLETO=OK');
console.log('HORARIOS_GERADOS=', listaHorarios.children.length);
