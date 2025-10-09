document.getElementById('form-categoria').addEventListener('submit', async (event) => {
    event.preventDefault();
    const nome = document.getElementById('nome-categoria').value;
    const response = await fetch('http://localhost:3000/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome })
    });
    if (response.ok) {
        alert('Categoria cadastrada com sucesso!');
        document.getElementById('nome-categoria').value = '';
        carregarCategorias();
    } else {
        alert('Erro ao cadastrar categoria.');
    }
});

document.getElementById('form-subcategoria').addEventListener('submit', async (event) => {
    event.preventDefault();
    const categoriaId = document.getElementById('categoria-select').value;
    const nome = document.getElementById('nome-subcategoria').value;
    const response = await fetch(`http://localhost:3000/categorias/${categoriaId}/subcategorias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome })
    });
    if (response.ok) {
        alert('Subcategoria cadastrada com sucesso!');
        document.getElementById('nome-subcategoria').value = '';
        carregarCategorias();
    } else {
        alert('Erro ao cadastrar subcategoria.');
    }
});

async function carregarCategorias() {
    const response = await fetch('http://localhost:3000/categorias');
    const categorias = await response.json();
    
    const listaHtml = document.getElementById('lista-categorias');
    const selectHtml = document.getElementById('categoria-select');
    listaHtml.innerHTML = '';
    selectHtml.innerHTML = '<option value="">Selecione...</option>';

    categorias.forEach(categoria => {
        // Popula o select para adicionar subcategorias
        const option = document.createElement('option');
        option.value = categoria.id;
        option.textContent = categoria.nome;
        selectHtml.appendChild(option);

        // Popula a lista de categorias
        const li = document.createElement('li');
        li.textContent = categoria.nome;
        
        if (categoria.subcategorias.length > 0) {
            const ulSub = document.createElement('ul');
            categoria.subcategorias.forEach(sub => {
                const liSub = document.createElement('li');
                liSub.textContent = sub.nome;
                ulSub.appendChild(liSub);
            });
            li.appendChild(ulSub);
        }
        listaHtml.appendChild(li);
    });
}

// Carrega as categorias ao carregar a página
carregarCategorias();