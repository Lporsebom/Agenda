// ========== COMENTÁRIOS / DEPOIMENTOS ==========
let comentarios = JSON.parse(localStorage.getItem('comentarios')) || [];
let notaSelecionada = 0;

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

// ========== CARREGAR DEPOIMENTOS ==========
function carregarComentarios() {
    const lista = document.getElementById('listaComentarios');
    if (!lista) return;
    
    lista.innerHTML = '';

    if (comentarios.length === 0) {
        lista.innerHTML = `
            <div class="depoimento-vazio">
                <p style="color:#9a7a76;text-align:center;padding:1rem;">
                    🌸 Ainda não temos depoimentos.<br>
                    Seja a primeira a compartilhar sua experiência!
                </p>
            </div>
        `;
        return;
    }

    const comentariosOrdenados = [...comentarios].reverse();
    comentariosOrdenados.slice(0, 10).forEach(com => {
        const div = document.createElement('div');
        div.className = 'depoimento-item-mobile';

        const header = document.createElement('div');
        header.className = 'depoimento-header';

        const nomeSpan = document.createElement('span');
        nomeSpan.className = 'depoimento-nome';
        nomeSpan.textContent = com.nome;

        const estrelasSpan = document.createElement('span');
        estrelasSpan.className = 'depoimento-estrelas';
        estrelasSpan.textContent = '★'.repeat(com.nota) + '☆'.repeat(5 - com.nota);

        header.appendChild(nomeSpan);
        header.appendChild(estrelasSpan);

        const textoDiv = document.createElement('div');
        textoDiv.className = 'depoimento-texto';
        textoDiv.textContent = com.texto;

        const dataDiv = document.createElement('div');
        dataDiv.className = 'depoimento-data';
        dataDiv.textContent = com.data;

        div.appendChild(header);
        div.appendChild(textoDiv);
        div.appendChild(dataDiv);

        lista.appendChild(div);
    });
}

// ========== ESTRELAS ==========
document.addEventListener('DOMContentLoaded', function() {
    const estrelas = document.querySelectorAll('.estrelas i');
    estrelas.forEach(star => {
        star.addEventListener('click', function() {
            notaSelecionada = parseInt(this.dataset.nota);
            document.querySelectorAll('.estrelas i').forEach(s => {
                s.classList.toggle('ativa', parseInt(s.dataset.nota) <= notaSelecionada);
            });
        });
    });

    // ========== FORM DEPOIMENTO ==========
    const formComentario = document.getElementById('formComentario');
    if (formComentario) {
        formComentario.addEventListener('submit', function(e) {
            e.preventDefault();

            const nome = document.getElementById('nomeComentario').value.trim();
            const texto = document.getElementById('textoComentario').value.trim();

            if (!nome || !texto) {
                alert('Preencha todos os campos.');
                return;
            }

            if (notaSelecionada === 0) {
                alert('Por favor, selecione uma avaliação por estrelas.');
                return;
            }

            const comentario = {
                id: Date.now(),
                nome,
                texto,
                nota: notaSelecionada,
                data: new Date().toLocaleString('pt-BR'),
            };

            comentarios.push(comentario);
            localStorage.setItem('comentarios', JSON.stringify(comentarios));

            formComentario.reset();
            notaSelecionada = 0;
            document.querySelectorAll('.estrelas i').forEach(s => s.classList.remove('ativa'));

            carregarComentarios();
            fecharFormDepoimento();
            alert('💗 Depoimento enviado com carinho! Obrigada por compartilhar.');
        });
    }

    // ========== FECHAR MODAL ==========
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

    // ========== INICIALIZAR ==========
    carregarComentarios();
});

// ========== ABRIR/FECHAR FORM DEPOIMENTO ==========
function abrirFormDepoimento() {
    const form = document.getElementById('formDepoimento');
    if (form) {
        form.style.display = 'block';
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function fecharFormDepoimento() {
    const form = document.getElementById('formDepoimento');
    if (form) {
        form.style.display = 'none';
    }
}

// ========== TABS ==========
function trocarTab(tab) {
    // Esconde todas as tabs
    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.remove('active');
    });
    
    // Remove active de todos os botões
    document.querySelectorAll('.tab-btn').forEach(el => {
        el.classList.remove('active');
    });
    
    // Mostra a tab selecionada
    const tabContent = document.getElementById(`tab-${tab}`);
    if (tabContent) {
        tabContent.classList.add('active');
    }
    
    // Ativa o botão
    const btn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
    if (btn) {
        btn.classList.add('active');
    }
}

// ========== FUNÇÕES DE UTILIDADE ==========
function limparDados() {
    if (confirm('Deseja realmente limpar todos os dados?')) {
        localStorage.removeItem('agendamentos');
        localStorage.removeItem('comentarios');
        alert('Dados limpos com sucesso!');
        location.reload();
    }
}

// ========== EXPORTAR FUNÇÕES PARA USO GLOBAL ==========
window.abrirFormDepoimento = abrirFormDepoimento;
window.fecharFormDepoimento = fecharFormDepoimento;
window.trocarTab = trocarTab;
window.carregarComentarios = carregarComentarios;
window.limparDados = limparDados;

console.log('✅ Beauty by Carol - Script carregado com sucesso!');
console.log('📋 Funções disponíveis: trocarTab, abrirFormDepoimento, fecharFormDepoimento');
