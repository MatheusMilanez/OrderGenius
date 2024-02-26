//app.js
const express = require('express');
const app = express();
const PORT = 3000;

//QrCode
const qr = require('qrcode');

// middleware , Analyze the request body data

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//connect db
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./db/db.db',(err)=>{
    if(err){
        console.log('Erro ao conectar ao banco de dados.');
    }else{
        console.log('Conectado ao banco de dados SQLITE');
    }
});



//Routes
app.get('/',(req,res)=>{
    res.sendFile(__dirname + '/login.html');
});

app.get('/home', (req, res) => {
    res.sendFile(__dirname + '/home.html');
});

app.get('/product', (req, res) => {
    res.sendFile(__dirname + '/product.html');
});

app.get('/table', (req, res) => {
    res.sendFile(__dirname + '/table.html');
});


//Login Form Router 

app.post('/login',(req,res)=>{
    const {login, password} = req.body;

    

    req.body.login

    // form authentication

    db.get('SELECT * FROM user WHERE login = ? AND password = ?',[login,password],(err,row)=>{
        console.log('Login recebido:', login);
        console.log('Senha recebida:', password);
      if(err){
        console.error('Erro ao executar consulta SQL:', err);
        return res.status(500).send('Erro interno do servidor');
      }
      if(!row){
        return res.status(401).send('Credenciais invalidas');
      }

      res.redirect('/home');
    })
});

//Product Form Router 

// Register or update Product
app.post('/product', (req, res) => {
    const { name, price, expiration_date, quantity } = req.body;

    // Checks to see if the product already exists in the database
    db.get('SELECT * FROM product WHERE name = ?', [name], (err, row) => {
        if (err) {
            console.error('Erro ao verificar o produto:', err);
            return res.status(500).send('Erro ao verificar o produto');
        }

        if (row) {
            // If the product already exists, update the quantity and expiration date
            const newQuantity = parseInt(row.quantity) + parseInt(quantity);
            db.run('UPDATE product SET quantity = ?, expiration_date = ? WHERE name = ?', [newQuantity, expiration_date, name], (err) => {
                if (err) {
                    console.error('Erro ao atualizar o produto:', err);
                    return res.status(500).send('Erro ao atualizar o produto');
                }
                console.log('Produto atualizado com sucesso');
                res.redirect('/product');
            });
        } else {
            // If the product does not exist, enter a new record
            db.run('INSERT INTO product (name, price, expiration_date, quantity) VALUES (?, ?, ?, ?)', [name, price, expiration_date, quantity], (err) => {
                if (err) {
                    console.error('Erro ao cadastrar o produto:', err);
                    return res.status(500).send('Erro ao cadastrar o produto');
                }
                console.log('Produto cadastrado com sucesso');
                res.redirect('/product');
            });
        }
    });
});


//Remove product

app.post('/product/delete',(req,res) =>{
    const productId = req.body.id

    if(!productId || isNaN(productId)){
        return res.status(400).send('ID de produto invalido');
    }

    db.run('DELETE FROM product WHERE id = ?', [productId], (err) => {
        if (err) {
            console.error('Erro ao excluir o produto:', err);
            return res.status(500).send('Erro ao excluir o produto');
        }
        console.log('Produto excluído com sucesso');
        res.redirect('/product'); 
    });
});

// to list products

app.get('/products',(req,res)=>{
    db.all('SELECT * FROM product',(err,rows)=>{
        if(err){
            console.log('Erro ao obter a lista de produtos',err);
            return res.status(500).send('Erro ao obter a lista de produtos');
            
        }

        res.json(rows);
    });
});

// Editar produto
app.post('/product/edit', (req, res) => {
    const { id, name, price, expiration_date, quantity } = req.body;

    db.get('SELECT * FROM product WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Erro ao verificar o produto:', err);
            return res.status(500).send('Erro ao verificar o produto');
        }

        if (row) {
            // Se o produto existir, atualize os dados
            db.run('UPDATE product SET name = ?, price = ?, expiration_date = ?, quantity = ? WHERE id = ?', [name, price, expiration_date, quantity, id], (err) => {
                if (err) {
                    console.error('Erro ao atualizar o produto:', err);
                    return res.status(500).send('Erro ao atualizar o produto');
                }
                console.log('Produto atualizado com sucesso');
                res.sendStatus(200);
            });
        } else {
            // Se o produto não existir, retorne um erro
            console.error('Produto não encontrado');
            return res.status(404).send('Produto não encontrado');
        }
    });
});



//Tables

app.post('/table', (req, res) => {
    const { name_table } = req.body;

    console.log(`Nome recebido:${name_table}`);
    // Geração do QR Code
    const qrCodeData = `Nome da Mesa: ${name_table}`;
    qr.toDataURL(qrCodeData, (err, qrCodeURL) => {
        if (err) {
            console.error('Erro ao gerar o QR Code:', err);
            return res.status(500).send('Erro ao gerar o QR Code');
        }

        // Inserção da mesa no banco de dados
        db.run('INSERT INTO tables_ (name_table, qrcode) VALUES (?, ?)', [name_table, qrCodeURL], (err) => {
            if (err) {
                console.error('Erro ao cadastrar a mesa:', err);
                return res.status(500).send('Erro ao cadastrar a mesa');
            }
            console.log('Mesa cadastrada com sucesso');
            res.redirect('/table');
        });
    });
});

// List tables

app.get('/tables', (req, res) => {
    db.all('SELECT * FROM tables_', (err, rows) => {
        if (err) {
            console.error('Erro ao obter a lista de mesas:', err);
            return res.status(500).send('Erro ao obter a lista de mesas');
        }
        res.json(rows);
    });
});

//Start server
app.listen(PORT,()=>{
    console.log(`Servidor rodando na porta ${PORT}`);
});


