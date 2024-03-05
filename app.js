//app.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

//QrCode
const qr = require('qrcode');

// Gera o QR Code dinamicamente
qr.toDataURL('http://10.100.1.13:3000/user_requests', (err, qrCodeURL) => {
    if (err) {
        console.error('Erro ao gerar QR Code:', err);
    } else {
        console.log('QR Code gerado com sucesso');
        console.log('URL do QR Code:', qrCodeURL);

    }
});


// middleware , Analyze the request body data

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware e configurações do servidor

app.get('/qrcode', async (req, res) => {
    try {
        const qrCodeURL = await generateQRCodeURL('/user_requests');
        const html = generateHTMLWithQRCode(qrCodeURL);
        res.send(html);
    } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
        res.status(500).send('Erro interno do servidor');
    }
});

function generateQRCodeURL(data) {
    return new Promise((resolve, reject) => {
        qr.toDataURL(data, (err, url) => {
            if (err) {
                reject(err);
            } else {
                resolve(url);
            }
        });
    });
}

function generateHTMLWithQRCode(qrCodeURL) {
    return `
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QrCode</title>
        <link rel="stylesheet" href="qrcode.css">
        <link rel="stylesheet" href="reset.css">
    </head>
    <body>
        <header class="header">
            <h1 class="title-home">Tela QrCode</h1>
            <nav>
                <ul class="menu">
                    <li class="li-menu"><a href="/home" class="a-menu">Home</a></li>
                    <li class="li-menu"><a href="/product" class="a-menu">Produtos</a></li>
                    <li class="li-menu"><a href="/qrcode" class="a-menu">QrCode</a></li>
                    <li class="li-menu"><a href="/kitchen" class="a-menu">Cozinha</a></li>
                    <li class="li-menu"><a href="/Requests" class="a-menu">Pedidos</a></li>
                </ul>
            </nav>      
        </header>
        <main class="main">
            <section>
                <h1>QrCode </h1>
                <!-- Adicione um ID à tag img para poder referenciá-la no script -->
                <img src="${qrCodeURL}" alt="QR Code">
            </section>
        </main>
        <footer class="footer">
            <p>todos os direitos reservados 2024</p>
        </footer>
    
        <!-- Adicione a biblioteca qrcode.js -->
        <script src="https://cdn.jsdelivr.net/npm/qrcode@latest"></script>
        <script>
            // Gera o QR Code dinamicamente e atualiza a tag img
            QRCode.toDataURL('/user_requests', function(err, qrCodeURL) {
                if (err) {
                    console.error('Erro ao gerar QR Code:', err);
                } else {
                    console.log('QR Code gerado com sucesso');
                    console.log('URL do QR Code:', qrCodeURL);
                    document.getElementById('qrcode').src = qrCodeURL;
                }
            });
        </script>
    </body>
    </html>
    
    `;
}

//connect db
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./db/db.db',(err)=>{
    if(err){
        console.log('Erro ao conectar ao banco de dados.');
    }else{
        console.log('Conectado ao banco de dados SQLITE');
    }
});

// Define o diretório raiz para servir arquivos estáticos
app.use(express.static(__dirname));

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

app.get('/kitchen', (req, res) => {
    res.sendFile(__dirname + '/kitchen.html');
});

app.get('/qrcode', (req, res) => {
    res.sendFile(__dirname + '/qrcode.html');
});

app.get('/requests', (req, res) => {
    res.sendFile(__dirname + '/requests.html');
});

//Routes users

app.get('/user_requests', (req, res) => {
    res.sendFile(__dirname + '/user_requests.html');
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
    const { name, price, expiration_date, quantity, category } = req.body;

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
            db.run('INSERT INTO product (name, price, expiration_date, quantity, category) VALUES (?, ?, ?, ?, ?)', [name, price, expiration_date, quantity, category], (err) => {
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
    const { id, name, price, expiration_date, quantity, category } = req.body;

    db.get('SELECT * FROM product WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Erro ao verificar o produto:', err);
            return res.status(500).send('Erro ao verificar o produto');
        }

        if (row) {
            // Se o produto existir, atualize os dados
            db.run('UPDATE product SET name = ?, price = ?, expiration_date = ?, quantity = ?, category = ? WHERE id = ?', [name, price, expiration_date, quantity, category, id], (err) => {
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


// Endpoint para carregar produtos
app.get('/products', (req, res) => {
    db.all('SELECT * FROM product', (err, rows) => {
        if (err) {
            console.log('Erro ao obter a lista de produtos', err);
            return res.status(500).send('Erro ao obter a lista de produtos');
        }
        res.json(rows);
    });
});

// Estrutura de dados para armazenar temporariamente os itens do carrinho
let cartItems = [];

// Endpoint para adicionar produto ao carrinho com quantidade
app.post('/add-to-cart', (req, res) => {
    const { productId, quantity } = req.body;

    db.get('SELECT * FROM product WHERE id = ?', [productId], (err, row) => {
        if (err) {
            console.error('Erro ao buscar o produto:', err);
            return res.status(500).send('Erro ao buscar o produto');
        }

        if (row) {
            const product = {
                id: row.id,
                name: row.name,
                price: row.price,
                quantity: quantity
            };
            cartItems.push(product);
            res.sendStatus(200);
        } else {
            res.status(404).send('Produto não encontrado');
        }
    });
});

// Função para confirmar o pedido
app.post('/confirm-order', async (req, res) => {
    const { tableNumber, userName } = req.body;
    const totalBalance = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Verifica se o carrinho não está vazio
    if (cartItems.length === 0) {
        return res.status(400).send('O carrinho está vazio. Adicione produtos antes de confirmar o pedido.');
    }

    try {
        // Extrai apenas os nomes dos produtos
        const productNames = cartItems.map(item => item.name);
        
        // Extrai apenas as quantidades dos produtos
        const productQuantities = cartItems.map(item => item.quantity);

        // Insere o pedido no banco de dados com os nomes e quantidades dos produtos
        await db.run('INSERT INTO requests (product, quantity, number_table, user_name, total_balance) VALUES (?, ?, ?, ?, ?)', [JSON.stringify(productNames), JSON.stringify(productQuantities), tableNumber, userName, totalBalance]);
        cartItems = []; // Limpa o carrinho após o pedido ser confirmado
        res.sendStatus(200);
    } catch (error) {
        console.error('Erro ao confirmar o pedido:', error);
        return res.status(500).send('Erro ao confirmar o pedido');
    }
});



// Função para executar uma transação
function runTransaction(callback) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            callback(db)
                .then(() => {
                    db.run('COMMIT', (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                })
                .catch((error) => {
                    db.run('ROLLBACK');
                    reject(error);
                });
        });
    });
}


// Endpoint para obter os pedidos
app.get('/orders', (req, res) => {
    db.all('SELECT * FROM requests', (err, rows) => {
        if (err) {
            console.log('Erro ao obter os pedidos', err);
            return res.status(500).send('Erro ao obter os pedidos');
        }

        // Para cada pedido, buscar os detalhes dos produtos associados
        Promise.all(rows.map(row => {
            return new Promise((resolve, reject) => {
                db.all('SELECT * FROM product WHERE id IN (SELECT product_id FROM request_products WHERE request_id = ?)', [row.id], (err, products) => {
                    if (err) {
                        reject(err);
                    } else {
                        row.products = products;
                        resolve(row);
                    }
                });
            });
        })).then(ordersWithProducts => {
            res.json(ordersWithProducts);
        }).catch(error => {
            console.error('Erro ao obter os detalhes dos produtos:', error);
            return res.status(500).send('Erro ao obter os detalhes dos produtos');
        });
    });
});

// Endpoint para marcar um pedido como entregue
app.post('/mark-as-delivered', (req, res) => {
    const { orderId } = req.body;

    db.run('UPDATE requests SET delivered = 1 WHERE id = ?', [orderId], (err) => {
        if (err) {
            console.error('Erro ao marcar o pedido como entregue:', err);
            return res.status(500).send('Erro ao marcar o pedido como entregue');
        }
        res.sendStatus(200);
    });
});





//Start server
app.listen(PORT,()=>{
    console.log(`Servidor rodando na porta ${PORT}`);
});


