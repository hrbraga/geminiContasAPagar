document.getElementById('form-fornecedor').addEventListener('submit', async (event) => {
    event.preventDefault(); // Impede o envio padrão do formulário

    const nome = document.getElementById('nome').value;
    const cnpj = document.getElementById('cnpj').value;
    const contato = document.getElementById('contato').value;

    const novoFornecedor = { nome, cnpj, contato };

    try {
        const response = await fetch('http://localhost:3000/fornecedores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(novoFornecedor)
        });

        if (response.ok) {
            alert('Fornecedor cadastrado com sucesso!');
            document.getElementById('form-fornecedor').reset(); // Limpa o formulário
            carregarFornecedores(); // Recarrega a lista
        } else {
            alert('Erro ao cadastrar fornecedor.');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Não foi possível conectar ao servidor.');
    }
});

async function carregarFornecedores() {
    try {
        const response = await fetch('http://localhost:3000/fornecedores');
        const fornecedores = await response.json();
        
        const lista = document.getElementById('lista-fornecedores');
        lista.innerHTML = ''; // Limpa a lista antes de preencher
        
        fornecedores.forEach(fornecedor => {
            const li = document.createElement('li');
            li.textContent = `${fornecedor.nome} - CNPJ: ${fornecedor.cnpj}`;
            lista.appendChild(li);
        });
    } catch (error) {
        console.error('Erro:', error);
        document.getElementById('lista-fornecedores').innerHTML = '<li>Não foi possível carregar a lista de fornecedores.</li>';
    }
}

// Carrega a lista de fornecedores ao abrir a página
carregarFornecedores();