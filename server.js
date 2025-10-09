// server.js
const express = require('express');
const cors = require('cors'); // Importa o pacote CORS
const app = express();
const PORT = 3000;

// Configura o middleware para entender JSON no corpo das requisições
app.use(express.json());

// Configura o middleware CORS para permitir requisições do frontend
app.use(cors());

// --- Simulação de Banco de Dados em Memória ---
// Usamos arrays para armazenar os dados temporariamente.
// Eles serão resetados a cada reinício do servidor.
let fornecedores = [];
let contas = [];
let categorias = [];

// --- Rotas para Fornecedores ---
// Rota para listar todos os fornecedores
app.get('/fornecedores', (req, res) => {
    res.json(fornecedores);
});

// Rota para cadastrar um novo fornecedor
app.post('/fornecedores', (req, res) => {
    const novoFornecedor = req.body;
    // Adiciona um ID simples para este exemplo
    novoFornecedor.id = fornecedores.length + 1;
    fornecedores.push(novoFornecedor);
    res.status(201).json(novoFornecedor); // Status 201: Criado
});


// --- Rotas para Categorias e Subcategorias ---
// Rota para listar todas as categorias
app.get('/categorias', (req, res) => {
    res.json(categorias);
});

// Rota para cadastrar uma nova categoria
app.post('/categorias', (req, res) => {
    const novaCategoria = req.body;
    novaCategoria.id = categorias.length + 1;
    // Adiciona uma lista de subcategorias vazia por padrão
    novaCategoria.subcategorias = [];
    categorias.push(novaCategoria);
    res.status(201).json(novaCategoria);
});

// Rota para adicionar uma subcategoria a uma categoria existente
app.post('/categorias/:id/subcategorias', (req, res) => {
    const { id } = req.params;
    const { nome } = req.body;
    const categoria = categorias.find(c => c.id == id);

    if (categoria) {
        const novaSubcategoria = {
            id: categoria.subcategorias.length + 1,
            nome
        };
        categoria.subcategorias.push(novaSubcategoria);
        res.status(201).json(novaSubcategoria);
    } else {
        res.status(404).json({ message: 'Categoria não encontrada.' });
    }
});


// --- Rotas para Contas a Pagar ---
// Rota para listar todas as contas
app.get('/contas', (req, res) => {
    res.json(contas);
});

// Rota para lançar uma nova conta a pagar
app.post('/contas', (req, res) => {
    const novaConta = req.body;
    novaConta.id = contas.length + 1;
    novaConta.status = 'pendente'; // Status inicial
    contas.push(novaConta);
    res.status(201).json(novaConta);
});

// Rota para dar baixa em uma conta (marcar como paga)
app.put('/contas/:id', (req, res) => {
    const { id } = req.params;
    const conta = contas.find(c => c.id == id); // Usa '==' para comparar strings e números

    if (conta) {
        conta.status = 'paga';
        res.json(conta);
    } else {
        res.status(404).json({ message: 'Conta não encontrada.' });
    }
});


// --- Inicia o Servidor ---
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});