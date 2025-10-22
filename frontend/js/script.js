// Aguarda o DOM (estrutura HTML) carregar completamente
document.addEventListener('DOMContentLoaded', () => {
    // Log para confirmar que o script carregou (como no seu print)
    console.log("DOM carregado, iniciando...");

    // Adiciona o 'listener' ao formulário de conta
    document.getElementById('form-conta').addEventListener('submit', validarEAdicionarConta);

    // Adiciona listener para a tabela (para os botões de excluir/editar)
    document.getElementById('tabela-contas').addEventListener('click', gerenciarBotoes);

    // [NOVO] Adiciona listener para o select de Categoria
    // Isso é o que vai habilitar/desabilitar a sub-categoria
    document.getElementById('categoria').addEventListener('change', atualizarSubcategorias);

    // [NOVO] Chama a função uma vez no início para setar o estado inicial
    atualizarSubcategorias();

    // (Opcional) Se você tiver uma função para carregar contas do 'backend', chame-a aqui
    // carregarContas(); 
});


/**
 * [NOVO] Função que simula a lógica de Categoria -> Sub-categoria.
 * Adapte esta função com suas categorias reais.
 */
function atualizarSubcategorias() {
    const categoriaSelect = document.getElementById('categoria');
    const subcategoriaSelect = document.getElementById('subcategoria');
    const categoriaValor = categoriaSelect.value;

    // Dados de exemplo (você deve buscar isso do seu backend)
    const subcategoriasDB = {
        "moradia": [
            { value: "aluguel", text: "Aluguel" },
            { value: "luz", text: "Luz" },
            { value: "agua", text: "Água" }
        ],
        "lazer": [], // Lazer não tem sub-categoria
        "trabalho": [
            { value: "transporte", text: "Transporte" }
        ]
        // Adicione outras categorias...
    };

    // Limpa opções antigas
    subcategoriaSelect.innerHTML = '<option value="">Selecione...</option>';

    // Verifica se a categoria selecionada TEM sub-categorias
    if (categoriaValor && subcategoriasDB[categoriaValor] && subcategoriasDB[categoriaValor].length > 0) {
        
        // Habilita o select
        subcategoriaSelect.disabled = false;
        
        // Adiciona as novas opções
        subcategoriasDB[categoriaValor].forEach(sub => {
            const option = new Option(sub.text, sub.value); // (Texto, Valor)
            subcategoriaSelect.add(option);
        });

    } else {
        // Não tem sub-categorias. Limpa e desabilita.
        subcategoriaSelect.innerHTML = '<option value="">N/A</option>';
        subcategoriaSelect.disabled = true;
    }
}


/**
 * [ATUALIZADO] Função principal que primeiro valida e depois adiciona a conta
 */
function validarEAdicionarConta(event) {
    event.preventDefault(); // Impede o envio real do formulário
    console.log("Formulário submetido! Iniciando validações...");

    // --- 1. Coletar Elementos ---
    const descricaoInput = document.getElementById('descricao');
    const valorInput = document.getElementById('valor');
    const vencimentoInput = document.getElementById('vencimento');
    const categoriaSelect = document.getElementById('categoria');
    const subcategoriaSelect = document.getElementById('subcategoria');

    let erros = []; // Lista para armazenar mensagens de erro

    // --- 2. Realizar Validações ---

    // [NOVO] Validação do Valor Total (problema da imagem)
    // Limpa a string: remove "R$", espaços, e troca "," por "."
    const valorStr = valorInput.value.replace("R$", "").trim().replace(",", ".");
    const valorNum = parseFloat(valorStr);

    if (isNaN(valorNum) || valorNum <= 0) {
        erros.push("Valor Total (deve ser positivo e um número válido).");
    }

    // Validação da Descrição
    if (descricaoInput.value.trim() === "") {
        erros.push("O campo Descrição é obrigatório.");
    }
    
    // Validação da Categoria
    if (categoriaSelect.value === "") {
        erros.push("O campo Categoria é obrigatório.");
    }

    // [NOVO] Validação Condicional da Sub-categoria
    const subcategoriaHabilitada = !subcategoriaSelect.disabled;
    if (subcategoriaHabilitada && subcategoriaSelect.value === "") {
        erros.push("Para esta Categoria, a Sub-categoria é obrigatória.");
    }
    
    // Validação do Vencimento (simples, só para ver se não está vazio)
    if (vencimentoInput.value.trim() === "") {
        erros.push("O campo Vencimento é obrigatório.");
    }

    // --- 3. Mostrar Erros ou Continuar ---

    if (erros.length > 0) {
        // Se houver erros, mostra todos de uma vez e para a execução
        alert("Campos inválidos ou faltando:\n\n- " + erros.join("\n- "));
        return; // Para o script aqui
    }

    console.log("Validações OK. Lançando conta...");
    
    // --- 4. Se passou, adiciona na tabela ---
    const tbody = document.getElementById('tabela-contas').getElementsByTagName('tbody')[0];
    const newRow = tbody.insertRow();

    // Adiciona os dados nas células
    newRow.insertCell(0).textContent = descricaoInput.value;
    newRow.insertCell(1).textContent = `R$ ${valorNum.toFixed(2)}`;
    newRow.insertCell(2).textContent = vencimentoInput.value;
    newRow.insertCell(3).classList.add('acoes');
    newRow.cells[3].innerHTML = `
        <button class="btn-editar">Editar</button>
        <button class="btn-excluir">Excluir</button>
    `;

    // --- 5. Limpar o formulário ---
    // Isso resolve o erro "limparValor is not defined"
    document.getElementById('form-conta').reset();
    
    // [NOVO] Re-seta o campo de sub-categoria para o estado inicial
    atualizarSubcategorias();

    // --- 6. Ordenar a tabela ---
    // Chama a função de ordenação que criamos antes
    ordenarTabela();
}


/**
 * Função para gerenciar cliques nos botões de ação (excluir/editar)
 */
function gerenciarBotoes(event) {
    // Verifica se o clique foi em um botão com a classe 'btn-excluir'
    if (event.target.classList.contains('btn-excluir')) {
        const row = event.target.closest('tr'); // Pega a linha (tr) pai do botão
        row.remove();
    }

    if (event.target.classList.contains('btn-editar')) {
        // Lógica para editar
        alert('Funcionalidade "Editar" a ser implementada.');
    }
}


/**
 * Função para converter data do formato "dd/mm/AAAA" para um objeto Date
 * que o JavaScript possa comparar.
 */
function parseDate(dateStr) {
    // "21/10/2025" -> ["21", "10", "2025"]
    const [day, month, year] = dateStr.split('/');
    // Formato Date(Ano, Mês - 1, Dia) é o mais seguro contra fuso horários
    return new Date(year, month - 1, day);
}


/**
 * Função principal para ordenar a tabela pela data de vencimento
 * (da mais próxima para a mais distante).
 */
function ordenarTabela() {
    const tbody = document.getElementById('tabela-contas').getElementsByTagName('tbody')[0];
    const rows = Array.from(tbody.querySelectorAll('tr')); // Converte NodeList para Array

    rows.sort((a, b) => {
        // Pega o texto da célula de vencimento (assumindo que é a 3ª célula, índice 2)
        const dateStrA = a.cells[2].textContent;
        const dateStrB = b.cells[2].textContent;

        const dateA = parseDate(dateStrA);
        const dateB = parseDate(dateStrB);

        // Compara as datas (A - B = ordem crescente)
        return dateA - dateB;
    });

    // Re-adiciona as linhas ordenadas ao tbody
    // (O appendChild move o elemento se ele já existir, reordenando-o)
    rows.forEach(row => {
        tbody.appendChild(row);
    });
    
    console.log("Tabela reordenada por vencimento.");
}