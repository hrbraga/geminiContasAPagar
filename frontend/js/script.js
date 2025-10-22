// Variáveis globais (se necessário, mas cuidado com conflitos)
// Exemplo: const apiUrl = 'http://localhost:3000/api'; 
// As constantes dos radios estavam causando o erro por serem redeclaradas
// Mova essas constantes para dentro da função que as utiliza se possível,
// ou garanta que o script seja carregado apenas uma vez.

// Aguarda o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM carregado, iniciando...");

    // Tenta encontrar o formulário e adicionar o listener
    const formConta = document.getElementById('form-conta');
    if (formConta) {
        formConta.addEventListener('submit', validarEAdicionarConta);
    } else {
        console.warn("Elemento 'form-conta' não encontrado.");
    }

    // Tenta encontrar a tabela e adicionar o listener
    const tabelaContas = document.getElementById('tabela-contas');
    if (tabelaContas) {
        tabelaContas.addEventListener('click', gerenciarBotosTabela); // Renomeei para evitar conflito
    } else {
        console.warn("Elemento 'tabela-contas' não encontrado.");
    }

    // Tenta encontrar o select de categoria e adicionar o listener
    const categoriaSelect = document.getElementById('categoria');
    if (categoriaSelect) {
        categoriaSelect.addEventListener('change', atualizarSubcategorias);
        atualizarSubcategorias(); // Chama no início
    } else {
        console.warn("Elemento 'categoria' não encontrado.");
    }
    
    // Tenta carregar contas (se a função existir e estiver na página correta)
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
    
    // Verifica se os elementos existem antes de prosseguir
    if (!categoriaSelect || !subcategoriaSelect) {
        console.warn("Selects de categoria/subcategoria não encontrados em atualizarSubcategorias.");
        return;
    }

    const categoriaValor = categoriaSelect.value;

    // Dados de exemplo (substitua pelo fetch do seu backend)
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

    // Verifica se a categoria selecionada TEM sub-categorias válidas
    if (categoriaValor && subcategoriasDB[categoriaValor] && subcategoriasDB[categoriaValor].length > 0) {
        subcategoriaSelect.disabled = false;
        subcategoriasDB[categoriaValor].forEach(sub => {
            const option = new Option(sub.text, sub.value);
            subcategoriaSelect.add(option);
        });
    } else {
        // Se não tem sub-categorias, desabilita e muda o texto
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
    const valorInput = document.getElementById('valor-total'); // Corrigido ID
    const vencimentoInput = document.getElementById('data-vencimento'); // Corrigido ID
    const categoriaSelect = document.getElementById('categoria');
    const subcategoriaSelect = document.getElementById('subcategoria');
    const fornecedorSelect = document.getElementById('fornecedor'); // Adicionado
    const notaFiscalInput = document.getElementById('nota-fiscal'); // Adicionado
    // Adicione outros campos que você tem no form...

    let erros = [];

    // --- 2. Realizar Validações ---

    // [VALIDAÇÃO VALOR TOTAL]
    const valorStr = valorInput.value.replace("R$", "").trim().replace(",", ".");
    const valorNum = parseFloat(valorStr);
    if (isNaN(valorNum) || valorNum <= 0) {
        erros.push("Valor Total deve ser um número positivo.");
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
    // É obrigatória SE categoria foi selecionada E está habilitada E não tem valor selecionado
    if (categoriaSelect.value && subcategoriaHabilitada && (!subcategoriaSelect.value || subcategoriaSelect.value === "")) {
        erros.push("Para esta Categoria, a Sub-categoria é obrigatória.");
    }
    
    // [VALIDAÇÃO FORNECEDOR] (Exemplo, ajuste se necessário)
    if (!fornecedorSelect.value || fornecedorSelect.value === "") {
         erros.push("O campo Fornecedor é obrigatório.");
    }
    
    // Adicione outras validações...

    // --- 3. Mostrar Erros ou Continuar ---
    if (erros.length > 0) {
        alert("Campos inválidos ou faltando:\n\n- " + erros.join("\n- "));
        // Foca no primeiro campo com erro (opcional)
        if (erros.some(e => e.includes("Valor"))) valorInput.focus();
        else if (erros.some(e => e.includes("Descrição"))) descricaoInput.focus();
        else if (erros.some(e => e.includes("Vencimento"))) vencimentoInput.focus();
        else if (erros.some(e => e.includes("Categoria"))) categoriaSelect.focus();
        else if (erros.some(e => e.includes("Sub-categoria"))) subcategoriaSelect.focus();
        else if (erros.some(e => e.includes("Fornecedor"))) fornecedorSelect.focus();
        
        return; // Para a execução aqui
    }

    console.log("Validações OK. Preparando dados para salvar...");

    // --- 4. Preparar Dados para Envio/Adição ---
    const novaConta = {
        descricao: descricaoInput.value.trim(),
        valor: valorNum, // Usar o número já validado
        dataVencimento: vencimentoInput.value.trim(),
        categoria: categoriaSelect.value,
        subcategoria: subcategoriaSelect.disabled ? null : subcategoriaSelect.value, // Envia null se desabilitado
        fornecedor: fornecedorSelect.value,
        notaFiscal: notaFiscalInput.value.trim(),
        // Pegar valor de tipoPagamento (única ou parcelada)
        // Pegar valor de numeroParcelas se parcelada
        // Pegar valor de observacao
        // status: 'pendente' // Definir status inicial?
    };

    console.log("Nova conta:", novaConta);

    // --- AQUI: Chamar a função para salvar no backend ---
    salvarContaNoBackend(novaConta); // Você precisará criar/ajustar esta função

    // --- 5. Limpar o formulário ---
    document.getElementById('form-conta').reset();
    atualizarSubcategorias(); // Resetar o select de subcategorias

    // --- 6. Ordenar a tabela (APÓS adicionar a nova linha vinda do backend ou manualmente) ---
    // A ordenação deve ser chamada DEPOIS que a nova linha for adicionada à tabela.
    // Se 'salvarContaNoBackend' atualiza a tabela, a ordenação pode ficar lá dentro no final.
    // Se você adiciona manualmente aqui (como no exemplo anterior), coloque a ordenação depois.
    // Exemplo de adição manual (REMOVA SE O BACKEND ATUALIZAR A TABELA):
    // adicionarLinhaNaTabela(novaConta); // Função hipotética para adicionar a linha
    // ordenarTabela(); 
}

/**
 * Função placeholder para salvar a conta (AJUSTE NECESSÁRIO)
 */
async function salvarContaNoBackend(conta) {
   try {
        const response = await fetch('/api/contas', { // Ajuste a URL da sua API
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(conta)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao salvar conta');
        }

        const contaSalva = await response.json();
        console.log('Conta salva com sucesso:', contaSalva);

        // --- ATUALIZAR TABELA ---
        // Se a resposta do backend for a conta salva, adicione-a à tabela
        adicionarLinhaNaTabela(contaSalva); // Você precisa criar esta função
        ordenarTabela(); // Ordena DEPOIS de adicionar

        alert('Conta lançada com sucesso!');

    } catch (error) {
        console.error('Erro ao salvar conta:', error);
        alert('Falha ao salvar a conta: ' + error.message);
    }
}

/**
 * [NOVO - Exemplo] Adiciona uma nova linha na tabela de contas.
 * Adapte os campos conforme a estrutura da sua tabela e os dados da conta.
 */
function adicionarLinhaNaTabela(conta) {
    const tbody = document.getElementById('tabela-contas')?.getElementsByTagName('tbody')[0];
    if (!tbody) {
        console.error("TBODY da tabela não encontrado para adicionar linha.");
        return;
    }

    const newRow = tbody.insertRow(); // Adiciona no final por padrão

    // Formata a data (se vier diferente de dd/mm/AAAA do backend)
    let dataVencFormatada = conta.dataVencimento; 
    // Exemplo: se vier como ISO string '2025-10-21T00:00:00.000Z'
    try {
        if (conta.dataVencimento.includes('T')) {
           const data = new Date(conta.dataVencimento);
           const dia = String(data.getDate()).padStart(2, '0');
           const mes = String(data.getMonth() + 1).padStart(2, '0'); // Mês é 0-indexado
           const ano = data.getFullYear();
           dataVencFormatada = `${dia}/${mes}/${ano}`;
        }
    } catch(e) { /* Ignora erro de formatação se já estiver ok */ }

    // Preenche as células (adapte os índices 0, 1, 2... conforme sua tabela)
    newRow.insertCell(0).textContent = conta.descricao;
    newRow.insertCell(1).textContent = `R$ ${conta.valor.toFixed(2)}`;
    newRow.insertCell(2).textContent = dataVencFormatada; 
    newRow.insertCell(3).textContent = conta.categoria; // Exemplo
    newRow.insertCell(4).textContent = conta.status || 'pendente'; // Exemplo
    
    // Célula de Ações
    const cellAcoes = newRow.insertCell(5); // Adapte o índice
    cellAcoes.classList.add('acoes');
    cellAcoes.innerHTML = `
        <button class="btn btn-sm btn-info btn-editar" data-id="${conta._id || ''}">Editar</button> 
        <button class="btn btn-sm btn-danger btn-excluir" data-id="${conta._id || ''}">Excluir</button>
        <button class="btn btn-sm btn-success btn-pagar" data-id="${conta._id || ''}">Pagar</button> 
    `;
    
    // Adicione um atributo data-id nos botões se você precisar identificar a conta
}


/**
 * Gerencia cliques nos botões da tabela (Editar, Excluir, Pagar).
 */
function gerenciarBotosTabela(event) {
    const target = event.target;
    const contaId = target.dataset.id; // Pega o ID da conta do botão (se você adicionou data-id)

    if (target.classList.contains('btn-excluir')) {
        if (confirm('Tem certeza que deseja excluir esta conta?')) {
            console.log('Excluir conta ID:', contaId);
            // --- Chamar função para excluir no backend ---
            // excluirContaNoBackend(contaId); 
            
            // Remove a linha da tabela (APÓS sucesso no backend)
             target.closest('tr').remove();
        }
    } else if (target.classList.contains('btn-editar')) {
        console.log('Editar conta ID:', contaId);
        // --- Lógica para abrir modal de edição ou redirecionar ---
        // abrirModalEdicao(contaId);
        alert('Funcionalidade Editar não implementada.');
        
    } else if (target.classList.contains('btn-pagar')) {
         console.log('Pagar conta ID:', contaId);
        // --- Chamar função para marcar como paga no backend ---
        // marcarContaComoPaga(contaId);
        
        // Atualiza o status na tabela (APÓS sucesso no backend)
        const linha = target.closest('tr');
        const statusCell = linha.cells[4]; // Ajuste o índice da coluna Status
        if(statusCell) statusCell.textContent = 'pago'; 
        target.disabled = true; // Desabilita o botão Pagar
        alert('Funcionalidade Pagar não implementada (backend).');
    }
}


/**
 * Converte data "dd/mm/AAAA" para objeto Date para comparação.
 */
function parseDate(dateStr) {
    try {
        const [day, month, year] = dateStr.split('/');
        // Usar new Date(Ano, Mês - 1, Dia) é mais seguro
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    } catch (e) {
        console.error("Erro ao parsear data:", dateStr, e);
        return new Date(0); // Retorna uma data inválida/muito antiga em caso de erro
    }
}


/**
 * Ordena as linhas da tabela pela data de vencimento (mais próxima primeiro).
 */
function ordenarTabela() {
    const tbody = document.getElementById('tabela-contas')?.getElementsByTagName('tbody')[0];
    if (!tbody) {
        console.warn("TBODY não encontrado para ordenação.");
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
        return dateA - dateB;
    });

    // Re-adiciona as linhas ordenadas ao tbody
    rows.forEach(row => {
        tbody.appendChild(row); // appendChild move a linha se ela já existe
    });

    console.log("Tabela reordenada por vencimento.");
}


// --- Funções Relacionadas à Página de Listagem (contasAPagar.html) ---
// (Mova para script-contas-apagar.js se preferir separar)

/**
 * Carrega as contas da API e popula a tabela.
 */
async function carregarContas() {
   console.log("Tentando carregar contas da API...");
   try {
        const response = await fetch('/api/contas'); // Ajuste a URL se necessário
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        const contas = await response.json();
        console.log(`${contas.length} contas recebidas.`);

        const tbody = document.getElementById('tabela-contas')?.getElementsByTagName('tbody')[0];
        if (!tbody) {
             console.error("TBODY da tabela não encontrado em carregarContas.");
             return;
        }
        
        tbody.innerHTML = ''; // Limpa a tabela antes de adicionar

        contas.forEach(conta => {
            adicionarLinhaNaTabela(conta); // Reutiliza a função de adicionar linha
        });

        ordenarTabela(); // Ordena após carregar todas
        console.log("Tabela de contas atualizada.");

    } catch (error) {
        console.error('Erro ao carregar contas:', error);
        alert('Não foi possível carregar as contas.');
    }
}

async function excluirContaNoBackend(id) {
    try {
        const response = await fetch(`/api/contas/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            throw new Error('Erro ao excluir conta');
        }
        console.log('Conta excluída:', id);
        // A linha já é removida em gerenciarBotosTabela
    } catch(error) {
        console.error('Erro ao excluir:', error);
        alert('Falha ao excluir conta.');
        // Se deu erro, talvez recarregar a tabela seja uma opção
        // carregarContas(); 
    }
}
