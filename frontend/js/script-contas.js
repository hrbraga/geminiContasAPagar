// Este script será responsável por preencher os selects e enviar o formulário

// Função para buscar e preencher os fornecedores
async function carregarFornecedores() {
    try {
        const response = await fetch('http://localhost:3000/fornecedores');
        if (!response.ok) throw new Error('Falha ao buscar fornecedores');
        const fornecedores = await response.json();
        const select = document.getElementById('fornecedor-select');
        select.innerHTML = '<option value="">Selecione...</option>';
        fornecedores.forEach(fornecedor => {
            const option = document.createElement('option');
            option.value = fornecedor.id; // Usamos o ID do fornecedor
            option.textContent = fornecedor.nome;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar fornecedores:', error);
        // Opcional: Mostrar erro na interface
    }
}

// Função para buscar e preencher categorias e subcategorias
async function carregarCategorias() {
    try {
        const response = await fetch('http://localhost:3000/categorias');
        if (!response.ok) throw new Error('Falha ao buscar categorias');
        const categorias = await response.json();
        const selectCategoria = document.getElementById('categoria-select');
        const selectSubcategoria = document.getElementById('subcategoria-select');

        selectCategoria.innerHTML = '<option value="">Selecione...</option>';
        selectSubcategoria.innerHTML = '<option value="">Selecione uma categoria...</option>'; // Mensagem inicial
        selectSubcategoria.disabled = true; // Desabilita subcategoria inicialmente

        categorias.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria.id;
            option.textContent = categoria.nome;
            selectCategoria.appendChild(option);
        });

        // Evento para carregar subcategorias quando uma categoria é selecionada
        selectCategoria.addEventListener('change', (event) => {
            const categoriaId = event.target.value;
            selectSubcategoria.innerHTML = '<option value="">Selecione...</option>'; // Limpa e adiciona opção padrão
            selectSubcategoria.disabled = true; // Mantém desabilitado por padrão

            if (categoriaId) {
                const categoriaSelecionada = categorias.find(c => c.id == categoriaId);
                if (categoriaSelecionada && categoriaSelecionada.subcategorias && categoriaSelecionada.subcategorias.length > 0) {
                    selectSubcategoria.disabled = false; // Habilita se houver subcategorias
                    categoriaSelecionada.subcategorias.forEach(sub => {
                        const option = document.createElement('option');
                        option.value = sub.id;
                        option.textContent = sub.nome;
                        selectSubcategoria.appendChild(option);
                    });
                } else {
                     selectSubcategoria.innerHTML = '<option value="">Nenhuma subcategoria</option>'; // Informa se não há subcategorias
                }
            } else {
                 selectSubcategoria.innerHTML = '<option value="">Selecione uma categoria...</option>'; // Volta à mensagem inicial
            }
        });
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        // Opcional: Mostrar erro na interface
    }
}

// Função para enviar o formulário de lançamento de contas
document.getElementById('form-contas').addEventListener('submit', async (event) => {
    event.preventDefault();

    const novaConta = {
        descricao: document.getElementById('descricao').value,
        valor: document.getElementById('valor').value,
        dataVencimento: document.getElementById('data-vencimento').value,
        fornecedorId: document.getElementById('fornecedor-select').value,
        categoriaId: document.getElementById('categoria-select').value,
        subcategoriaId: document.getElementById('subcategoria-select').value || null // Pode ser nulo ou vazio
    };

     // Validação simples (pode ser mais robusta)
     if (!novaConta.descricao || !novaConta.valor || !novaConta.dataVencimento || !novaConta.fornecedorId || !novaConta.categoriaId) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/contas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaConta)
        });

        if (response.ok) {
            alert('Conta lançada com sucesso!');
            document.getElementById('form-contas').reset(); // Limpa o formulário
            // Reseta também o select de subcategorias
            document.getElementById('subcategoria-select').innerHTML = '<option value="">Selecione uma categoria...</option>';
            document.getElementById('subcategoria-select').disabled = true;
            
            carregarContas(); // Recarrega a lista de contas na página principal
            formContainer.classList.remove('visivel'); // <-- FECHA O PAINEL AUTOMATICAMENTE
        } else {
            // Tenta pegar uma mensagem de erro do backend, se houver
            const errorData = await response.json().catch(() => ({}));
            alert(`Erro ao lançar conta: ${errorData.message || 'Verifique os dados.'}`);
        }
    } catch (error) {
        console.error('Erro de rede ao lançar conta:', error);
        alert('Não foi possível conectar ao servidor para lançar a conta.');
    }
});

// Função para listar as contas a pagar
async function carregarContas() {
    try {
        const response = await fetch('http://localhost:3000/contas');
        if (!response.ok) throw new Error('Falha ao buscar contas');
        const contas = await response.json();
        const lista = document.getElementById('lista-contas');
        lista.innerHTML = ''; // Limpa a lista antes de preencher

        if (contas.length === 0) {
            lista.innerHTML = '<li>Nenhuma conta lançada ainda.</li>';
            return;
        }

        contas.forEach(conta => {
            const li = document.createElement('li');
            // Formata a data (opcional, mas recomendado)
            const dataVenc = new Date(conta.dataVencimento + 'T00:00:00'); // Adiciona T00:00:00 para evitar problemas de fuso
            const dataFormatada = dataVenc.toLocaleDateString('pt-BR');

            li.innerHTML = `
                <span>
                    Descrição: ${conta.descricao} | 
                    Valor: R$ ${parseFloat(conta.valor).toFixed(2)} | 
                    Vencimento: ${dataFormatada} | 
                    Status: <b style="color:${conta.status === 'paga' ? 'green' : 'orange'}">${conta.status}</b> 
                </span>
                ${conta.status === 'pendente' ? `<button class="btn-baixa" onclick="confirmarBaixa(${conta.id})">Dar Baixa</button>` : ''} 
            `; // Adicionado classe e função de confirmação
            lista.appendChild(li);
        });
    } catch (error) {
        console.error('Erro ao carregar contas:', error);
        document.getElementById('lista-contas').innerHTML = '<li>Erro ao carregar a lista de contas. Verifique o servidor.</li>';
    }
}


// --- CONTROLE DO PAINEL LATERAL ---

const btnMostrarForm = document.getElementById('btn-mostrar-form');
const btnFecharForm = document.getElementById('btn-fechar-form');
const formContainer = document.getElementById('form-container');

// Mostrar o painel ao clicar no botão "+ Incluir Conta"
if (btnMostrarForm) {
    btnMostrarForm.addEventListener('click', () => {
        if (formContainer) {
            formContainer.classList.add('visivel');
        }
    });
}

// Esconder o painel ao clicar no botão "X"
if (btnFecharForm) {
    btnFecharForm.addEventListener('click', () => {
        if (formContainer) {
            formContainer.classList.remove('visivel');
        }
    });
}

// Carrega fornecedores, categorias e contas ao carregar a página
if (typeof carregarFornecedores === 'function') carregarFornecedores();
if (typeof carregarCategorias === 'function') carregarCategorias();
if (typeof carregarContas === 'function') carregarContas();
