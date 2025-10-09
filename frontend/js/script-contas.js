// Este script será responsável por preencher os selects e enviar o formulário

// Função para buscar e preencher os fornecedores
async function carregarFornecedores() {
    const response = await fetch('http://localhost:3000/fornecedores');
    const fornecedores = await response.json();
    const select = document.getElementById('fornecedor-select');
    select.innerHTML = '<option value="">Selecione...</option>';
    fornecedores.forEach(fornecedor => {
        const option = document.createElement('option');
        option.value = fornecedor.id; // Usamos o ID do fornecedor
        option.textContent = fornecedor.nome;
        select.appendChild(option);
    });
}

// Função para buscar e preencher categorias e subcategorias
async function carregarCategorias() {
    const response = await fetch('http://localhost:3000/categorias');
    const categorias = await response.json();
    const selectCategoria = document.getElementById('categoria-select');
    const selectSubcategoria = document.getElementById('subcategoria-select');
    
    selectCategoria.innerHTML = '<option value="">Selecione...</option>';
    selectSubcategoria.innerHTML = '<option value="">Selecione uma categoria primeiro...</option>';
    
    categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria.id;
        option.textContent = categoria.nome;
        selectCategoria.appendChild(option);
    });

    selectCategoria.addEventListener('change', (event) => {
        const categoriaId = event.target.value;
        const categoriaSelecionada = categorias.find(c => c.id == categoriaId);
        
        selectSubcategoria.innerHTML = '<option value="">Selecione...</option>';
        if (categoriaSelecionada && categoriaSelecionada.subcategorias) {
            categoriaSelecionada.subcategorias.forEach(sub => {
                const option = document.createElement('option');
                option.value = sub.id;
                option.textContent = sub.nome;
                selectSubcategoria.appendChild(option);
            });
        }
    });
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
        subcategoriaId: document.getElementById('subcategoria-select').value || null // Pode ser nulo
    };

    const response = await fetch('http://localhost:3000/contas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaConta)
    });

    if (response.ok) {
        alert('Conta lançada com sucesso!');
        document.getElementById('form-contas').reset();
        carregarContas();
    } else {
        alert('Erro ao lançar conta.');
    }
});

// Função para listar as contas a pagar
async function carregarContas() {
    const response = await fetch('http://localhost:3000/contas');
    const contas = await response.json();
    const lista = document.getElementById('lista-contas');
    lista.innerHTML = '';
    contas.forEach(conta => {
        const li = document.createElement('li');
        li.textContent = `Descrição: ${conta.descricao} | Valor: ${conta.valor} | Vencimento: ${conta.dataVencimento}`;
        lista.appendChild(li);
    });
}

// Carrega tudo ao abrir a página
carregarFornecedores();
carregarCategorias();
carregarContas();