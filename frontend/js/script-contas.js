// frontend/js/script-contas.js

// --- FUNÇÕES DE CARREGAMENTO INICIAL ---

async function carregarFornecedores() {
    try {
        const response = await fetch('http://localhost:3000/fornecedores');
        if (!response.ok) throw new Error('Falha ao buscar fornecedores');
        const fornecedores = await response.json();
        const select = document.getElementById('fornecedor-select');
        // Adiciona verificação se o select existe
        if (!select) {
            console.error('Elemento #fornecedor-select não encontrado!');
            return;
        }
        select.innerHTML = '<option value="">Selecione...</option>'; // Valor vazio para validação
        fornecedores.forEach(fornecedor => {
            const option = document.createElement('option');
            option.value = fornecedor._id; // <-- USA O _id DO MONGODB
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

        // Adiciona verificações se os selects existem
        if (!selectCategoria || !selectSubcategoria) {
            console.error('Elementos #categoria-select ou #subcategoria-select não encontrados!');
            return;
        }

        selectCategoria.innerHTML = '<option value="">Selecione...</option>'; // Valor vazio
        selectSubcategoria.innerHTML = '<option value="">Selecione uma categoria...</option>';
        selectSubcategoria.disabled = true;

        categorias.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria._id; // <-- USA O _id DO MONGODB
            option.textContent = categoria.nome;
            selectCategoria.appendChild(option);
        });

        // Evento para carregar subcategorias
        selectCategoria.addEventListener('change', (event) => {
            const categoriaId = event.target.value;
            selectSubcategoria.innerHTML = '<option value="">Selecione...</option>'; // Valor vazio
            selectSubcategoria.disabled = true;

            if (categoriaId) {
                const categoriaSelecionada = categorias.find(c => c._id == categoriaId);
                if (categoriaSelecionada?.subcategorias?.length > 0) {
                    selectSubcategoria.disabled = false;
                    categoriaSelecionada.subcategorias.forEach(sub => {
                        const option = document.createElement('option');
                        option.value = sub._id; // <-- USA O _id DA SUBCATEGORIA
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

// Garante que os elementos existem antes de adicionar listeners
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
    console.warn("Elementos do controle de parcelamento não encontrados no HTML. A funcionalidade pode não operar corretamente.");
}


// --- FUNÇÃO DE ENVIO DO FORMULÁRIO (LANÇAMENTO DE CONTAS) ---
const formContas = document.getElementById('form-contas');
if (formContas) {
    formContas.addEventListener('submit', async (event) => {
        event.preventDefault(); // Impede o envio padrão
        console.log("Formulário submetido!"); // LOG 1: Verificar se o evento dispara

        // --- Coleta de Dados ---
        console.log("Coletando dados..."); // LOG 2: Verificar coleta
        const descricaoInput = document.getElementById('descricao');
        const dataEmissaoInput = document.getElementById('data-emissao');
        const notaFiscalInput = document.getElementById('nota-fiscal');
        const valorInput = document.getElementById('valor');
        const dataVencimentoInput = document.getElementById('data-vencimento');
        const fornecedorSelect = document.getElementById('fornecedor-select');
        const categoriaSelect = document.getElementById('categoria-select');
        const subcategoriaSelect = document.getElementById('subcategoria-select');
        const tipoParcelamentoChecked = document.querySelector('input[name="tipoParcelamento"]:checked');
        const qtdeParcelasInput = document.getElementById('quantidade-parcelas');


        // Verifica se todos os elementos foram encontrados (defensivo)
        if (!descricaoInput || !dataEmissaoInput || !notaFiscalInput || !valorInput || !dataVencimentoInput ||
            !fornecedorSelect || !categoriaSelect || !subcategoriaSelect || !tipoParcelamentoChecked) {
             console.error("Um ou mais campos do formulário não foram encontrados. Verifique os IDs no HTML.");
             alert("Erro interno: Campos do formulário não encontrados.");
             return;
        }

        const descricao = descricaoInput.value.trim();
        const dataEmissao = dataEmissaoInput.value;
        const notaFiscal = notaFiscalInput.value.trim();
        const valorTotalStr = valorInput.value;
        const dataPrimeiroVencimento = dataVencimentoInput.value;
        const fornecedorId = fornecedorSelect.value;
        const categoriaId = categoriaSelect.value;
        const subcategoriaId = subcategoriaSelect.value || null;
        const tipoParcelamento = tipoParcelamentoChecked.value;

        let quantidadeParcelas = 1;
        if (tipoParcelamento === 'parcelada') {
            quantidadeParcelas = parseInt(qtdeParcelasInput?.value || '1', 10);
        }

        // --- Validações ---
        console.log("Iniciando validações..."); // LOG 3: Verificar validações
        let missing = [];
         if (!descricao) missing.push("Descrição");
         if (!dataEmissao) missing.push("Data de Emissão");
         if (!valorTotalStr) missing.push("Valor Total");
         if (!dataPrimeiroVencimento) missing.push("Vencimento (1ª Parcela)");
         if (!fornecedorId) missing.push("Fornecedor"); // Verifica se não é ""
         if (!categoriaId) missing.push("Categoria");   // Verifica se não é ""
         // tipoParcelamento já verificado na coleta
         if (missing.length > 0) {
            alert(`Campos obrigatórios faltando: ${missing.join(', ')}.`);
            console.error("Validação falhou: Campos obrigatórios", missing); // LOG 4: Erro de validação
            // Tentar focar no primeiro campo inválido
            if (!descricao) descricaoInput.focus();
            else if (!dataEmissao) dataEmissaoInput.focus();
            else if (!valorTotalStr) valorInput.focus();
            else if (!dataPrimeiroVencimento) dataVencimentoInput.focus();
            else if (!fornecedorId) fornecedorSelect.focus();
            else if (!categoriaId) categoriaSelect.focus();
            return; // Interrompe se a validação falhar
        }

        const valorTotal = parseFloat(valorTotalStr);
        if (isNaN(valorTotal) || valorTotal <= 0) {
            alert('O Valor Total deve ser um número positivo (maior que zero). Ex: 0.01');
             console.error("Validação falhou: Valor inválido", valorTotalStr); // LOG 4a
            valorInput.focus();
            return;
        }
        if (tipoParcelamento === 'parcelada' && (isNaN(quantidadeParcelas) || quantidadeParcelas < 2)) {
            alert('Para parcelamento, a quantidade de parcelas deve ser 2 ou mais.');
             console.error("Validação falhou: Quantidade de parcelas inválida", qtdeParcelasInput?.value); // LOG 4b
            qtdeParcelasInput?.focus();
            return;
        }
         const dataVencBase = new Date(dataPrimeiroVencimento + 'T00:00:00Z');
         if (isNaN(dataVencBase)) {
            alert('Data do primeiro vencimento inválida.');
             console.error("Validação falhou: Data de vencimento inválida", dataPrimeiroVencimento); // LOG 4c
            dataVencimentoInput.focus();
            return;
        }
        const dataEmissaoDate = new Date(dataEmissao + 'T00:00:00Z');
         if (isNaN(dataEmissaoDate)) {
             alert('Data de emissão inválida.');
             console.error("Validação falhou: Data de emissão inválida", dataEmissao); // LOG 4d
             dataEmissaoInput.focus();
            return;
        }
        console.log("Validações passaram."); // LOG 5: Fim das validações

        // --- Preparação dos Lançamentos ---
        console.log("Preparando lançamentos..."); // LOG 6: Início do loop
        const promessasDeLancamento = [];
        const valorTotalCentavos = Math.round(valorTotal * 100);
        const valorParcelaBaseCentavos = Math.floor(valorTotalCentavos / quantidadeParcelas);
        let somaCentavosCalculada = 0;

        for (let i = 1; i <= quantidadeParcelas; i++) {
             console.log(`Preparando parcela ${i}...`); // LOG 7: Dentro do loop
            let valorDaParcelaAtualCentavos;
            if (i === quantidadeParcelas) {
                 valorDaParcelaAtualCentavos = valorTotalCentavos - somaCentavosCalculada;
            } else {
                valorDaParcelaAtualCentavos = valorParcelaBaseCentavos;
                somaCentavosCalculada += valorParcelaBaseCentavos;
            }
            const valorDaParcelaAtual = (valorDaParcelaAtualCentavos / 100).toFixed(2);

            // Calcular data de vencimento
            const dataVencimentoAtual = new Date(dataVencBase);
            if (i > 1) {
                 dataVencimentoAtual.setUTCMonth(dataVencBase.getUTCMonth() + (i - 1));
                 // Correção do dia
                if (dataVencimentoAtual.getUTCDate() < dataVencBase.getUTCDate() && dataVencimentoBase.getUTCMonth() !== (dataVencimentoAtual.getUTCMonth() +1) % 12 ) {
                     dataVencimentoAtual.setUTCDate(0);
                }
            }
            const ano = dataVencimentoAtual.getUTCFullYear();
            const mes = String(dataVencimentoAtual.getUTCMonth() + 1).padStart(2, '0');
            const dia = String(dataVencimentoAtual.getUTCDate()).padStart(2, '0');
            const dataVencFormatada = `${ano}-${mes}-${dia}`;

            const contaParcela = {
                descricao: descricao + (quantidadeParcelas > 1 ? ` [${i}/${quantidadeParcelas}]` : ''),
                dataEmissao: dataEmissao,
                notaFiscal: notaFiscal || null,
                valor: valorDaParcelaAtual,
                dataVencimento: dataVencFormatada,
                parcela: `${i}/${quantidadeParcelas}`,
                fornecedorId: fornecedorId,
                categoriaId: categoriaId,
                subcategoriaId: subcategoriaId || null,
            };

            console.log(`Dados Parcela ${i}:`, contaParcela); // Log dos dados antes de enviar

            // Adiciona a promessa de fetch
            promessasDeLancamento.push(
                fetch('http://localhost:3000/contas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(contaParcela)
                })
            );
        }

        // --- Envio e Tratamento ---
        console.log("Enviando requisições..."); // LOG 8: Antes do Promise.all
        try {
            document.body.style.cursor = 'wait'; // Indicador de carregamento

            const respostas = await Promise.all(promessasDeLancamento);
            console.log("Respostas recebidas:", respostas); // LOG 9: Após Promise.all

             document.body.style.cursor = 'default'; // Remove indicador

            const falhas = respostas.filter(res => !res.ok);

            if (falhas.length === 0) {
                console.log("Todos os lançamentos OK."); // LOG 10: Sucesso
                alert(`Lançamento(s) realizado(s) com sucesso! (${quantidadeParcelas} conta(s) registrada(s))`);
                formContas.reset(); // Reseta o formulário
                // Reset explícito dos controles que o reset() pode não pegar bem
                if (radioParcelaUnica) radioParcelaUnica.checked = true;
                if (divQuantidadeParcelas) divQuantidadeParcelas.style.display = 'none';
                if (inputQuantidadeParcelas) inputQuantidadeParcelas.value = '2'; // Volta ao padrão
                const subSelect = document.getElementById('subcategoria-select');
                if (subSelect) {
                    subSelect.innerHTML = '<option value="">Selecione uma categoria...</option>';
                    subSelect.disabled = true;
                }
                // Garante que o select de categoria e fornecedor voltem para "Selecione..."
                if(categoriaSelect) categoriaSelect.value = "";
                if(fornecedorSelect) fornecedorSelect.value = "";

                carregarContas(); // Recarrega a tabela
                const formCont = document.getElementById('form-container');
                if (formCont) formCont.classList.remove('visivel'); // Fecha o painel

            } else {
                 console.error("Alguns lançamentos falharam."); // LOG 11: Erro parcial
                 alert(`Erro: ${falhas.length} de ${quantidadeParcelas} lançamentos falharam. Verifique o console para detalhes.`);
                 // Log detalhado dos erros
                 for (let i = 0; i < respostas.length; i++) {
                    if (!respostas[i].ok) {
                        try {
                            const errorData = await respostas[i].json();
                            console.error(`Falha no lançamento da parcela ${i + 1}: Status ${respostas[i].status}`, errorData);
                        } catch (jsonError) {
                            console.error(`Falha no lançamento da parcela ${i + 1}: Status ${respostas[i].status}`, await respostas[i].text());
                        }
                    }
                }
            }
        } catch (error) {
             document.body.style.cursor = 'default'; // Remove indicador em caso de erro de rede
            console.error('Erro de rede:', error); // LOG 12: Erro de rede
            alert('Erro de conexão ao tentar lançar a(s) conta(s). Verifique sua rede e o status do servidor.');
        }
    });
} else {
     console.error("Formulário #form-contas não encontrado no HTML!"); // LOG IMPORTANTE
}


// --- FUNÇÃO PARA CARREGAR CONTAS NA TABELA --- (sem alterações desde a última versão)
async function carregarContas() {
    try {
        const response = await fetch('http://localhost:3000/contas');
        if (!response.ok) throw new Error(`Falha ao buscar contas (${response.status})`);
        const contas = await response.json(); // Contém fornecedorNome e _id como 'id'
        const tbody = document.getElementById('lista-contas-tbody');
        if (!tbody) { console.error('Elemento #lista-contas-tbody não encontrado!'); return; }
        tbody.innerHTML = '';

        if (contas.length === 0) {
            const tr = tbody.insertRow();
            const td = tr.insertCell();
            td.colSpan = 7; // Ajustar se o número de colunas mudar
            td.textContent = 'Nenhuma conta lançada ainda.';
            td.style.textAlign = 'center';
            return;
        }

        contas.forEach(conta => {
            const tr = tbody.insertRow();

            const dataVenc = new Date(conta.dataVencimento + 'T00:00:00Z');
            const dataFormatada = !isNaN(dataVenc) ? dataVenc.toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Inválida';

            const valorNum = parseFloat(conta.valor);
            const valorFormatado = !isNaN(valorNum) ? valorNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Inválido';

            tr.insertCell().textContent = conta.fornecedorNome || 'N/D';
            tr.insertCell().textContent = conta.descricao;
            tr.insertCell().textContent = dataFormatada;
            tr.insertCell().textContent = conta.parcela || '-';
            const valorCell = tr.insertCell();
            valorCell.textContent = valorFormatado;
            valorCell.style.textAlign = 'right';

            const situacaoCell = tr.insertCell();
            const statusBadge = document.createElement('b');
            statusBadge.textContent = conta.status.charAt(0).toUpperCase() + conta.status.slice(1);
            statusBadge.classList.add(conta.status === 'paga' ? 'status-paga' : 'status-pendente');
            situacaoCell.appendChild(statusBadge);
            situacaoCell.style.textAlign = 'center';

            const acoesCell = tr.insertCell();
             acoesCell.style.textAlign = 'center';
            if (conta.status === 'pendente') {
                const button = document.createElement('button');
                button.textContent = 'Dar Baixa';
                button.classList.add('btn-baixa');
                button.setAttribute('data-conta-id', conta.id);
                button.onclick = () => darBaixa(conta.id);
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


// --- FUNÇÃO PARA DAR BAIXA EM UMA CONTA --- (sem alterações desde a última versão)
async function darBaixa(id) {
    if (!id) {
         console.error("ID inválido para dar baixa:", id);
         alert("Erro: ID da conta inválido para dar baixa.");
         return;
    }
    if (!confirm(`Tem certeza que deseja marcar esta conta (ID: ${id}) como paga?`)) {
        return;
    }

    console.log("Tentando dar baixa na conta ID:", id);

    try {
        const response = await fetch(`http://localhost:3000/contas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            alert('Conta baixada com sucesso!');
            carregarContas();
        } else {
             const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido ao tentar dar baixa.' }));
             alert(`Erro ao dar baixa na conta: ${errorData.message}`);
             console.error("Erro do backend ao dar baixa:", errorData);
        }
    } catch (error) {
        console.error('Erro de rede ao dar baixa na conta:', error);
        alert('Não foi possível conectar ao servidor para dar baixa na conta.');
    }
}

// --- CONTROLE DO PAINEL LATERAL (Formulário) --- (sem alterações)
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

// --- CARREGAMENTO INICIAL --- (sem alterações)
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM carregado, iniciando carregamento de dados...");
    if (typeof carregarFornecedores === 'function') carregarFornecedores();
    if (typeof carregarCategorias === 'function') carregarCategorias();
    if (typeof carregarContas === 'function') carregarContas();
});