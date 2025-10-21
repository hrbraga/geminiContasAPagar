// frontend/js/categorias.js

// --- Lógica de Cadastro de Categoria Principal ---
const formCategoria = document.getElementById('form-categoria');
if (formCategoria) {
    formCategoria.addEventListener('submit', async (event) => {
        event.preventDefault();
        const nomeInput = document.getElementById('nome-categoria');
        const nome = nomeInput?.value?.trim(); // Usa optional chaining e trim

        if (!nome) {
            alert('Por favor, insira o nome da categoria.');
            nomeInput?.focus(); // Foca no campo se ele existir
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/categorias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome })
            });

            if (response.ok) {
                alert('Categoria cadastrada com sucesso!');
                if (nomeInput) nomeInput.value = ''; // Limpa o input se existir
                carregarCategorias(); // Recarrega a lista e o select
            } else {
                 const errorData = await response.json().catch(() => ({}));
                alert(`Erro ao cadastrar categoria: ${errorData.message || response.statusText}`);
            }
        } catch (error) {
            console.error('Erro de rede ao cadastrar categoria:', error);
            alert('Não foi possível conectar ao servidor para cadastrar a categoria.');
        }
    });
}

// --- Lógica de Cadastro de Subcategoria (COM CORREÇÃO) ---
const formSubcategoria = document.getElementById('form-subcategoria');
if (formSubcategoria) {
    formSubcategoria.addEventListener('submit', async (event) => {
        event.preventDefault();
        const categoriaSelect = document.getElementById('categoria-select');
        const nomeSubInput = document.getElementById('nome-subcategoria');

        const categoriaId = categoriaSelect?.value; // Pega o _id da categoria selecionada
        const nomeSub = nomeSubInput?.value?.trim();

        // VALIDAÇÃO ADICIONADA AQUI
        if (!categoriaId) {
            alert('Selecione uma categoria principal válida!');
            categoriaSelect?.focus();
            return; // Impede o envio se nenhuma categoria foi selecionada
        }
        if (!nomeSub) {
            alert('Por favor, insira o nome da subcategoria.');
            nomeSubInput?.focus();
            return;
        }

        console.log('Tentando adicionar subcategoria:', nomeSub, 'para Categoria ID:', categoriaId); // Log para depuração

        try {
             // Garante que a URL está correta
            const response = await fetch(`http://localhost:3000/categorias/${categoriaId}/subcategorias`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: nomeSub }) // Envia apenas o nome
            });

            if (response.ok) {
                alert('Subcategoria cadastrada com sucesso!');
                 if (nomeSubInput) nomeSubInput.value = ''; // Limpa o input
                // Opcional: Resetar o select de categoria? Ou manter selecionado?
                // categoriaSelect.value = ''; // Descomente se quiser resetar
                carregarCategorias(); // Recarrega a lista principal para mostrar a nova subcategoria
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(`Erro ao cadastrar subcategoria: ${errorData.message || response.statusText}`);
                 console.error("Erro do backend ao add subcategoria:", errorData);
            }
        } catch (error) {
            console.error('Erro de rede ao cadastrar subcategoria:', error);
            alert('Não foi possível conectar ao servidor para cadastrar a subcategoria.');
        }
    });
}


// --- Função para Carregar Categorias e Subcategorias (COM _id) ---
async function carregarCategorias() {
    try {
        const response = await fetch('http://localhost:3000/categorias');
        if (!response.ok) throw new Error(`Falha ao buscar categorias (${response.status})`);
        const categorias = await response.json();

        const listaHtml = document.getElementById('lista-categorias');
        const selectHtml = document.getElementById('categoria-select');

        // Limpeza segura
        if (listaHtml) listaHtml.innerHTML = '';
        if (selectHtml) selectHtml.innerHTML = '<option value="">Selecione...</option>'; // Valor vazio para validação

        if (categorias.length === 0 && listaHtml) {
            listaHtml.innerHTML = '<li>Nenhuma categoria cadastrada.</li>';
        }

        categorias.forEach(categoria => {
            // Popula o select para adicionar subcategorias
            if (selectHtml) {
                const option = document.createElement('option');
                option.value = categoria._id; // <-- USA O _id DO MONGODB
                option.textContent = categoria.nome;
                selectHtml.appendChild(option);
            }

            // Popula a lista de exibição
            if (listaHtml) {
                const li = document.createElement('li');
                 // Estilo para diferenciar da lista de conteúdo (caso haja conflito de CSS)
                 li.style.backgroundColor = '#f9f9f9';
                 li.style.border = '1px solid #eee';
                 li.style.boxShadow = 'none';

                li.textContent = `${categoria.nome} (ID: ${categoria._id})`; // Mostra o ID para depuração

                if (categoria.subcategorias && categoria.subcategorias.length > 0) {
                    const ulSub = document.createElement('ul');
                     ulSub.style.marginLeft = '20px'; // Indentação
                    categoria.subcategorias.forEach(sub => {
                        const liSub = document.createElement('li');
                         // Estilo para diferenciar
                        liSub.style.backgroundColor = '#fff';
                        liSub.style.border = 'none';
                         liSub.style.marginTop = '5px';
                        liSub.textContent = `- ${sub.nome} (ID: ${sub._id})`; // Mostra o ID da subcategoria
                        ulSub.appendChild(liSub);
                    });
                    li.appendChild(ulSub);
                }
                listaHtml.appendChild(li);
            }
        });
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        const listaHtml = document.getElementById('lista-categorias');
         if(listaHtml) listaHtml.innerHTML = `<li style="color: red;">Erro ao carregar categorias: ${error.message}. Verifique o servidor.</li>`;
         // Poderia desabilitar o form de subcategoria aqui também
    }
}

// Carrega as categorias ao carregar a página
document.addEventListener('DOMContentLoaded', carregarCategorias);