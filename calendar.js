// ========== CONFIGURAÇÃO ==========
let dataSelecionada = null;
let horarioSelecionado = null;

// Valores dos serviços
const VALORES = {
    'Manicure': 'R$ 30,00',
    'Pedicure': 'R$ 38,00',
    'Tratamento dos pés': 'R$ 35,00',
    'Design de Sobrancelhas': 'R$ 30,00',
    'Epilação de buço': 'R$ 15,00',
    'Pedicure + Plástica dos Pés': 'R$ 60,00',
    'Brown Lamination': 'R$ 100,00'
};

const DIAS_BLOQUEADOS = [
    // '2026-01-01', // Ano Novo
    // '2026-12-25', // Natal
];

// Escape simples para evitar XSS ao inserir conteúdo do usuário
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ========== INICIALIZAR CALENDÁRIO ==========
document.addEventListener('DOMContentLoaded', function() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;
    
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'pt-br',
        firstDay: 0,
        height: 'auto',
        contentHeight: 'auto',
        headerToolbar: {
            left: 'prev',
            center: 'title',
            right: 'next'
        },
        buttonText: {
            prev: '‹',
            next: '›'
        },
        selectable: true,
        dateClick: function(info) {
            const dataStr = info.dateStr || info.date.toISOString().split('T')[0];
            selecionarData(dataStr);
        },
        select: function(info) {
            const dataStr = info.startStr;
            selecionarData(dataStr);
        },
        selectAllow: function(info) {
            const dataObj = new Date(info.startStr);
            const hoje = new Date(new Date().setHours(0,0,0,0));
            const diaSemana = dataObj.getDay();
            
            if (diaSemana === 0) return false;
            if (dataObj < hoje) return false;
            if (DIAS_BLOQUEADOS.includes(info.startStr)) return false;
            
            return true;
        },
        dayCellDidMount: function(info) {
            const dataStr = info.date.toISOString().split('T')[0];
            info.el.dataset.date = dataStr;
            
            // MOSTRA QUANTOS AGENDAMENTOS TEM NO DIA
            const agendamentos = JSON.parse(localStorage.getItem('agendamentos')) || [];
            const agendamentosDia = agendamentos.filter(a => a.data === dataStr);
            const totalAgendamentos = agendamentosDia.length;
            
            const hoje = new Date(new Date().setHours(0,0,0,0));
            const dataObj = new Date(info.date);
            const diaSemana = dataObj.getDay();
            
            if (dataObj >= hoje && diaSemana !== 0 && !DIAS_BLOQUEADOS.includes(dataStr)) {
                const dayNumber = info.el.querySelector('.fc-daygrid-day-number');
                if (dayNumber && totalAgendamentos > 0) {
                    const oldBadge = info.el.querySelector('.agenda-badge');
                    if (oldBadge) oldBadge.remove();
                    
                    const badge = document.createElement('div');
                    badge.className = 'agenda-badge';
                    badge.textContent = `${totalAgendamentos} 📅`;
                    badge.style.cssText = `
                        font-size: 0.55rem;
                        color: #b5837a;
                        font-weight: 500;
                        background: rgba(196, 154, 148, 0.1);
                        border-radius: 30px;
                        padding: 0.1rem 0.4rem;
                        margin-top: 0.1rem;
                        display: inline-block;
                    `;
                    dayNumber.appendChild(badge);
                }
            }
        }
    });
    calendar.render();
});

function selecionarData(dataStr) {
    if (!dataStr) return;

    const dataObj = new Date(dataStr + 'T00:00:00');

    // BLOQUEIA DATAS PASSADAS
    if (dataObj < new Date(new Date().setHours(0,0,0,0))) {
        alert('❌ Não é possível agendar em datas passadas.');
        return;
    }

    // BLOQUEIA DOMINGOS
    if (dataObj.getDay() === 0) {
        alert('❌ Não atendemos aos domingos. 🕊️\n\nAtendemos de segunda a sexta, das 19h às 21:30h, e aos sábados, das 8h às 17h.');
        return;
    }

    if (DIAS_BLOQUEADOS.includes(dataStr)) {
        alert('❌ Esta data não está disponível.');
        return;
    }

    const hoje = new Date();
    if (dataStr === hoje.toISOString().split('T')[0] && hoje.getHours() >= 21) {
        alert('❌ Não é possível agendar para hoje após as 21h.');
        return;
    }

    dataSelecionada = dataStr;
    const dataFormatada = formatarData(dataStr);
    const elData = document.getElementById('dataSelecionada');
    const elHorarios = document.getElementById('horariosDisponiveis');

    if (elData) elData.textContent = dataFormatada;
    if (elHorarios) elHorarios.style.display = 'block';

    document.querySelectorAll('.fc-daygrid-day').forEach(el => {
        el.classList.remove('fc-day-selected');
    });
    const diaSelecionado = document.querySelector(`[data-date="${dataStr}"]`);
    if (diaSelecionado) {
        diaSelecionado.classList.add('fc-day-selected');
    }

    carregarHorarios(dataStr);

    setTimeout(() => {
        const el = document.getElementById('horariosDisponiveis');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
}

// ========== FORMATAR DATA ==========
function formatarData(dataStr) {
    if (!dataStr) return '';
    const data = new Date(dataStr + 'T00:00:00');
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    
    return `${diasSemana[data.getDay()]}, ${data.getDate()} de ${meses[data.getMonth()]}`;
}

function getConfigHorarioAgenda(dataStr) {
    const dataObj = new Date(dataStr + 'T00:00:00');
    const diaSemana = dataObj.getDay();

    if (diaSemana === 6) {
        // Sábado: 08:00 às 17:00
        return { inicio: 8, fim: 17 };
    }

    return { inicio: 19, fim: 21.5 };
}

// ========== CARREGAR HORÁRIOS ==========
function carregarHorarios(data) {
    const lista = document.getElementById('listaHorarios');
    if (!lista) return;
    
    const agendamentos = JSON.parse(localStorage.getItem('agendamentos')) || [];
    
    // Pega os serviços selecionados
    const servicosSelecionados = [];
    document.querySelectorAll('.servico-check:checked').forEach(cb => {
        servicosSelecionados.push(cb.value);
    });
    
    if (servicosSelecionados.length === 0) {
        lista.innerHTML = '<p style="text-align:center;color:#9a7a76;grid-column:1/-1;padding:1rem;">⚠️ Selecione pelo menos um serviço</p>';
        return;
    }
    
    // Verifica horários ocupados
    const horariosOcupados = [];
    servicosSelecionados.forEach(servico => {
        const agendados = agendamentos.filter(a => a.data === data && a.servico === servico);
        agendados.forEach(a => {
            if (!horariosOcupados.includes(a.horario)) {
                horariosOcupados.push(a.horario);
            }
        });
    });
    
    const configHorario = getConfigHorarioAgenda(data);
    const horarios = [];
    const inicioMinutos = configHorario.inicio * 60;
    const fimMinutos = Math.round(configHorario.fim * 60);

    for (let totalMinutos = inicioMinutos; totalMinutos <= fimMinutos; totalMinutos += 30) {
        const hora = Math.floor(totalMinutos / 60);
        const minutos = totalMinutos % 60;
        const horarioStr = `${String(hora).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
        horarios.push(horarioStr);
    }
    
    lista.innerHTML = '';
    
    const horariosDisponiveis = horarios.filter(h => !horariosOcupados.includes(h));
    
    if (horarios.length === 0) {
        lista.innerHTML = '<p style="text-align:center;color:#9a7a76;grid-column:1/-1;padding:1rem;">Nenhum horário disponível</p>';
        return;
    }
    
    // Resumo de disponibilidade
    const resumo = document.createElement('div');
    resumo.style.cssText = `
        grid-column: 1 / -1;
        text-align: center;
        font-size: 0.75rem;
        color: #7a5a56;
        padding: 0.3rem;
        background: rgba(196, 154, 148, 0.05);
        border-radius: 10px;
        margin-bottom: 0.3rem;
    `;
    const totalHorarios = horarios.length;
    const ocupados = horariosOcupados.length;
    resumo.textContent = `📊 ${horariosDisponiveis.length} horários disponíveis de ${totalHorarios} (${ocupados} ocupados)`;
    lista.appendChild(resumo);
    
    horarios.forEach(horario => {
        const isOcupado = horariosOcupados.includes(horario);
        const div = document.createElement('div');
        div.className = 'horario-card-mobile' + (isOcupado ? ' indisponivel' : '');

        const horaEl = document.createElement('div');
        horaEl.className = 'hora';
        horaEl.textContent = horario;

        const statusEl = document.createElement('div');
        statusEl.className = 'status';
        statusEl.textContent = isOcupado ? '❌ Indisponível' : '✅ Disponível';

        div.appendChild(horaEl);
        div.appendChild(statusEl);

        if (!isOcupado) {
            div.addEventListener('click', function() {
                document.querySelectorAll('.horario-card-mobile').forEach(el => {
                    el.classList.remove('selecionado');
                });
                this.classList.add('selecionado');
                horarioSelecionado = horario;

                const servicosLista = servicosSelecionados.join(' + ');
                const valorTotal = servicosSelecionados.reduce((total, serv) => {
                    const valor = VALORES[serv] || 'R$ 0';
                    const num = parseFloat(String(valor).replace(/[^0-9,\.]/g, '').replace(',', '.')) || 0;
                    return total + num;
                }, 0);
                const valorFormatado = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;

                abrirModal(data, horario, servicosLista, valorFormatado);
            });
        }

        lista.appendChild(div);
    });
    
    // Se todos estiverem ocupados
    if (horariosDisponiveis.length === 0) {
        const msg = document.createElement('div');
        msg.style.cssText = `
            grid-column: 1 / -1;
            text-align: center;
            padding: 1.5rem 0.5rem;
            background: rgba(231, 76, 60, 0.05);
            border-radius: 14px;
            border: 2px dashed rgba(231, 76, 60, 0.15);
            margin-top: 0.5rem;
        `;
        msg.innerHTML = `
            <span style="font-size: 2rem;display:block;">😔</span>
            <p style="color:#7a5a56;font-weight:500;">Todos os horários estão ocupados para este dia</p>
            <p style="color:#9a7a76;font-size:0.8rem;margin-top:0.2rem;">Tente selecionar outra data ou serviço</p>
        `;
        lista.appendChild(msg);
    }
}

// ========== MUDAR SERVIÇO ==========
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.servico-check').forEach(cb => {
        cb.addEventListener('change', function() {
            if (dataSelecionada) {
                carregarHorarios(dataSelecionada);
            }
        });
    });
});

// ========== ABRIR MODAL ==========
function abrirModal(data, horario, servicos, valorTotal) {
    const modal = document.getElementById('modalAgendamento');
    const detalhes = document.getElementById('detalhesAgendamento');
    
    if (!modal || !detalhes) return;
    
    const dataFormatada = formatarData(data);
    // Prepara detalhes com textContent (evita innerHTML com conteúdo do usuário)
    detalhes.innerHTML = '';
    const pData = document.createElement('p'); pData.textContent = `📅 Data: ${dataFormatada}`;
    const pHora = document.createElement('p'); pHora.textContent = `⏰ Horário: ${horario}`;
    const pServ = document.createElement('p'); pServ.textContent = `💅 Serviços: ${servicos}`;
    const pVal = document.createElement('p'); pVal.textContent = `💰 Valor total: ${valorTotal}`;
    detalhes.appendChild(pData);
    detalhes.appendChild(pHora);
    detalhes.appendChild(pServ);
    detalhes.appendChild(pVal);
    
    document.getElementById('nomeCliente').value = '';
    document.getElementById('telefoneCliente').value = '';
    document.getElementById('observacaoCliente').value = '';
    
    const confirmarBtn = document.getElementById('confirmarAgendamento');
    if (confirmarBtn) {
        confirmarBtn.dataset.data = data;
        confirmarBtn.dataset.horario = horario;
        confirmarBtn.dataset.servicos = servicos;
        confirmarBtn.dataset.valor = valorTotal;
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ========== FECHAR MODAL ==========
function fecharModal() {
    const modal = document.getElementById('modalAgendamento');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ========== CONFIRMAR AGENDAMENTO ==========
document.addEventListener('DOMContentLoaded', function() {
    const confirmarBtn = document.getElementById('confirmarAgendamento');
    if (confirmarBtn) {
        confirmarBtn.addEventListener('click', function() {
            const nome = document.getElementById('nomeCliente').value.trim();
            const telefone = document.getElementById('telefoneCliente').value.trim();
            const observacao = document.getElementById('observacaoCliente').value.trim();
            const data = this.dataset.data;
            const horario = this.dataset.horario;
            const servicos = this.dataset.servicos;
            const valorTotal = this.dataset.valor;
            const enviarWhatsApp = document.getElementById('confirmarWhatsApp').checked;
            const addGoogleCalendar = document.getElementById('confirmarGoogleCalendar').checked;
            
            if (!nome) {
                alert('Por favor, digite seu nome.');
                return;
            }
            
            if (!telefone) {
                alert('Por favor, digite seu WhatsApp.');
                return;
            }
            
            let telefoneLimpo = telefone.replace(/\D/g, '');
            if (telefoneLimpo.length < 10) {
                alert('Por favor, digite um número de WhatsApp válido.');
                return;
            }
            // Normaliza para incluir DDI do Brasil (55) se não informado
            if (!telefoneLimpo.startsWith('55')) {
                if (telefoneLimpo.length === 10 || telefoneLimpo.length === 11) {
                    telefoneLimpo = '55' + telefoneLimpo;
                }
            }
            
            // VERIFICA CONFLITO
            const agendamentosExistentes = JSON.parse(localStorage.getItem('agendamentos')) || [];
            const servicosSelecionados = [];
            document.querySelectorAll('.servico-check:checked').forEach(cb => {
                servicosSelecionados.push(cb.value);
            });
            
            let conflito = false;
            servicosSelecionados.forEach(servico => {
                const existe = agendamentosExistentes.some(a => 
                    a.data === data && 
                    a.horario === horario && 
                    a.servico === servico
                );
                if (existe) conflito = true;
            });
            
            if (conflito) {
                alert('❌ Desculpe, este horário acabou de ser ocupado por outra cliente.\n\nPor favor, selecione outro horário.');
                fecharModal();
                carregarHorarios(data);
                return;
            }
            
            // CRIA AGENDAMENTOS
                const agendamentos = JSON.parse(localStorage.getItem('agendamentos')) || [];
            
                servicosSelecionados.forEach(servico => {
                    const valor = VALORES[servico] || 'R$ 0';

                    const agendamento = {
                        id: Date.now() + Math.floor(Math.random() * 1000),
                        data: data,
                        horario: horario,
                        servico: servico,
                        valor: valor,
                        nome: nome,
                        telefone: telefoneLimpo,
                        observacao: observacao,
                        dataAgendamento: new Date().toLocaleString('pt-BR'),
                        confirmado: true
                    };
                    agendamentos.push(agendamento);
                });
            
            localStorage.setItem('agendamentos', JSON.stringify(agendamentos));
            
            fecharModal();
            
            const dataFormatada = formatarData(data);
            let mensagem = `✅ Agendamento confirmado!\n\n`;
            mensagem += `👤 ${nome}\n`;
            mensagem += `📅 ${dataFormatada} às ${horario}\n`;
            mensagem += `💅 ${servicos}\n`;
            mensagem += `💰 ${valorTotal}\n`;
            if (observacao) mensagem += `💬 "${observacao}"\n`;
            mensagem += `\n📱 Confirmação enviada para seu WhatsApp.`;
            
            alert(mensagem);
            
            if (enviarWhatsApp) {
                enviarConfirmacaoWhatsApp(nome, telefoneLimpo, dataFormatada, horario, servicos, valorTotal, observacao);
            }
            
            if (addGoogleCalendar) {
                adicionarGoogleCalendar(nome, data, horario, servicos, valorTotal, observacao);
            }
            
            if (typeof dataSelecionada !== 'undefined' && dataSelecionada) {
                carregarHorarios(dataSelecionada);
            }
        });
    }
});

// ========== FECHAR MODAL COM BOTÃO ==========
document.addEventListener('DOMContentLoaded', function() {
    const btnClose = document.querySelector('.btn-close-modal-mobile');
    if (btnClose) {
        btnClose.addEventListener('click', fecharModal);
    }
    
    const modal = document.getElementById('modalAgendamento');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) fecharModal();
        });
    }
});

// ========== ENVIAR WHATSAPP ==========
function enviarConfirmacaoWhatsApp(nome, telefone, data, horario, servicos, valorTotal, observacao) {
    const numeroEstabelecimento = '5519989314967';
    
    const mensagemCliente = `Olá ${nome}! 👋\n\n` +
        `Seu agendamento foi confirmado com sucesso:\n\n` +
        `📅 ${data}\n` +
        `⏰ ${horario}\n` +
        `💅 ${servicos}\n` +
        `💰 ${valorTotal}\n` +
        `${observacao ? '💬 "'+observacao+'"\n\n' : '\n'}` +
        `📍 Rua Orlando Mingati, 632 - Jardim das Oliveiras\n\n` +
        `⚠️ Chegue com 10 minutos de antecedência.\n` +
        `Cancelamentos com até 24h de antecedência.\n\n` +
        `Te esperamos com carinho! 💗✨\n\n` +
        `📱 Qualquer dúvida, entre em contato conosco.`;
    
    const urlCliente = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagemCliente)}`;
    window.open(urlCliente, '_blank');
    
    setTimeout(() => {
        const mensagemEstabelecimento = `🔔 NOVO AGENDAMENTO!\n\n` +
            `👤 Cliente: ${nome}\n` +
            `📱 Telefone: ${telefone}\n` +
            `📅 ${data} às ${horario}\n` +
            `💅 ${servicos}\n` +
            `💰 ${valorTotal}\n` +
            `${observacao ? '💬 "'+observacao+'"\n' : ''}\n` +
            `✅ Confirmação enviada para o cliente.`;
        
        const urlEstabelecimento = `https://wa.me/${numeroEstabelecimento}?text=${encodeURIComponent(mensagemEstabelecimento)}`;
        window.open(urlEstabelecimento, '_blank');
    }, 1500);
}

// ========== GOOGLE CALENDAR ==========
function adicionarGoogleCalendar(nome, data, horario, servicos, valorTotal, observacao) {
    if (!data || !horario) return;
    
    const [ano, mes, dia] = data.split('-');
    const [hora, minuto] = horario.split(':');
    
    const dataInicio = new Date(ano, mes-1, dia, hora, minuto);
    const dataFim = new Date(dataInicio.getTime() + 50*60*1000);
    
    const start = dataInicio.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const end = dataFim.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const titulo = `${servicos} - ${nome}`;
    const descricao = `Cliente: ${nome}\nServiços: ${servicos}\nValor: ${valorTotal}\nObservação: ${observacao || 'Nenhuma'}`;
    const local = 'Rua Orlando Mingati, 632 - Jardim das Oliveiras';
    
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
        `&text=${encodeURIComponent(titulo)}` +
        `&dates=${start}/${end}` +
        `&details=${encodeURIComponent(descricao)}` +
        `&location=${encodeURIComponent(local)}` +
        `&sf=true&output=xml`;
    
    window.open(url, '_blank');
}

// ========== EXPORTAR FUNÇÕES ==========
window.abrirModal = abrirModal;
window.fecharModal = fecharModal;
window.formatarData = formatarData;
window.enviarConfirmacaoWhatsApp = enviarConfirmacaoWhatsApp;
window.adicionarGoogleCalendar = adicionarGoogleCalendar;
window.carregarHorarios = carregarHorarios;

console.log('✅ Beauty by Carol - Calendário carregado com sucesso!');
