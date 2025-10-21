// frontend/js/script-contas.js

// --- FUNÇÕES DE CARREGAMENTO INICIAL ---

async function carregarFornecedores() {
    try {
        const response = await fetch('http://localhost:3000/fornecedores');
        if (!response.ok) throw new Error('Falha ao buscar fornecedores');
        const fornecedores = await response.json();
        const select = document.getElementById('fornecedor-select');
        select.innerHTML = '<option value="">Selecione...</option>';
        fornecedores.forEach(fornecedor => {
            const option = document.createElement('option');
            option.value = fornecedor.id;
            option.textContent = fornecedor.nome;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar fornecedores:', error);
        alert('Erro ao carregar fornecedores. Verifique o servidor.');
    }
}

async function carregarCategorias() {
    try {
        const response = await fetch('http://localhost:3000/categorias');
        if (!response.ok) throw new Error('Falha ao buscar categorias');
        const categorias = await response.json();
        const selectCategoria = document.getElementById('categoria-select');
        const selectSubcategoria = document.getElementById('subcategoria-select');

        selectCategoria.innerHTML = '<option value="">Selecione...</option>';
        selectSubcategoria.innerHTML = '<option value="">Selecione uma categoria...</option>';
        selectSubcategoria.disabled = true;

        categorias.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria.id;
            option.textContent = categoria.nome;
            selectCategoria.appendChild(option);
        });

        selectCategoria.addEventListener('change', (event) => {
            const categoriaId = event.target.value;
            selectSubcategoria.innerHTML = '<option value="">Selecione...</option>';
            selectSubcategoria.disabled = true;

            if (categoriaId) {
                const categoriaSelecionada = categorias.find(c => c.id == categoriaId);
                if (categoriaSelecionada?.subcategorias?.length > 0) {
                    selectSubcategoria.disabled = false;
                    categoriaSelecionada.subcategorias.forEach(sub => {
                        const option = document.createElement('option');
                        option.value = sub.id;
                        option.textContent = sub.nome;
                        selectSubcategoria.appendChild(option);
                    });
                } else {
                     selectSubcategoria.innerHTML = '<option value="">Nenhuma subcategoria</option>';
                }
            } else {
                 selectSubcategoria.innerHTML = '<option value="">Selecione uma categoria...</option>';
            }
        });
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        alert('Erro ao carregar categorias. Verifique o servidor.');
    }
}

// --- CONTROLE DA INTERFACE DE PARCELAMENTO ---
const radioParcelaUnica = document.getElementById('parcela-unica');
const radioParcelaParcelada = document.getElementById('parcela-parcelada');
const divQuantidadeParcelas = document.getElementById('quantidade-parcelas-div');
const inputQuantidadeParcelas = document.getElementById('quantidade-parcelas');

if (radioParcelaUnica && radioParcelaParcelada && divQuantidadeParcelas) {
    radioParcelaUnica.addEventListener('change', () => {
        if (radioParcelaUnica.checked) {
            divQuantidadeParcelas.style.display = 'none';
        }
    });

    radioParcelaParcelada.addEventListener('change', () => {
        if (radioParcelaParcelada.checked) {
            divQuantidadeParcelas.style.display = 'block';
             if (inputQuantidadeParcelas) inputQuantidadeParcelas.focus(); // Foca no campo
        }
    });
} else {
    console.error("Elementos do controle de parcelamento não encontrados!");
}


// --- FUNÇÃO DE ENVIO DO FORMULÁRIO (LANÇAMENTO) ---
document.getElementById('form-contas').addEventListener('submit', async (event) => {
    event.preventDefault();

    // --- Coleta de Dados ---
    const descricao = document.getElementById('descricao').value.trim();
    const dataEmissao = document.getElementById('data-emissao').value;
    const notaFiscal = document.getElementById('nota-fiscal').value.trim();
    const valorTotalStr = document.getElementById('valor').value;
    const dataPrimeiroVencimento = document.getElementById('data-vencimento').value;
    const fornecedorId = document.getElementById('fornecedor-select').value;
    const categoriaId = document.getElementById('categoria-select').value;
    const subcategoriaId = document.getElementById('subcategoria-select').value || null;

    const tipoParcelamento = document.querySelector('input[name="tipoParcelamento"]:checked')?.value; // O '?' evita erro se nada estiver selecionado
    let quantidadeParcelas = 1;
    if (tipoParcelamento === 'parcelada') {
        quantidadeParcelas = parseInt(inputQuantidadeParcelas?.value || '1', 10); // Pega valor ou 1 se inválido
    }

    // --- Validações ---
    if (!descricao || !valorTotalStr || !dataPrimeiroVencimento || !fornecedorId || !categoriaId || !dataEmissao || !tipoParcelamento) {
        alert('Por favor, preencha todos os campos obrigatórios (Descrição, Emissão, Valor, Vencimento, Fornecedor, Categoria, Parcelamento).');
        return;
    }
    const valorTotal = parseFloat(valorTotalStr);
    if (isNaN(valorTotal) || valorTotal <= 0) {
        alert('Por favor, insira um Valor Total numérico e estritamente maior que zero (Ex: 0.01).');
        document.getElementById('valor').focus();
        return;
    }
     if (tipoParcelamento === 'parcelada' && (isNaN(quantidadeParcelas) || quantidadeParcelas < 2)) {
        alert('Por favor, insira uma quantidade de parcelas válida (mínimo 2).');
         if(inputQuantidadeParcelas) inputQuantidadeParcelas.focus();
        return;
    }
     if (!dataPrimeiroVencimento) { // Validação redundante, mas segura
        alert('Por favor, selecione a data do primeiro vencimento.');
        return;
    }

    // --- Preparação dos Lançamentos ---
    const promessasDeLancamento = [];
    const valorParcelaBase = parseFloat((valorTotal / quantidadeParcelas).toFixed(2));
    let somaCalculada = 0; // Para ajustar a última parcela

    console.log(`Valor Total: ${valorTotal}, Qtde Parcelas: ${quantidadeParcelas}, Valor Base Parcela: ${valorParcelaBase}`);


    for (let i = 1; i <= quantidadeParcelas; i++) {
        let valorDaParcelaAtual = valorParcelaBase;
        // Na última parcela, ajusta o valor para que a soma bata exatamente
        if (i === quantidadeParcelas) {
             valorDaParcelaAtual = parseFloat((valorTotal - somaCalculada).toFixed(2));
             console.log(`Ajuste última parcela (${i}): ${valorDaParcelaAtual}`);
        } else {
            somaCalculada = parseFloat((somaCalculada + valorParcelaBase).toFixed(2)); // Acumula arredondado
        }

        // Calcular data de vencimento (adição de 30 dias pode ser imprecisa, melhor usar meses)
        const dataVencimentoBase = new Date(dataPrimeiroVencimento + 'T00:00:00Z'); // Usar Z para UTC e evitar fuso
        if(isNaN(dataVencimentoBase)) {
            alert('Data do primeiro vencimento inválida.'); return;
        }

        // Adiciona meses corretamente, mantendo o dia (com cuidado para meses diferentes)
        const dataVencimentoAtual = new Date(dataVencimentoBase);
        if (i > 1) {
             dataVencimentoAtual.setMonth(dataVencimentoBase.getMonth() + (i - 1));
            // Correção para dias que não existem no mês resultante (ex: 31 em fevereiro)
            if (dataVencimentoAtual.getDate() !== dataVencimentoBase.getDate()) {
                 dataVencimentoAtual.setDate(0); // Vai para o último dia do mês anterior ao alvo
            }
        }

        const ano = dataVencimentoAtual.getUTCFullYear();
        const mes = String(dataVencimentoAtual.getUTCMonth() + 1).padStart(2, '0');
        const dia = String(dataVencimentoAtual.getUTCDate()).padStart(2, '0');
        const dataVencFormatada = `${ano}-${mes}-${dia}`;

        const contaParcela = {
            descricao: descricao + (quantidadeParcelas > 1 ? ` (${i}/${quantidadeParcelas})` : ''),
            dataEmissao: dataEmissao,
            notaFiscal: notaFiscal || null, // Envia null se vazio
            valor: valorDaParcelaAtual.toFixed(2), // Envia sempre como string com 2 casas
            dataVencimento: dataVencFormatada,
            parcela: `${i}/${quantidadeParcelas}`,
            fornecedorId: fornecedorId,
            categoriaId: categoriaId,
            subcategoriaId: subcategoriaId,
        };

        console.log("Enviando Parcela:", contaParcela);


        promessasDeLancamento.push(
            fetch('http://localhost:3000/contas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contaParcela)
            })
        );
    }

    // --- Envio e Tratamento ---
    try {
        const respostas = await Promise.all(promessasDeLancamento);
        const todasOk = respostas.every(res => res.ok);

        if (todasOk) {
            alert(`Lançamento(s) realizado(s) com sucesso! (${quantidadeParcelas} conta(s) registrada(s))`);
            document.getElementById('form-contas').reset();
            // Reset explícito dos controles de parcelamento e subcategoria
            if(radioParcelaUnica) radioParcelaUnica.checked = true;
            if(divQuantidadeParcelas) divQuantidadeParcelas.style.display = 'none';
            const subSelect = document.getElementById('subcategoria-select');
            if (subSelect) {
                subSelect.innerHTML = '<option value="">Selecione uma categoria...</option>';
                subSelect.disabled = true;
            }

            carregarContas();
            const formCont = document.getElementById('form-container'); // Precisa re-selecionar aqui dentro?
             if (formCont) {
               formCont.classList.remove('visivel');
            }
        } else {
             alert('Erro: Um ou mais lançamentos de parcela falharam. Verifique o console.');
             for (let i=0; i < respostas.length; i++) {
                if (!respostas[i].ok) {
                    const errorData = await respostas[i].json().catch(() => ({}));
                    console.error(`Falha no lançamento da parcela ${i+1}: Status ${respostas[i].status}`, errorData);
                }
            }
        }
    } catch (error) {
        console.error('Erro de rede ao lançar contas:', error);
        alert('Não foi possível conectar ao servidor para lançar a(s) conta(s). Verifique a conexão e o servidor.');
    }
});


// --- FUNÇÃO PARA CARREGAR CONTAS NA TABELA ---
async function carregarContas() {
    try {
        const response = await fetch('http://localhost:3000/contas');
        if (!response.ok) throw new Error(`Falha ao buscar contas (${response.status})`);
        const contas = await response.json();
        const tbody = document.getElementById('lista-contas-tbody');
        if (!tbody) {
            console.error('Elemento #lista-contas-tbody não encontrado!'); return;
        }
        tbody.innerHTML = '';

        if (contas.length === 0) {
            const tr = tbody.insertRow();
            const td = tr.insertCell();
            td.colSpan = 7; // Ajustar colspan se adicionar mais colunas
            td.textContent = 'Nenhuma conta lançada ainda.';
            td.style.textAlign = 'center';
            return;
        }

        contas.forEach(conta => {
            const tr = tbody.insertRow();

            // Formatação de Data de Vencimento
            const dataVenc = new Date(conta.dataVencimento + 'T00:00:00Z'); // UTC
            const dataFormatada = !isNaN(dataVenc) ? dataVenc.toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Inválida';

            // Formatação de Valor
            const valorFormatado = parseFloat(conta.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            // Preenchimento das Células
            tr.insertCell().textContent = conta.fornecedorNome || 'N/D';
            tr.insertCell().textContent = conta.descricao;
            tr.insertCell().textContent = dataFormatada;
            tr.insertCell().textContent = conta.parcela || '-';
            const valorCell = tr.insertCell();
            valorCell.textContent = valorFormatado;
            valorCell.style.textAlign = 'right';

            // Situação
            const situacaoCell = tr.insertCell();
            const statusBadge = document.createElement('b');
            statusBadge.textContent = conta.status.charAt(0).toUpperCase() + conta.status.slice(1);
            statusBadge.classList.add(conta.status === 'paga' ? 'status-paga' : 'status-pendente');
            situacaoCell.appendChild(statusBadge);
            situacaoCell.style.textAlign = 'center';

            // Ações
            const acoesCell = tr.insertCell();
             acoesCell.style.textAlign = 'center';
            if (conta.status === 'pendente') {
                const button = document.createElement('button');
                button.textContent = 'Dar Baixa';
                button.classList.add('btn-baixa');
                button.setAttribute('data-conta-id', conta.id);
                button.onclick = () => darBaixa(conta.id); // Chama diretamente darBaixa
                acoesCell.appendChild(button);
            } else {
                acoesCell.textContent = 'Pago';
            }
        });
    } catch (error) {
        console.error('Erro ao carregar contas:', error);
        const tbody = document.getElementById('lista-contas-tbody');
         if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">Erro ao carregar contas: ${error.message}. Verifique o servidor.</td></tr>`;
        }
    }
}


// --- FUNÇÃO PARA DAR BAIXA ---
async function darBaixa(id) {
    if (!confirm(`Tem certeza que deseja marcar a conta ID ${id} como paga?`)) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/contas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            alert('Conta baixada com sucesso!');
            carregarContas();
        } else {
             const errorData = await response.json().catch(() => ({ message: 'Erro ao tentar dar baixa.' }));
             alert(`Erro ao dar baixa na conta: ${errorData.message}`);
             console.error("Erro do backend ao dar baixa:", errorData);
        }
    } catch (error) {
        console.error('Erro de rede ao dar baixa:', error);
        alert('Não foi possível conectar ao servidor para dar baixa na conta.');
    }
}

// --- CONTROLE DO PAINEL LATERAL ---
const btnMostrarForm = document.getElementById('btn-mostrar-form');
const btnFecharForm = document.getElementById('btn-fechar-form');
const formContainer = document.getElementById('form-container');

if (btnMostrarForm && formContainer) {
    btnMostrarForm.addEventListener('click', () => {
        formContainer.classList.add('visivel');
    });
}
if (btnFecharForm && formContainer) {
    btnFecharForm.addEventListener('click', () => {
        formContainer.classList.remove('visivel');
    });
}

// --- CARREGAMENTO INICIAL ---
document.addEventListener('DOMContentLoaded', () => {
    // Garante que as funções existam antes de chamar
    if (typeof carregarFornecedores === 'function') carregarFornecedores();
    if (typeof carregarCategorias === 'function') carregarCategorias();
    if (typeof carregarContas === 'function') carregarContas();
});