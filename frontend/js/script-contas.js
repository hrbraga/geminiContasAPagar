// Aguarda o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM carregado, iniciando...");

    // --- Configuração da Máscara de Moeda ---
    const valorTotalInput = document.getElementById('valor-total'); 
    if (!valorTotalInput) {
        console.error('Elemento #valor-total não encontrado para máscara!');
    } else {
        // Listener para formatar o valor enquanto digita
        valorTotalInput.addEventListener('input', function(e) {
            let value = e.target.value;
            // Remove tudo que não for dígito
            value = value.replace(/\D/g, "");
            // Converte para número e divide por 100 para ter os centavos
            value = (parseFloat(value) / 100).toFixed(2); 
            // Formata como moeda BRL
            if (value === 'NaN') {
                 e.target.value = ''; // Limpa se não for número válido
            } else {
                 e.target.value = 'R$ ' + value.replace('.', ',');
                 // Formata para R$ XXX,XX (se precisar de milhares, a lógica é mais complexa)
                 // Adaptação simples para milhares (pode precisar de refinamento)
                 let parts = value.split('.');
                 parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                 e.target.value = 'R$ ' + parts.join(',');
            }
           
        });
    }

    // --- Configuração do Formulário ---
    const formConta = document.getElementById('form-conta');
    if (formConta) {
        formConta.addEventListener('submit', validarEAdicionarConta);
    } else {
        console.warn("Elemento 'form-conta' não encontrado.");
    }

    // --- Configuração da Tabela (para botões) ---
    const tabelaContas = document.getElementById('tabela-contas');
    if (tabelaContas) {
        tabelaContas.addEventListener('click', gerenciarBotosTabela); 
    } else {
        // Não mostra warning se estiver na página de lançamento (onde não há tabela inicialmente)
        if (document.body.contains(document.getElementById('form-conta'))) {
           // Normal não ter tabela aqui ainda
        } else {
           console.warn("Elemento 'tabela-contas' não encontrado (esperado na listagem).");
        }
    }

    // --- Configuração das Categorias ---
    const categoriaSelect = document.getElementById('categoria');
    if (categoriaSelect) {
        categoriaSelect.addEventListener('change', atualizarSubcategorias);
        atualizarSubcategorias(); // Chama no início
    } else {
        console.warn("Elemento 'categoria' não encontrado.");
    }
    
    // --- Carregamento Inicial de Contas (se estiver na página de listagem) ---
    // Verifica se a função carregarContas existe (ela está no script-contas-apagar.js)
    if (typeof carregarContas === 'function') {
         console.log("Iniciando carregarContas()...");
         carregarContas();
    }
});


/**
 * Atualiza as opções do select de sub-categoria baseado na categoria selecionada.
 */
function atualizarSubcategorias() {
    const categoriaSelect = document.getElementById('categoria');
    const subcategoriaSelect = document.getElementById('subcategoria');
    
    if (!categoriaSelect || !subcategoriaSelect) {
        // Não mostra warning se estiver na página errada (ex: listagem)
        if (document.body.contains(document.getElementById('form-conta'))) {
           console.warn("Selects de categoria/subcategoria não encontrados em atualizarSubcategorias.");
        }
        return;
    }

    const categoriaValor = categoriaSelect.value;

    // Dados de exemplo (substitua pelo fetch do seu backend ou use 'categorias.js')
    const subcategoriasDB = {
        "moradia": [
            { value: "aluguel", text: "Aluguel" },
            { value: "luz", text: "Luz" },
            { value: "agua", text: "Água" },
            { value: "internet", text: "Internet/TV"}
        ],
        "lazer": [], // Lazer não tem sub-categoria
        "alimentacao": [
            { value: "supermercado", text: "Supermercado" },
            { value: "restaurante", text: "Restaurante/Delivery" }
        ],
        "transporte": [
             { value: "combustivel", text: "Combustível" },
             { value: "uber", text: "Uber/Apps" },
             { value: "publico", text: "Transporte Público" }
        ],
        "saude": [
            { value: "farmacia", text: "Farmácia" },
            { value: "plano", text: "Plano de Saúde" },
            { value: "consulta", text: "Consulta Médica" }
        ]
        // Adicione outras categorias...
    };

    // Limpa opções antigas
    subcategoriaSelect.innerHTML = '<option value="">Selecione...</option>';

    if (categoriaValor && subcategoriasDB[categoriaValor] && subcategoriasDB[categoriaValor].length > 0) {
        subcategoriaSelect.disabled = false;
        subcategoriasDB[categoriaValor].forEach(sub => {
            const option = new Option(sub.text, sub.value);
            subcategoriaSelect.add(option);
        });
    } else {
        subcategoriaSelect.innerHTML = '<option value="">N/A</option>';
        subcategoriaSelect.disabled = true;
    }
}


/**
 * Valida os dados do formulário e, se válidos, chama a função para adicionar a conta.
 */
function validarEAdicionarConta(event) {
    event.preventDefault();
    console.log("Formulário submetido! Iniciando validações...");

    // --- 1. Coletar Elementos (usando IDs do seu HTML) ---
    const descricaoInput = document.getElementById('descricao');
    const valorInput = document.getElementById('valor-total'); // ID CORRETO
    const vencimentoInput = document.getElementById('data-vencimento'); 
    const categoriaSelect = document.getElementById('categoria');
    const subcategoriaSelect = document.getElementById('subcategoria');
    const fornecedorSelect = document.getElementById('fornecedor'); 
    const notaFiscalInput = document.getElementById('nota-fiscal'); 
    // Adicione os radios de tipo de pagamento
    const radioParcelaUnica = document.getElementById('tipoPagamentoUnica');
    const radioParcelado = document.getElementById('tipoPagamentoParcelado');
    const numeroParcelasInput = document.getElementById('numeroParcelas'); // Assumindo este ID
    const observacaoTextarea = document.getElementById('observacao'); // Assumindo este ID


    let erros = [];

    // --- 2. Realizar Validações ---

    // [VALIDAÇÃO VALOR TOTAL - UNIFICADA]
    const valorStrCru = valorInput.value;
    const valorStrLimpado = valorStrCru.replace("R$", "").replace(/\./g, "").replace(",", ".").trim(); // Remove R$, pontos de milhar, troca vírgula e remove espaços
    const valorNum = parseFloat(valorStrLimpado);

    if (valorStrCru.trim() === '' || isNaN(valorNum) || valorNum <= 0) {
        console.error(`Validação Valor Total falhou. Input: "${valorStrCru}", Limpo: "${valorStrLimpado}", Num: ${valorNum}`);
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
    if (radioParcelaUnica && radioParcelado) { // Verifica se os radios existem
        if (radioParcelaUnica.checked) {
            tipoPagamento = 'unica';
        } else if (radioParcelado.checked) {
            tipoPagamento = 'parcelado';
            const parcelasStr = numeroParcelasInput ? numeroParcelasInput.value : '';
            numeroParcelas = parseInt(parcelasStr, 10);
            if (isNaN(numeroParcelas) || numeroParcelas <= 1) {
                erros.push("Número de Parcelas inválido (deve ser maior que 1).");
            }
        } else {
            erros.push("Selecione o Tipo de Pagamento (Única ou Parcelado).");
        }
    } else {
         console.warn("Radios de tipo de pagamento não encontrados.");
    }

    // --- 3. Mostrar Erros ou Continuar ---
    if (erros.length > 0) {
        console.error("Validação falhou:", erros); 
        alert("Campos inválidos ou faltando:\n\n- " + erros.join("\n- "));
        
        // Foca no primeiro campo com erro (melhorado)
        if (erros.some(e => e.includes("Valor Total"))) valorInput?.focus();
        else if (erros.some(e => e.includes("Descrição"))) descricaoInput?.focus();
        else if (erros.some(e => e.includes("Vencimento"))) vencimentoInput?.focus();
        else if (erros.some(e => e.includes("Categoria"))) categoriaSelect?.focus();
        else if (erros.some(e => e.includes("Sub-categoria"))) subcategoriaSelect?.focus();
        else if (erros.some(e => e.includes("Fornecedor"))) fornecedorSelect?.focus();
        else if (erros.some(e => e.includes("Tipo de Pagamento"))) radioParcelaUnica?.focus();
        else if (erros.some(e => e.includes("Parcelas"))) numeroParcelasInput?.focus();
        
        return; 
    }

    console.log("Validações OK. Preparando dados para salvar...");

    // --- 4. Preparar Dados para Envio/Adição ---
    const novaConta = {
        descricao: descricaoInput.value.trim(),
        valor: valorNum, // Usar o número já validado e limpo
        dataVencimento: vencimentoInput.value.trim(),
        categoria: categoriaSelect.value,
        subcategoria: subcategoriaSelect.disabled ? null : subcategoriaSelect.value, 
        fornecedor: fornecedorSelect.value,
        notaFiscal: notaFiscalInput.value.trim(),
        tipoPagamento: tipoPagamento,
        numeroParcelas: tipoPagamento === 'parcelado' ? numeroParcelas : null,
        observacao: observacaoTextarea ? observacaoTextarea.value.trim() : '',
        // status: 'pendente' // O backend deve definir o status inicial
    };

    console.log("Nova conta:", novaConta);

    // --- AQUI: Chamar a função para salvar no backend ---
    // Esta função DEVE existir (provavelmente no mesmo arquivo ou importada)
    // E ela deve, após salvar, chamar adicionarLinhaNaTabela e ordenarTabela
    if (typeof salvarContaNoBackend === 'function') {
        salvarContaNoBackend(novaConta); 
    } else {
        console.error("Função salvarContaNoBackend não definida!");
        alert("Erro: Função de salvar não encontrada.");
        // Apenas para teste local (REMOVER):
        // adicionarLinhaNaTabela(novaConta); // Simula adição
        // ordenarTabela();
        // document.getElementById('form-conta').reset();
        // atualizarSubcategorias();
    }
}

/**
 * Função placeholder para salvar a conta (AJUSTE NECESSÁRIO CONFORME SEU BACKEND)
 */
async function salvarContaNoBackend(conta) {
   console.log("Enviando conta para o backend:", conta);
   try {
        // AJUSTE a URL para a rota correta da sua API backend
        const response = await fetch('/api/contas', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(conta)
        });

        if (!response.ok) {
            let errorData;
            try {
                 errorData = await response.json(); // Tenta pegar erro do corpo JSON
            } catch(e) {
                 errorData = { message: `Erro HTTP ${response.status} - ${response.statusText}` }; // Erro genérico se não tiver corpo JSON
            }
            console.error('Erro do backend:', errorData);
            throw new Error(errorData.message || 'Erro desconhecido ao salvar conta');
        }

        const contaSalva = await response.json();
        console.log('Conta salva com sucesso:', contaSalva);

        // --- ATUALIZAR TABELA (se estiver na página de lançamento) ---
        // Adiciona a linha SOMENTE se a tabela existir nesta página
        if (document.getElementById('tabela-contas')) {
             adicionarLinhaNaTabela(contaSalva); 
             ordenarTabela(); 
        } else {
            console.log("Conta salva, mas nenhuma tabela encontrada para atualizar nesta página.");
        }


        alert('Conta lançada com sucesso!');
        
        // --- Limpar formulário APÓS sucesso ---
        const form = document.getElementById('form-conta');
        if (form) form.reset();
        atualizarSubcategorias(); // Resetar o select de subcategorias


    } catch (error) {
        console.error('Erro ao salvar conta:', error);
        alert('Falha ao salvar a conta: ' + error.message);
    }
}

/**
 * Adiciona uma nova linha na tabela de contas (se a tabela existir).
 */
function adicionarLinhaNaTabela(conta) {
    const tbody = document.getElementById('tabela-contas')?.getElementsByTagName('tbody')[0];
    if (!tbody) {
        console.warn("TBODY da tabela não encontrado para adicionar linha.");
        return;
    }

    const newRow = tbody.insertRow(); 

    // Formata a data (dd/mm/AAAA) - Garante que venha no formato certo ou converte
    let dataVencFormatada = conta.dataVencimento; 
    try {
        if (conta.dataVencimento && conta.dataVencimento.includes('T')) { // Verifica se é formato ISO
           const data = new Date(conta.dataVencimento);
           // getUTCDate etc., para evitar problemas de fuso horário se a data for UTC
           const dia = String(data.getUTCDate()).padStart(2, '0');
           const mes = String(data.getUTCMonth() + 1).padStart(2, '0'); 
           const ano = data.getUTCFullYear();
           dataVencFormatada = `${dia}/${mes}/${ano}`;
        } else if (conta.dataVencimento && /^\d{4}-\d{2}-\d{2}$/.test(conta.dataVencimento)) { // Formato YYYY-MM-DD
           const parts = conta.dataVencimento.split('-');
           dataVencFormatada = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        // Se já vier dd/mm/AAAA, não faz nada
    } catch(e) { 
        console.error("Erro ao formatar data vinda do backend:", conta.dataVencimento, e);
        // Deixa a data original em caso de erro
    }

    // Formata o valor como moeda BRL
    const valorFormatado = (conta.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Preenche as células (VERIFIQUE A ORDEM DAS COLUNAS NA SUA TABELA HTML!)
    // Adaptei baseado na estrutura provável do lctoContasAPagar.html e contasAPagar.html
    newRow.insertCell(0).textContent = conta.descricao || 'N/A';
    newRow.insertCell(1).textContent = valorFormatado; // Valor formatado
    newRow.insertCell(2).textContent = dataVencFormatada || 'N/A'; // Data formatada
    newRow.insertCell(3).textContent = conta.categoria || 'N/A'; 
    // A célula 4 (Status) provavelmente só existe na contasAPagar.html
    const statusCell = newRow.insertCell(4);
    statusCell.textContent = conta.status || 'pendente'; // Status (ou 'pago')
    
    // Célula de Ações (Adapte o índice se necessário)
    const cellAcoes = newRow.insertCell(5); 
    cellAcoes.classList.add('acoes'); // Para o CSS dos botões responsivos
    // Usar data-id para identificar a conta ao clicar nos botões
    const contaId = conta._id || conta.id || ''; // Pega o _id do MongoDB ou id
    cellAcoes.innerHTML = `
        <button class="btn btn-sm btn-info btn-editar" data-id="${contaId}" title="Editar">✏️</button> 
        <button class="btn btn-sm btn-danger btn-excluir" data-id="${contaId}" title="Excluir">🗑️</button>
        ${(conta.status !== 'pago') ? `<button class="btn btn-sm btn-success btn-pagar" data-id="${contaId}" title="Marcar como Pago">✔️</button>` : ''} 
    `;
    // Adicionei emojis e títulos para clareza, e botão Pagar condicional
}


/**
 * Gerencia cliques nos botões da tabela (Editar, Excluir, Pagar).
 */
function gerenciarBotosTabela(event) {
    const target = event.target.closest('button'); // Pega o botão clicado, mesmo que clique no ícone
    if (!target) return; // Sai se não clicou em um botão

    const contaId = target.dataset.id; // Pega o ID da conta do atributo data-id
    const linha = target.closest('tr'); // Pega a linha da tabela

    if (!contaId) {
        console.warn('Botão clicado não possui data-id.');
        // return; // Decide se para ou continua sem ID
    }

    if (target.classList.contains('btn-excluir')) {
        if (confirm(`Tem certeza que deseja excluir esta conta?\nID: ${contaId}`)) {
            console.log('Excluir conta ID:', contaId);
            // --- Chamar função para excluir no backend ---
            excluirContaNoBackend(contaId, linha); // Passa a linha para remover no sucesso
        }
    } else if (target.classList.contains('btn-editar')) {
        console.log('Editar conta ID:', contaId);
        // --- Lógica para abrir modal de edição ou redirecionar ---
        alert('Funcionalidade Editar não implementada.');
        // Ex: window.location.href = `/editarConta.html?id=${contaId}`;
        
    } else if (target.classList.contains('btn-pagar')) {
         if (confirm(`Marcar esta conta como paga?\nID: ${contaId}`)) {
            console.log('Pagar conta ID:', contaId);
            // --- Chamar função para marcar como paga no backend ---
            marcarContaComoPaga(contaId, linha, target); // Passa linha e botão
         }
    }
}


/**
 * [NOVO - Exemplo] Função para excluir conta no backend.
 */
async function excluirContaNoBackend(id, tableRow) {
    if (!id) return alert("Erro: ID da conta não encontrado para exclusão.");

    try {
        const response = await fetch(`/api/contas/${id}`, { method: 'DELETE' }); // Ajuste URL
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao excluir conta');
        }
        console.log('Conta excluída com sucesso:', id);
        if (tableRow) {
            tableRow.remove(); // Remove a linha da tabela SOMENTE após sucesso
        }
        alert('Conta excluída com sucesso!');
    } catch(error) {
        console.error('Erro ao excluir:', error);
        alert('Falha ao excluir conta: ' + error.message);
    }
}

/**
 * [NOVO - Exemplo] Função para marcar conta como paga no backend.
 */
async function marcarContaComoPaga(id, tableRow, button) {
     if (!id) return alert("Erro: ID da conta não encontrado para marcar como paga.");

     try {
        // Ajuste a URL e o método (PATCH ou PUT) conforme sua API
        const response = await fetch(`/api/contas/${id}/pagar`, { method: 'PATCH' }); 
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao marcar como paga');
        }
        const contaAtualizada = await response.json();
        console.log('Conta marcada como paga:', contaAtualizada);

        // Atualiza a interface
        if (tableRow) {
            const statusCell = tableRow.cells[4]; // Ajuste o índice da coluna Status
            if(statusCell) statusCell.textContent = 'pago'; 
        }
        if (button) {
            button.remove(); // Remove o botão "Pagar" após sucesso
        }
        alert('Conta marcada como paga!');

    } catch(error) {
        console.error('Erro ao marcar como paga:', error);
        alert('Falha ao marcar conta como paga: ' + error.message);
    }
}


/**
 * Converte data "dd/mm/AAAA" para objeto Date para comparação.
 */
function parseDate(dateStr) {
    try {
        // Trata strings vazias ou inválidas
        if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('/')) {
             return new Date(0); // Data inválida/muito antiga
        }
        const [day, month, year] = dateStr.split('/');
        // Cria a data em UTC para evitar problemas de fuso horário na ordenação
        const date = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10)));
        if (isNaN(date.getTime())) { // Verifica se a data resultante é válida
            return new Date(0);
        }
        return date;
    } catch (e) {
        console.error("Erro ao parsear data para ordenação:", dateStr, e);
        return new Date(0); // Retorna data inválida em caso de erro
    }
}


/**
 * Ordena as linhas da tabela pela data de vencimento (mais próxima primeiro).
 */
function ordenarTabela() {
    const tbody = document.getElementById('tabela-contas')?.getElementsByTagName('tbody')[0];
    if (!tbody) {
        // Não mostra warning se for a página de lançamento sem tabela ainda
        if (!document.body.contains(document.getElementById('form-conta'))) {
            console.warn("TBODY não encontrado para ordenação.");
        }
        return;
    }

    const rows = Array.from(tbody.querySelectorAll('tr'));

    rows.sort((a, b) => {
        // Assume que a data de vencimento está na 3ª célula (índice 2)
        const dateStrA = a.cells[2]?.textContent || ''; 
        const dateStrB = b.cells[2]?.textContent || '';

        const dateA = parseDate(dateStrA);
        const dateB = parseDate(dateStrB);

        // Compara as datas (A - B para ordem crescente)
        // Se A for inválida, vai para o final. Se B for inválida, vai para o final.
        if (dateA.getTime() === 0) return 1;
        if (dateB.getTime() === 0) return -1;
        
        return dateA - dateB;
    });

    // Re-adiciona as linhas ordenadas ao tbody
    rows.forEach(row => {
        tbody.appendChild(row); 
    });

    console.log("Tabela reordenada por vencimento.");
}


// NOTA: A função carregarContas() deve estar no arquivo script-contas-apagar.js
// pois ela é específica da página de listagem.
// Se precisar dela aqui, mova-a ou importe-a.