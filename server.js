// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose'); // Importa o Mongoose

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// --- Conexão com o MongoDB ---
// Substitua pela sua string de conexão:
// - Se instalou localmente: 'mongodb://localhost:27017/meuERPSimplesDB'
// - Se usar Atlas: Cole a string fornecida pelo Atlas (substitua <username>, <password>)
const MONGO_URI = 'mongodb+srv://hugbragadev:Cshugo*20@cluster0.llielm3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // <-- AJUSTE AQUI

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB conectado com sucesso!'))
    .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// --- Definição dos Schemas e Models ---

// Fornecedor
const fornecedorSchema = new mongoose.Schema({
    // O _id é gerado automaticamente pelo MongoDB
    nome: { type: String, required: true },
    cnpj: String, // Campos opcionais não precisam de 'required'
    contato: String
});
const Fornecedor = mongoose.model('Fornecedor', fornecedorSchema);

// Categoria (com Subcategorias aninhadas)
const subcategoriaSchema = new mongoose.Schema({
    // O _id será gerado para subcategorias também
    nome: { type: String, required: true }
});

const categoriaSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    subcategorias: [subcategoriaSchema] // Array de subdocumentos
});
const Categoria = mongoose.model('Categoria', categoriaSchema);

// Conta a Pagar
const contaSchema = new mongoose.Schema({
    descricao: { type: String, required: true },
    dataEmissao: { type: Date, required: true },
    notaFiscal: String,
    valor: { type: Number, required: true, min: 0.01 }, // Armazenado como número
    dataVencimento: { type: Date, required: true },
    parcela: { type: String, default: '1/1' },
    // Referências a outros Models usando ObjectId
    fornecedorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fornecedor', required: true },
    categoriaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria', required: true },
    subcategoriaId: { type: mongoose.Schema.Types.ObjectId }, // Pode não ter subcategoria definida
    status: { type: String, required: true, default: 'pendente', enum: ['pendente', 'paga'] }, // enum limita os valores possíveis
    // Adiciona timestamps automáticos (createdAt, updatedAt)
}, { timestamps: true });
const Conta = mongoose.model('Conta', contaSchema);


// --- ROTAS (Refatoradas para usar Mongoose) ---

// -- Fornecedores --
app.get('/fornecedores', async (req, res) => {
    try {
        const fornecedores = await Fornecedor.find().sort({ nome: 1 }); // Busca todos e ordena por nome
        res.json(fornecedores);
    } catch (err) {
        console.error("Erro ao buscar fornecedores:", err);
        res.status(500).json({ message: 'Erro interno ao buscar fornecedores.' });
    }
});

app.post('/fornecedores', async (req, res) => {
    try {
        const { nome, cnpj, contato } = req.body;
        if (!nome) {
            return res.status(400).json({ message: 'Nome do fornecedor é obrigatório.' });
        }
        const novoFornecedor = new Fornecedor({ nome, cnpj, contato });
        await novoFornecedor.save(); // Salva no banco de dados
        console.log("Fornecedor salvo:", novoFornecedor);
        res.status(201).json(novoFornecedor);
    } catch (err) {
        console.error("Erro ao salvar fornecedor:", err);
         // Verifica erro de validação do Mongoose
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: 'Dados inválidos.', errors: err.errors });
        }
        res.status(500).json({ message: 'Erro interno ao salvar fornecedor.' });
    }
});

// -- Categorias --
app.get('/categorias', async (req, res) => {
    try {
        const categorias = await Categoria.find().sort({ nome: 1 });
        res.json(categorias);
    } catch (err) {
        console.error("Erro ao buscar categorias:", err);
        res.status(500).json({ message: 'Erro interno ao buscar categorias.' });
    }
});

app.post('/categorias', async (req, res) => {
    try {
        const { nome } = req.body;
        if (!nome) {
            return res.status(400).json({ message: 'Nome da categoria é obrigatório.' });
        }
        const novaCategoria = new Categoria({ nome }); // Subcategorias começa vazio por padrão
        await novaCategoria.save();
        console.log("Categoria salva:", novaCategoria);
        res.status(201).json(novaCategoria);
    } catch (err) {
         console.error("Erro ao salvar categoria:", err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: 'Dados inválidos.', errors: err.errors });
        }
        res.status(500).json({ message: 'Erro interno ao salvar categoria.' });
    }
});

// Adicionar Subcategoria
app.post('/categorias/:id/subcategorias', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome } = req.body;

        if (!nome) {
            return res.status(400).json({ message: 'Nome da subcategoria é obrigatório.' });
        }
        // Encontra a categoria e adiciona a subcategoria ao array dela
        const categoria = await Categoria.findById(id);
        if (!categoria) {
             return res.status(404).json({ message: 'Categoria não encontrada.' });
        }

        const novaSubcategoria = { nome }; // O _id será gerado automaticamente
        categoria.subcategorias.push(novaSubcategoria);
        await categoria.save(); // Salva a categoria pai com a nova subcategoria

        // Encontra a subcategoria recém-adicionada para retornar (Mongoose adiciona _id)
        const subSalva = categoria.subcategorias[categoria.subcategorias.length - 1];

        console.log("Subcategoria adicionada:", subSalva, "para Categoria ID:", id);
        res.status(201).json(subSalva);

    } catch (err) {
        console.error("Erro ao adicionar subcategoria:", err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: 'Dados inválidos.', errors: err.errors });
        }
         if (err.name === 'CastError') { // ID inválido
             return res.status(400).json({ message: 'ID da categoria inválido.' });
         }
        res.status(500).json({ message: 'Erro interno ao adicionar subcategoria.' });
    }
});


// -- Contas a Pagar --
app.get('/contas', async (req, res) => {
    try {
        const contas = await Conta.find()
            .populate('fornecedorId', 'nome') // Busca o nome do fornecedor referenciado
            // .populate('categoriaId', 'nome') // Se precisar do nome da categoria
            .sort({ dataVencimento: 1, parcela: 1 }); // Ordena

        // Transforma o resultado para o formato esperado pelo frontend (com fornecedorNome)
        const resultado = contas.map(conta => ({
            _id: conta._id, // Renomeia _id para id se o frontend esperar 'id'
            id: conta._id, // Ou mantenha ambos se precisar
            descricao: conta.descricao,
            dataEmissao: conta.dataEmissao?.toISOString().split('T')[0], // Formata data
            notaFiscal: conta.notaFiscal,
            valor: conta.valor.toString(), // Converte para string como antes
            dataVencimento: conta.dataVencimento?.toISOString().split('T')[0], // Formata data
            parcela: conta.parcela,
            fornecedorNome: conta.fornecedorId ? conta.fornecedorId.nome : 'N/D', // Pega nome do populate
            // Adicione IDs se o frontend precisar para selects, etc.
            fornecedorId: conta.fornecedorId ? conta.fornecedorId._id : null,
            categoriaId: conta.categoriaId,
            subcategoriaId: conta.subcategoriaId,
            status: conta.status,
            createdAt: conta.createdAt, // Timestamps automáticos
            updatedAt: conta.updatedAt
        }));

        res.json(resultado);
    } catch (err) {
        console.error("Erro ao buscar contas:", err);
        res.status(500).json({ message: 'Erro interno ao buscar contas.' });
    }
});

app.post('/contas', async (req, res) => {
    try {
        const {
            descricao, dataEmissao, notaFiscal, valor, dataVencimento,
            parcela, fornecedorId, categoriaId, subcategoriaId
        } = req.body;

        // Validações básicas (devem ser mais robustas)
         if (!descricao || !valor || !dataVencimento || !fornecedorId || !categoriaId || !dataEmissao) {
             return res.status(400).json({ message: 'Campos obrigatórios faltando.' });
         }
         const valorNum = parseFloat(valor);
         if (isNaN(valorNum) || valorNum <= 0) {
             return res.status(400).json({ message: 'Valor inválido.' });
         }
         // TODO: Validar se fornecedorId e categoriaId existem no banco

        const novaConta = new Conta({
            descricao, dataEmissao, notaFiscal,
            valor: valorNum, // Salva como número
            dataVencimento, parcela, fornecedorId, categoriaId, subcategoriaId,
            status: 'pendente' // Status inicial definido no schema
        });
        await novaConta.save();
        console.log("Conta salva:", novaConta);
        res.status(201).json(novaConta);
    } catch (err) {
        console.error("Erro ao salvar conta:", err);
         if (err.name === 'ValidationError') {
            return res.status(400).json({ message: 'Dados inválidos ao salvar conta.', errors: err.errors });
        }
         if (err.name === 'CastError') {
             return res.status(400).json({ message: 'ID de Fornecedor ou Categoria inválido.' });
         }
        res.status(500).json({ message: 'Erro interno ao salvar conta.' });
    }
});

// Dar Baixa (Atualizar Status)
app.put('/contas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const contaAtualizada = await Conta.findByIdAndUpdate(
            id,
            { status: 'paga', updatedAt: new Date() }, // Atualiza status e timestamp
            { new: true } // Retorna o documento atualizado
        );

        if (!contaAtualizada) {
            return res.status(404).json({ message: 'Conta não encontrada.' });
        }

        // Verifica se já estava paga (opcional, pode ser feito antes de buscar)
        // if (contaAtualizada.status === 'paga' && contaAtualizada.updatedAt < new Date(Date.now() - 1000)) { // Verifica se já estava paga antes
        //     return res.status(400).json({ message: 'Esta conta já está paga.' });
        // }


        console.log("Conta baixada:", contaAtualizada);
        res.json(contaAtualizada);
    } catch (err) {
        console.error("Erro ao dar baixa na conta:", err);
         if (err.name === 'CastError') {
             return res.status(400).json({ message: 'ID da conta inválido.' });
         }
        res.status(500).json({ message: 'Erro interno ao dar baixa na conta.' });
    }
});

// Rota para EXCLUIR uma conta
app.delete('/contas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const contaExcluida = await Conta.findByIdAndDelete(id); // Encontra e deleta pelo ID

        if (!contaExcluida) {
            return res.status(404).json({ message: 'Conta não encontrada para exclusão.' });
        }

        console.log("Conta excluída:", contaExcluida);
        // Retorna um status 200 (OK) ou 204 (No Content) para sucesso sem corpo
        res.status(200).json({ message: 'Conta excluída com sucesso!', conta: contaExcluida });
        // ou res.status(204).send();

    } catch (err) {
        console.error("Erro ao excluir conta:", err);
        if (err.name === 'CastError') { // ID inválido
             return res.status(400).json({ message: 'ID da conta inválido.' });
         }
        res.status(500).json({ message: 'Erro interno ao excluir a conta.' });
    }
});

// --- Inicia o Servidor ---
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});