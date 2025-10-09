// Função para carregar e listar as contas
async function carregarContas() {
    try {
        const response = await fetch('http://localhost:3000/contas');
        const contas = await response.json();
        
        const lista = document.getElementById('lista-contas');
        lista.innerHTML = '';

        if (contas.length === 0) {
            lista.innerHTML = '<li>Nenhuma conta lançada.</li>';
            return;
        }

        contas.forEach(conta => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>
                    Descrição: ${conta.descricao} | 
                    Valor: R$ ${parseFloat(conta.valor).toFixed(2)} | 
                    Vencimento: ${conta.dataVencimento} | 
                    Status: <b style="color:${conta.status === 'paga' ? 'green' : 'red'}">${conta.status}</b>
                </span>
                ${conta.status === 'pendente' ? `<button onclick="darBaixa(${conta.id})">Dar Baixa</button>` : ''}
            `;
            lista.appendChild(li);
        });
    } catch (error) {
        console.error('Erro ao carregar contas:', error);
        document.getElementById('lista-contas').innerHTML = '<li>Erro ao carregar a lista de contas.</li>';
    }
}

// Função para dar baixa em uma conta
async function darBaixa(id) {
    try {
        const response = await fetch(`http://localhost:3000/contas/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            alert('Conta baixada com sucesso!');
            carregarContas(); // Recarrega a lista
        } else {
            alert('Erro ao dar baixa na conta.');
        }
    } catch (error) {
        console.error('Erro ao dar baixa:', error);
        alert('Não foi possível conectar ao servidor.');
    }
}

// Carrega a lista de contas ao abrir a página
carregarContas();