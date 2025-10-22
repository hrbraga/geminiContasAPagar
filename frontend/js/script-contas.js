// frontend/js/script-contas.js

// --- FUNÇÕES DE CARREGAMENTO INICIAL (Fornecedores, Categorias) ---
async function carregarFornecedores() {
    try {
        const response = await fetch('http://localhost:3000/fornecedores');
        if (!response.ok) throw new Error('Falha ao buscar fornecedores');
        const fornecedores = await response.json();
        const select = document.getElementById('fornecedor-select');
        if (!select) return;
        select.innerHTML = '<option value="">Selecione...</option>';
        fornecedores.forEach(fornecedor => {
            const option = document.createElement('option');
            option.value = fornecedor._id;
            option.textContent = fornecedor.nome;
            select.appendChild(option);
        });
    } catch (error) { console.error('Erro ao carregar fornecedores:', error); alert('Erro ao carregar fornecedores.'); }
}

async function carregarCategorias() {
    try {
        const response = await fetch('http://localhost:3000/categorias');
        if (!response.ok) throw new Error('Falha ao buscar categorias');
        const categorias = await response.json();
        const selectCategoria = document.getElementById('categoria-select');
        const selectSubcategoria = document.getElementById('subcategoria-select');
        if (!selectCategoria || !selectSubcategoria) return;

        selectCategoria.innerHTML = '<option value="">Selecione...</option>';
        selectSubcategoria.innerHTML = '<option value="">Selecione uma categoria...</option>';
        selectSubcategoria.disabled = true;

        categorias.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria._id;
            option.textContent = categoria.nome;
            selectCategoria.appendChild(option);
        });

        selectCategoria.addEventListener('change', (event) => {
            const categoriaId = event.target.value;
            selectSubcategoria.innerHTML = '<option value="">Selecione...</option>';
            selectSubcategoria.disabled = true;
            if (categoriaId) {
                const categoriaSelecionada = categorias.find(c => c._id == categoriaId);
                if (categoriaSelecionada?.subcategorias?.length > 0) {
                    selectSubcategoria.disabled = false;
                    categoriaSelecionada.subcategorias.forEach(sub => {
                        const option = document.createElement('option');
                        option.value = sub._id;
                        option.textContent = sub.nome;
                        selectSubcategoria.appendChild(option);
                    });
                } else { selectSubcategoria.innerHTML = '<option value="">Nenhuma subcategoria</option>'; }
            } else { selectSubcategoria.innerHTML = '<option value="">Selecione uma categoria...</option>'; }
        });
    } catch (error) { console.error('Erro ao carregar categorias:', error); alert('Erro ao carregar categorias.'); }
}

// --- CONTROLE DA INTERFACE DE PARCELAMENTO ---
const radioParcelaUnica = document.getElementById('parcela-unica');
const radioParcelaParcelada = document.getElementById('parcela-parcelada');
const divQuantidadeParcelas = document.getElementById('quantidade-parcelas-div');
const inputQuantidadeParcelas = document.getElementById('quantidade-parcelas');

if (radioParcelaUnica && radioParcelaParcelada && divQuantidadeParcelas) {
    radioParcelaUnica.addEventListener('change', () => { if (radioParcelaUnica.checked) divQuantidadeParcelas.style.display = 'none'; });
    radioParcelaParcelada.addEventListener('change', () => { if (radioParcelaParcelada.checked) { divQuantidadeParcelas.style.display = 'block'; inputQuantidadeParcelas?.focus(); } });
} else { console.warn("Elementos do controle de parcelamento não encontrados."); }

// --- FORMATAÇÃO DO CAMPO VALOR (APRIMORADA) ---
const valorInput = document.getElementById('valor');

function formatarMoeda(input) {
    let valor = input.value.replace(/\D/g, ''); // Remove tudo que não for dígito
    if (valor === '') {
        input.value = ''; // Permite apagar tudo
        return 0; // Retorna 0 se vazio
    }

    // Adiciona zeros à esquerda se necessário (para começar pelos centavos)
    valor = valor.padStart(3, '0'); // Garante pelo menos 3 dígitos (ex: 50 -> 050)

    // Separa centavos e reais
    let centavos = valor.slice(-2);
    let reais = valor.slice(0, -2);

    // Adiciona separador de milhar
    reais = reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // Monta o valor formatado
    input.value = `${reais},${centavos}`;

    // Retorna o valor numérico para validação/cálculo
    return parseFloat(`${reais}.${centavos}`);
}

if (valorInput) {
    valorInput.addEventListener('input', (e) => {
        formatarMoeda(e.target); // Formata enquanto digita
    });

    // Garante formatação correta ao sair do campo
    valorInput.addEventListener('blur', (e) => {
        const valorNumerico = formatarMoeda(e.target);
        // Se for zero ou inválido após limpar, deixa vazio ou "0,00"? Vamos deixar vazio.
        if (valorNumerico === 0) {
            e.target.value = '';
        }
    });
} else { console.error("Elemento #valor não encontrado!"); }


// --- FUNÇÃO DE ENVIO DO FORMULÁRIO (LANÇAMENTO) ---
const formContas = document.getElementById('form-contas');
if (formContas) {
    formContas.addEventListener('submit', async (event) => {
        event.preventDefault();
        console.log("Formulário submetido!");

        // --- Coleta de Dados ---
        console.log("Coletando dados...");
        const descricao = document.getElementById('descricao')?.value.trim();
        const dataEmissao = document.getElementById('data-emissao')?.value;
        const notaFiscal = document.getElementById('nota-fiscal')?.value.trim();
        const valorFormatado = document.getElementById('valor')?.value;
        const dataPrimeiroVencimento = document.getElementById('data-vencimento')?.value;
        const fornecedorId = document.getElementById('fornecedor-select')?.value;
        const categoriaId = document.getElementById('categoria-select')?.value;
        const subcategoriaId = document.getElementById('subcategoria-select')?.value || null;
        const tipoParcelamentoChecked = document.querySelector('input[name="tipoParcelamento"]:checked');
        const tipoParcelamento = tipoParcelamentoChecked?.value;
        let quantidadeParcelas = 1;
        if (tipoParcelamento === 'parcelada') {
            quantidadeParcelas = parseInt(document.getElementById('quantidade-parcelas')?.value || '1', 10);
        }

        // --- Validações ---
        console.log("Iniciando validações...");
        let missing = [];
        if (!descricao) missing.push("Descrição");
        if (!dataEmissao) missing.push("Data de Emissão");
        if (!valorFormatado) missing.push("Valor Total");
        if (!dataPrimeiroVencimento) missing.push("Vencimento (1ª Parcela)");
        if (!fornecedorId) missing.push("Fornecedor");
        if (!categoriaId) missing.push("Categoria");
        if (!tipoParcelamento) missing.push("Tipo de Parcelamento");

        // VALIDAÇÃO DATA EMISSÃO <= HOJE
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataEmissaoDate = new Date(dataEmissao + 'T00:00:00Z');
        if (!isNaN(dataEmissaoDate) && dataEmissaoDate > hoje) {
            missing.push("Data de Emissão (não pode ser futura)");
        } else if (isNaN(dataEmissaoDate) && dataEmissao) {
            missing.push("Data de Emissão (inválida)");
        }

        // VALIDAÇÃO VALOR > 0 (usando valor numérico obtido da formatação)
        // Crie esta função em algum lugar do seu script (fora de outras funções)
        function limparValor() {
            // Se 'valor' for o ID do seu campo de valor
            document.getElementById('valor').value = '';
        }
        // Precisamos chamar a formatação aqui para obter o número correto
        const valorNumerico = valorInput ? parseFloat(limparValor(valorFormatado || '0')) : NaN; // Limpa o valor formatado
        if (isNaN(valorNumerico) || valorNumerico <= 0) {
            missing.push("Valor Total (deve ser positivo)");
        }

        // Validação Data Vencimento
        const dataVencBase = new Date(dataPrimeiroVencimento + 'T00:00:00Z');
        if (isNaN(dataVencBase)) missing.push("Data do primeiro vencimento inválida");


        // Validação Quantidade Parcelas
        if (tipoParcelamento === 'parcelada' && (isNaN(quantidadeParcelas) || quantidadeParcelas < 2)) {
            missing.push("Quantidade de parcelas inválida (mínimo 2)");
        }

        // Exibe erros de validação
        if (missing.length > 0) {
            alert(`Campos inválidos ou faltando: ${missing.join(', ')}.`);
            console.error("Validação falhou:", missing);
            return;
        }
        console.log("Validações passaram.");

        // --- Preparação e Envio das Parcelas ---
        console.log("Preparando lançamentos...");
        const promessasDeLancamento = [];
        const valorTotal = valorNumerico; // Usa o valor numérico validado
        const valorTotalCentavos = Math.round(valorTotal * 100);
        const valorParcelaBaseCentavos = Math.floor(valorTotalCentavos / quantidadeParcelas);
        let somaCentavosCalculada = 0;

        for (let i = 1; i <= quantidadeParcelas; i++) {
            console.log(`Preparando parcela ${i}...`);
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
                if (dataVencimentoAtual.getUTCDate() < dataVencBase.getUTCDate() && dataVencimentoBase.getUTCMonth() !== (dataVencimentoAtual.getUTCMonth() + 1) % 12) {
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
                valor: valorDaParcelaAtual, // Envia como string X.XX
                dataVencimento: dataVencFormatada,
                parcela: `${i}/${quantidadeParcelas}`,
                fornecedorId: fornecedorId,
                categoriaId: categoriaId,
                subcategoriaId: subcategoriaId,
            };
            console.log(`Dados Parcela ${i}:`, contaParcela);

            promessasDeLancamento.push(
                fetch('http://localhost:3000/contas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contaParcela) })
            );
        }

        // --- Envio e Tratamento ---
        console.log("Enviando requisições...");
        try {
            document.body.style.cursor = 'wait';
            const respostas = await Promise.all(promessasDeLancamento);
            console.log("Respostas recebidas:", respostas);
            document.body.style.cursor = 'default';

            const falhas = respostas.filter(res => !res.ok);

            if (falhas.length === 0) {
                console.log("Todos os lançamentos OK."); // LOG 10: Sucesso
                alert(`Lançamento(s) realizado(s) com sucesso! (${quantidadeParcelas} conta(s))`);
                formContas.reset();
                // Resets explícitos
                if (radioParcelaUnica) radioParcelaUnica.checked = true;
                if (divQuantidadeParcelas) divQuantidadeParcelas.style.display = 'none';
                if (inputQuantidadeParcelas) inputQuantidadeParcelas.value = '2';
                const subSelect = document.getElementById('subcategoria-select');
                if (subSelect) { subSelect.innerHTML = '<option value="">Selecione...</option>'; subSelect.disabled = true; }
                if (categoriaSelect) categoriaSelect.value = "";
                if (fornecedorSelect) fornecedorSelect.value = "";
                if (valorInput) valorInput.value = "";

                // ***** CORREÇÃO: Garante que carregarContas() é chamado *****
                await carregarContas(); // Chama e ESPERA a tabela ser recarregada
                const formCont = document.getElementById('form-container');
                if (formCont) formCont.classList.remove('visivel'); // Fecha o painel DEPOIS de recarregar

            } else {
                console.error("Alguns lançamentos falharam."); // LOG 11: Erro parcial
                alert(`Erro: ${falhas.length} de ${quantidadeParcelas} lançamentos falharam. Verifique o console.`);
                // Log detalhado...
                for (let i = 0; i < respostas.length; i++) {
                    if (!respostas[i].ok) {
                        try { const errorData = await respostas[i].json(); console.error(`Falha parcela ${i + 1}: Status ${respostas[i].status}`, errorData); }
                        catch (jsonError) { console.error(`Falha parcela ${i + 1}: Status ${respostas[i].status}`, await respostas[i].text()); }
                    }
                }
            }
        } catch (error) {
            document.body.style.cursor = 'default';
            console.error('Erro de rede:', error); // LOG 12: Erro de rede
            alert('Erro de conexão ao lançar a(s) conta(s).');
        }
    });
} else { console.error("Formulário #form-contas não encontrado!"); }


// --- FUNÇÃO PARA CARREGAR CONTAS NA TABELA (COM BOTÃO EXCLUIR) ---
async function carregarContas() {
    console.log("Iniciando carregarContas()..."); // Log para verificar chamada
    try {
        const response = await fetch('http://localhost:3000/contas');
        if (!response.ok) throw new Error(`Falha ao buscar contas (${response.status})`);
        const contas = await response.json();
        const tbody = document.getElementById('lista-contas-tbody');
        if (!tbody) { console.error('Elemento #lista-contas-tbody não encontrado!'); return; }
        tbody.innerHTML = '';
        console.log(`${contas.length} contas recebidas.`); // Log quantidade

        if (contas.length === 0) {
            const tr = tbody.insertRow();
            const td = tr.insertCell();
            td.colSpan = 7; td.textContent = 'Nenhuma conta lançada.'; td.style.textAlign = 'center';
            return;
        }

        contas.forEach(conta => {
            const tr = tbody.insertRow();
            tr.setAttribute('data-conta-id-row', conta.id); // Adiciona ID na linha para referência futura

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

            // Célula de Ações
            const acoesCell = tr.insertCell();
            acoesCell.style.textAlign = 'center';

            // Botão Editar
            const btnEditar = document.createElement('button');
            btnEditar.innerHTML = '✏️'; // Emoji Lápis
            btnEditar.classList.add('btn-acao', 'btn-editar');
            btnEditar.title = "Editar Conta";
            btnEditar.onclick = () => editarConta(conta.id);
            acoesCell.appendChild(btnEditar);

            // Botão Excluir
            const btnExcluir = document.createElement('button');
            btnExcluir.innerHTML = '🗑️'; // Emoji Lixeira
            btnExcluir.classList.add('btn-acao', 'btn-excluir');
            btnExcluir.title = "Excluir Conta";
            btnExcluir.onclick = () => excluirConta(conta.id); // Chama a nova função
            acoesCell.appendChild(btnExcluir);

            // Botão Dar Baixa (se pendente)
            if (conta.status === 'pendente') {
                const btnBaixar = document.createElement('button');
                btnBaixar.innerHTML = '✔️'; // Emoji Check
                btnBaixar.classList.add('btn-acao', 'btn-baixar');
                btnBaixar.title = "Dar Baixa";
                btnBaixar.setAttribute('data-conta-id', conta.id);
                btnBaixar.onclick = () => darBaixa(conta.id);
                acoesCell.appendChild(btnBaixar);
            }
        });
        console.log("Tabela de contas atualizada."); // Log fim
    } catch (error) {
        console.error('Erro detalhado ao carregar contas:', error); // Log erro detalhado
        const tbody = document.getElementById('lista-contas-tbody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="color: red; text-align: center;">Erro ao carregar contas: ${error.message}.</td></tr>`;
    }
}


// --- FUNÇÃO PARA DAR BAIXA --- (sem alterações funcionais)
async function darBaixa(id) {
    if (!id || !confirm(`Dar baixa na conta ID ${id}?`)) return;
    console.log("Tentando dar baixa:", id);
    try {
        const response = await fetch(`http://localhost:3000/contas/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' } });
        if (response.ok) {
            alert('Conta baixada!');
            await carregarContas(); // Espera recarregar
        } else {
            const errorData = await response.json().catch(() => ({})); alert(`Erro: ${errorData.message || 'Falha ao dar baixa.'}`); console.error("Erro backend (baixa):", errorData);
        }
    } catch (error) { console.error('Erro de rede (baixa):', error); alert('Erro de conexão ao dar baixa.'); }
}

// --- FUNÇÃO PARA EDITAR CONTA (Placeholder) ---
function editarConta(id) {
    console.log("Editar conta ID:", id);
    alert(`Editar Conta (ID: ${id}) - Não implementado.`);
}

// --- NOVA FUNÇÃO PARA EXCLUIR CONTA ---
async function excluirConta(id) {
    if (!id) { console.error("ID inválido para excluir:", id); alert("Erro: ID inválido."); return; }
    // Confirmação mais enfática para exclusão
    if (!confirm(`ATENÇÃO!\n\nTem certeza que deseja EXCLUIR PERMANENTEMENTE a conta ID ${id}?`)) {
        return; // Cancela se o usuário não confirmar
    }

    console.log("Tentando excluir a conta ID:", id);
    try {
        document.body.style.cursor = 'wait'; // Indicador visual

        const response = await fetch(`http://localhost:3000/contas/${id}`, {
            method: 'DELETE', // Método HTTP DELETE
            headers: { 'Content-Type': 'application/json' }
        });

        document.body.style.cursor = 'default';

        if (response.ok || response.status === 204) { // 200 OK ou 204 No Content
            alert('Conta excluída com sucesso!');
            await carregarContas(); // Recarrega a tabela para remover a linha
        } else {
            const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido ao tentar excluir.' }));
            alert(`Erro ao excluir a conta: ${errorData.message}`);
            console.error("Erro do backend ao excluir:", errorData);
        }
    } catch (error) {
        document.body.style.cursor = 'default';
        console.error('Erro de rede ao excluir conta:', error);
        alert('Não foi possível conectar ao servidor para excluir a conta.');
    }
}


// --- CONTROLE DO PAINEL LATERAL --- (sem alterações)
const btnMostrarForm = document.getElementById('btn-mostrar-form');
const btnFecharForm = document.getElementById('btn-fechar-form');
const formContainer = document.getElementById('form-container');

if (btnMostrarForm && formContainer) {
    btnMostrarForm.addEventListener('click', () => { formContainer.classList.add('visivel'); });
}
if (btnFecharForm && formContainer) {
    btnFecharForm.addEventListener('click', () => { formContainer.classList.remove('visivel'); });
}

// --- CARREGAMENTO INICIAL ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM carregado, iniciando...");
    if (typeof carregarFornecedores === 'function') carregarFornecedores(); else console.error("Função carregarFornecedores não definida");
    if (typeof carregarCategorias === 'function') carregarCategorias(); else console.error("Função carregarCategorias não definida");
    if (typeof carregarContas === 'function') carregarContas(); else console.error("Função carregarContas não definida");
});