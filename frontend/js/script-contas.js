// Aguarda o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM carregado, iniciando...");

    // Tenta configurar máscara de moeda
    configurarMascaraValor();

    // Tenta configurar o formulário
    configurarFormulario();

    // Tenta configurar a tabela
    configurarTabela();

    // Tenta configurar as categorias
    configurarCategorias();

    // Tenta carregar dados iniciais (funções devem estar definidas globalmente ou importadas)
    if (typeof carregarFornecedores === 'function') {
        carregarFornecedores();
    } else {
        console.warn("Função carregarFornecedores não encontrada.");
    }
    if (typeof carregarCategorias === 'function') {
        carregarCategorias(); // Para preencher o select de categoria
    } else {
        console.warn("Função carregarCategorias não encontrada.");
    }
    // A função carregarContas pertence à página de listagem, não deve ser chamada aqui
    // if (typeof carregarContas === 'function') carregarContas();
});


// --- FUNÇÕES DE CONFIGURAÇÃO ---

function configurarMascaraValor() {
    const valorTotalInput = document.getElementById('valor-total');
    if (valorTotalInput) {
        console.log("Configurando máscara para #valor-total...");
        valorTotalInput.addEventListener('input', formatarMoedaInput);
    }
}

function configurarFormulario() {
    const formConta = document.getElementById('form-conta');
    if (formConta) {
        formConta.addEventListener('submit', validarEAdicionarConta);
        console.log("Listener de SUBMIT adicionado ao #form-conta.");

        // Adiciona listener para os radios de pagamento para mostrar/ocultar parcelas
        const radiosPagamento = formConta.querySelectorAll('input[name="tipoPagamento"]');
        radiosPagamento.forEach(radio => {
            radio.addEventListener('change', toggleNumeroParcelas);
        });
        // Chama uma vez para garantir estado inicial correto
        toggleNumeroParcelas();
    }
}

function configurarTabela() {
    const tabelaContas = document.getElementById('tabela-contas');
    if (tabelaContas) {
        tabelaContas.addEventListener('click', gerenciarBotosTabela);
        console.log("Listener de CLICK adicionado a #tabela-contas.");
    }
}

function configurarCategorias() {
    const categoriaSelect = document.getElementById('categoria-select'); // Usa o ID correto
    if (categoriaSelect) {
        categoriaSelect.addEventListener('change', atualizarSubcategorias);
        atualizarSubcategorias(); // Chama no início
        console.log("Listener de CHANGE adicionado a #categoria-select.");
    }
}

// --- FUNÇÕES AUXILIARES ---

function formatarMoedaInput(e) {
    let value = e.target.value;
    value = value.replace(/\D/g, "");
    if (value === "") {
        e.target.value = '';
        return;
    }
    value = (parseFloat(value) / 100);
    e.target.value = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function toggleNumeroParcelas() {
    const formConta = document.getElementById('form-conta');
    if (!formConta) return;

    const radioParcelado = formConta.querySelector('#tipoPagamentoParcelado');
    const divParcelas = document.getElementById('div-numero-parcelas');
    const inputParcelas = document.getElementById('numeroParcelas');

    if (divParcelas && inputParcelas) {
        if (radioParcelado && radioParcelado.checked) {
            divParcelas.style.display = 'block';
            inputParcelas.required = true;
        } else {
            divParcelas.style.display = 'none';
            inputParcelas.required = false;
            inputParcelas.value = '';
        }
    }
}


/**
 * Atualiza as opções do select de sub-categoria baseado na categoria selecionada.
 */
async function atualizarSubcategorias() {
    const categoriaSelect = document.getElementById('categoria-select'); // ID correto
    const subcategoriaSelect = document.getElementById('subcategoria-select'); // ID correto

    if (!categoriaSelect || !subcategoriaSelect) return;

    const categoriaId = categoriaSelect.value;
    subcategoriaSelect.innerHTML = '<option value="">Carregando...</option>';
    subcategoriaSelect.disabled = true;

    if (!categoriaId) {
        subcategoriaSelect.innerHTML = '<option value="">Selecione categoria</option>';
        return;
    }

    try {
        // Assume que o endpoint retorna as subcategorias filtradas pelo ID da categoria
        const response = await fetch(`http://localhost:3000/categorias/${categoriaId}/subcategorias`);
        if (!response.ok) {
           throw new Error(`Erro ${response.status} ao buscar subcategorias.`);
        }
        const subcategorias = await response.json();

        if (subcategorias && subcategorias.length > 0) {
            subcategoriaSelect.innerHTML = '<option value="">Selecione...</option>';
            subcategorias.forEach(sub => {
                const option = new Option(sub.nome, sub._id); // Texto, Valor
                subcategoriaSelect.add(option);
            });
            subcategoriaSelect.disabled = false;
        } else {
            subcategoriaSelect.innerHTML = '<option value="">Nenhuma subcategoria</option>';
            subcategoriaSelect.disabled = true;
        }

    } catch (error) {
        console.error("Erro ao carregar subcategorias:", error);
        subcategoriaSelect.innerHTML = '<option value="">Erro ao carregar</option>';
        subcategoriaSelect.disabled = true;
        // alert(`Não foi possível carregar as subcategorias: ${error.message}`);
    }
}


/**
 * Valida os dados do formulário e, se válidos, chama a função para salvar no backend.
 */
function validarEAdicionarConta(event) {
    console.log("validarEAdicionarConta INICIADA!");
    event.preventDefault();

    const form = event.target;
    const descricaoInput = form.querySelector('#descricao');
    const valorInput = form.querySelector('#valor-total');
    const vencimentoInput = form.querySelector('#data-vencimento');
    const categoriaSelect = form.querySelector('#categoria-select'); // ID correto
    const subcategoriaSelect = form.querySelector('#subcategoria-select'); // ID correto
    const fornecedorSelect = form.querySelector('#fornecedor-select'); // ID correto
    const notaFiscalInput = form.querySelector('#nota-fiscal');
    const radioParcelaUnica = form.querySelector('#tipoPagamentoUnica');
    const radioParcelado = form.querySelector('#tipoPagamentoParcelado');
    const numeroParcelasInput = form.querySelector('#numeroParcelas');
    const observacaoTextarea = form.querySelector('#observacao');

    console.log("Coletando dados...");
    let erros = [];

    // --- Validações ---
    console.log("Iniciando validações...");

    // [VALIDAÇÃO VALOR TOTAL]
    const valorString = valorInput.value;
    // Remove "R$", pontos de milhar, troca vírgula decimal por ponto e remove espaços
    const valorLimpo = valorString.replace("R$", "").replace(/\./g, "").replace(",", ".").trim();
    const valorNumerico = parseFloat(valorLimpo); // Primeira declaração

    if (valorString.trim() === '' || isNaN(valorNumerico) || valorNumerico <= 0) {
        console.error(`Validação Valor Total falhou. Input: "${valorString}", Limpo: "${valorLimpo}", Num: ${valorNumerico}`);
        erros.push("Valor Total inválido (deve ser preenchido e maior que zero).");
    }

    // [VALIDAÇÃO DESCRIÇÃO]
    if (!descricaoInput.value || descricaoInput.value.trim() === "") {
        erros.push("O campo Descrição é obrigatório.");
    }

    // [VALIDAÇÃO VENCIMENTO]
    if (!vencimentoInput.value || vencimentoInput.value.trim() === "") {
        erros.push("O campo Vencimento é obrigatório.");
    } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(vencimentoInput.value.trim())) {
         erros.push("Formato de Data de Vencimento inválido (use dd/mm/AAAA).");
    }

    // [VALIDAÇÃO CATEGORIA]
    if (!categoriaSelect.value || categoriaSelect.value === "") {
        erros.push("O campo Categoria é obrigatório.");
    }

    // [VALIDAÇÃO CONDICIONAL SUB-CATEGORIA]
    const subcategoriaHabilitada = !subcategoriaSelect.disabled;
    if (categoriaSelect.value && subcategoriaHabilitada && (!subcategoriaSelect.value || subcategoriaSelect.value === "")) {
        erros.push("Para esta Categoria, a Sub-categoria é obrigatória.");
    }

    // [VALIDAÇÃO FORNECEDOR]
    if (!fornecedorSelect.value || fornecedorSelect.value === "") {
         erros.push("O campo Fornecedor é obrigatório.");
    }

    // [VALIDAÇÃO TIPO PAGAMENTO E PARCELAS]
    let tipoPagamento = '';
    let numeroParcelas = null;
    if (radioParcelaUnica && radioParcelado) {
        if (radioParcelaUnica.checked) {
            tipoPagamento = 'unica';
        } else if (radioParcelado.checked) {
            tipoPagamento = 'parcelado';
            const parcelasStr = numeroParcelasInput ? numeroParcelasInput.value : '';
            numeroParcelas = parseInt(parcelasStr, 10);
            if (isNaN(numeroParcelas) || numeroParcelas <= 1) {
                if (document.getElementById('div-numero-parcelas')?.style.display !== 'none') {
                   erros.push("Número de Parcelas inválido (deve ser maior que 1).");
                }
            }
        } else {
            erros.push("Selecione o Tipo de Pagamento (Única ou Parcelado).");
        }
    } else {
         console.warn("Radios de tipo de pagamento não encontrados.");
    }

    // --- Mostrar Erros ou Continuar ---
    if (erros.length > 0) {
        console.error("Validação falhou:", erros);
        alert("Campos inválidos ou faltando:\n\n- " + erros.join("\n- "));
        // Foca no primeiro campo com erro
        // ... (lógica de foco omitida para brevidade, mantenha a sua)
        return;
    }

    console.log("Validações OK. Preparando dados para salvar...");

    // --- Preparar Dados ---
    // *** ERRO ESTÁ AQUI ***
    // Você declarou 'const valorNumerico' novamente. Renomeie ou remova o 'const'.
    // Vou usar a variável 'valorNumerico' já existente.
    // const valorNumerico = parseFloat(valorLimpo); // REMOVA OU RENOMEIE esta linha 

    const novaConta = {
        descricao: descricaoInput.value.trim(),
        valor: valorNumerico, // Usa a variável declarada no início da validação
        dataVencimento: vencimentoInput.value.trim(),
        categoria: categoriaSelect.value, // Envia o ID da categoria
        subcategoria: subcategoriaSelect.disabled ? null : subcategoriaSelect.value, // Envia o ID da subcategoria
        fornecedor: fornecedorSelect.value, // Envia o ID do fornecedor
        notaFiscal: notaFiscalInput.value.trim(),
        tipoPagamento: tipoPagamento,
        numeroParcelas: tipoPagamento === 'parcelado' ? numeroParcelas : null,
        observacao: observacaoTextarea ? observacaoTextarea.value.trim() : '',
    };

    console.log("Nova conta:", novaConta);

    // --- Chamar Backend ---
    salvarContaNoBackend(novaConta);
}

// --- FUNÇÕES DE INTERAÇÃO COM BACKEND ---

async function salvarContaNoBackend(conta) {
    console.log("Enviando conta para o backend:", conta);
    document.body.style.cursor = 'wait'; // Feedback visual
    try {
        const response = await fetch('http://localhost:3000/contas', { // Rota da API para criar conta
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(conta)
        });

        document.body.style.cursor = 'default';

        if (!response.ok) {
            let errorData;
            try { errorData = await response.json(); }
            catch(e) { errorData = { message: `Erro HTTP ${response.status} - ${response.statusText}` }; }
            console.error('Erro do backend ao salvar:', errorData);
            throw new Error(errorData.message || 'Erro desconhecido ao salvar conta');
        }

        const contaSalva = await response.json();
        console.log('Conta salva com sucesso:', contaSalva);
        alert('Conta lançada com sucesso!');

        // Limpar formulário e resetar subcategoria
        const form = document.getElementById('form-conta');
        if (form) form.reset();
        atualizarSubcategorias();
        toggleNumeroParcelas(); // Garante que o campo parcelas seja ocultado

        // Fechar o painel lateral (se existir)
        const formContainer = document.getElementById('form-container');
        formContainer?.classList.remove('visivel');

        // Atualizar a tabela SE ela existir nesta página (caso raro, mas possível)
        if (document.getElementById('tabela-contas')) {
             adicionarLinhaNaTabela(contaSalva);
             ordenarTabela();
        }
        // É mais comum redirecionar ou ter a tabela na própria página de lançamento
        // Se a tabela estiver em contasAPagar.html, ela será atualizada ao carregar aquela página.


    } catch (error) {
        document.body.style.cursor = 'default';
        console.error('Erro ao salvar conta:', error);
        alert('Falha ao salvar a conta: ' + error.message);
    }
}

// --- FUNÇÕES DA TABELA (Listagem e Ações) ---
// Estas funções são mais relevantes para contasAPagar.html, mas podem ser chamadas
// se a tabela estiver presente na página de lançamento também.

/**
 * Adiciona uma nova linha na tabela de contas.
 */
function adicionarLinhaNaTabela(conta) {
    const tbody = document.getElementById('tabela-contas')?.getElementsByTagName('tbody')[0];
    if (!tbody) return;

    const newRow = tbody.insertRow();

    // Formata data
    let dataVencFormatada = conta.dataVencimento || 'N/A';
    try {
        if (conta.dataVencimento && (conta.dataVencimento.includes('T') || conta.dataVencimento.includes('-'))) {
           const data = new Date(conta.dataVencimento);
           const dia = String(data.getUTCDate()).padStart(2, '0');
           const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
           const ano = data.getUTCFullYear();
           dataVencFormatada = `${dia}/${mes}/${ano}`;
        }
    } catch(e) { console.error("Erro ao formatar data:", conta.dataVencimento, e); }

    // Formata valor
    const valorFormatado = (typeof conta.valor === 'number')
        ? conta.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : 'R$ -';

    // Preenche células (AJUSTE A ORDEM SE NECESSÁRIO)
    newRow.insertCell(0).textContent = conta.descricao || 'N/A';
    newRow.insertCell(1).textContent = valorFormatado;
    newRow.insertCell(2).textContent = dataVencFormatada;
    // Precisa buscar nome da categoria/subcategoria ou exibir IDs?
    // Assumindo que o backend pode popular os nomes:
    newRow.insertCell(3).textContent = conta.categoria?.nome || conta.categoria || 'N/A'; // Exibe nome se populado, senão ID
    newRow.insertCell(4).textContent = conta.status || 'pendente';

    // Célula de Ações
    const cellAcoes = newRow.insertCell(5);
    cellAcoes.classList.add('acoes');
    const contaId = conta._id || conta.id || '';
    const isPaga = conta.status === 'pago';

    cellAcoes.innerHTML = `
        <button class="btn btn-sm btn-info btn-editar" data-id="${contaId}" title="Editar">✏️</button>
        <button class="btn btn-sm btn-danger btn-excluir" data-id="${contaId}" title="Excluir">🗑️</button>
        ${!isPaga ? `<button class="btn btn-sm btn-success btn-pagar" data-id="${contaId}" title="Marcar como Pago">✔️</button>` : ''}
    `;
}

/**
 * Gerencia cliques nos botões da tabela.
 */
function gerenciarBotosTabela(event) {
    const target = event.target.closest('button');
    if (!target) return;

    const contaId = target.dataset.id;
    const linha = target.closest('tr');

    if (target.classList.contains('btn-excluir')) {
        if (confirm(`Tem certeza que deseja excluir esta conta?\nID: ${contaId || 'N/A'}`)) {
            if (contaId) {
                 excluirContaNoBackend(contaId, linha);
            } else {
                 linha?.remove(); // Permite remover linha mesmo sem ID (teste)
            }
        }
    } else if (target.classList.contains('btn-editar')) {
        console.log('Editar conta ID:', contaId);
        alert('Funcionalidade Editar não implementada.');
        // Ex: abrirModalEdicao(contaId); ou redirecionar

    } else if (target.classList.contains('btn-pagar')) {
         if (confirm(`Marcar esta conta como paga?\nID: ${contaId}`)) {
            console.log('Pagar conta ID:', contaId);
            if (contaId) {
                marcarContaComoPaga(contaId, linha, target);
            } else {
                 alert("Não é possível marcar como paga: ID da conta não encontrado.");
            }
         }
    }
}

/**
 * Exclui conta no backend e remove linha da tabela se sucesso.
 */
async function excluirContaNoBackend(id, tableRow) {
    if (!id) return alert("Erro: ID da conta não encontrado para exclusão.");
    console.log(`Tentando excluir conta com ID: ${id}`);
    document.body.style.cursor = 'wait';
    try {
        const response = await fetch(`http://localhost:3000/contas/${id}`, { method: 'DELETE' }); // Rota da API
        document.body.style.cursor = 'default';

        if (!response.ok) {
            let errorData;
            try { errorData = await response.json(); }
            catch(e) { errorData = { message: `Erro HTTP ${response.status}` }; }
            console.error('Erro do backend ao excluir:', errorData);
            throw new Error(errorData.message || 'Erro ao excluir conta');
        }
        console.log('Conta excluída com sucesso no backend:', id);
        if (tableRow) {
            tableRow.remove(); // Remove a linha da UI
            console.log('Linha removida da tabela.');
        }
        alert('Conta excluída com sucesso!');
        // Opcional: Recarregar contas se a lógica de remoção falhar
        // if (typeof carregarContas === 'function') carregarContas();

    } catch(error) {
        document.body.style.cursor = 'default';
        console.error('Erro na requisição para excluir conta:', error);
        alert('Falha ao excluir conta: ' + error.message);
    }
}


/**
 * Marca conta como paga no backend e atualiza a UI se sucesso.
 */
async function marcarContaComoPaga(id, tableRow, button) {
     if (!id) return alert("Erro: ID da conta não encontrado para marcar como paga.");
     console.log(`Tentando marcar como paga a conta com ID: ${id}`);
     document.body.style.cursor = 'wait';
     try {
        // Rota da API para marcar como paga (verifique seu backend)
        const response = await fetch(`http://localhost:3000/contas/${id}/pagar`, { method: 'PATCH' });
        document.body.style.cursor = 'default';

        if (!response.ok) {
            let errorData;
            try { errorData = await response.json(); }
            catch(e) { errorData = { message: `Erro HTTP ${response.status}` }; }
            console.error('Erro do backend ao marcar como paga:', errorData);
            throw new Error(errorData.message || 'Erro ao marcar como paga');
        }
        const contaAtualizada = await response.json();
        console.log('Conta marcada como paga no backend:', contaAtualizada);

        // Atualiza a interface
        if (tableRow) {
            // Assumindo que a célula de status é a 5ª (índice 4)
            const statusCell = tableRow.cells[4];
            if(statusCell) statusCell.textContent = 'pago';
            console.log('Status atualizado na tabela.');
        }
        if (button) {
            button.remove(); // Remove o botão "Pagar"
            console.log('Botão "Pagar" removido.');
        }
        alert('Conta marcada como paga!');

    } catch(error) {
        document.body.style.cursor = 'default';
        console.error('Erro na requisição para marcar como paga:', error);
        alert('Falha ao marcar conta como paga: ' + error.message);
    }
}


/**
 * Converte data "dd/mm/AAAA" para objeto Date para comparação na ordenação.
 */
function parseDate(dateStr) {
    try {
        if (!dateStr || typeof dateStr !== 'string' || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
             return new Date(0);
        }
        const [day, month, year] = dateStr.split('/');
        const date = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10)));
        if (isNaN(date.getTime())) {
            return new Date(0);
        }
        return date;
    } catch (e) {
        console.error("Erro ao parsear data para ordenação:", dateStr, e);
        return new Date(0);
    }
}


/**
 * Ordena as linhas da tabela pela data de vencimento (mais próxima primeiro).
 */
function ordenarTabela() {
    const tbody = document.getElementById('tabela-contas')?.getElementsByTagName('tbody')[0];
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));

    rows.sort((a, b) => {
        // Assumindo vencimento na célula de índice 2
        const dateStrA = a.cells[2]?.textContent || '';
        const dateStrB = b.cells[2]?.textContent || '';

        const dateA = parseDate(dateStrA);
        const dateB = parseDate(dateStrB);

        if (dateA.getTime() === 0 && dateB.getTime() === 0) return 0;
        if (dateA.getTime() === 0) return 1;
        if (dateB.getTime() === 0) return -1;

        return dateA - dateB;
    });

    rows.forEach(row => tbody.appendChild(row));
    console.log("Tabela reordenada por vencimento.");
}


// --- Funções de Carregamento de Dados (exemplo, podem estar em outros arquivos) ---
async function carregarFornecedores() {
    console.log("Tentando carregar fornecedores...");
    try {
        const response = await fetch('http://localhost:3000/fornecedores'); // Rota da API
        if (!response.ok) throw new Error(`Erro ${response.status}`);
        const fornecedores = await response.json();
        const select = document.getElementById('fornecedor-select'); // ID correto
        if (!select) return; // Só preenche se o select existir
        select.innerHTML = '<option value="">Selecione...</option>'; // Limpa antes
        fornecedores.forEach(f => {
            select.add(new Option(f.nome, f._id)); // (Texto, Valor)
        });
        console.log("Fornecedores carregados.");
    } catch (error) {
        console.error('Erro ao carregar fornecedores:', error);
        // alert('Erro ao carregar fornecedores.');
    }
}

async function carregarCategorias() {
    console.log("Tentando carregar categorias...");
    try {
        const response = await fetch('http://localhost:3000/categorias'); // Rota da API
        if (!response.ok) throw new Error(`Erro ${response.status}`);
        const categorias = await response.json();
        const select = document.getElementById('categoria-select'); // ID correto
        if (!select) return; // Só preenche se o select existir
        select.innerHTML = '<option value="">Selecione...</option>'; // Limpa antes
        categorias.forEach(c => {
            // Adiciona apenas categorias principais (assumindo que elas não têm 'categoriaPai')
            if (!c.categoriaPai) {
                 select.add(new Option(c.nome, c._id)); // (Texto, Valor)
            }
        });
        console.log("Categorias carregadas.");
        // Chama atualizarSubcategorias para garantir o estado inicial correto
        atualizarSubcategorias();
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        // alert('Erro ao carregar categorias.');
    }
}
