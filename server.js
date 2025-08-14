const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const fs = require ('fs');
const csv = require ('csv-parser');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); 

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Awoo123@', 
    database: 'banco_bd',
    port: 3306
});

db.connect(err => {
    if (err) {
        console.error('❌ Error al conectar a MySQL:', err.message);
        process.exit(1);
    }
    console.log('✅ Conectado a MySQL');
});
a
// Cargar datos desde CSV (solo si hay archivo banco_data2.csv en la raíz)
const csvPath = 'banco_data2.csv';
if (fs.existsSync(csvPath)) {
    fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
            db.query(
                'INSERT IGNORE INTO clients (id_client, name_client, number_identification, adress, tel, email) VALUES (?, ?, ?, ?, ?, ?)',
                [row.id_client, row.name_client, row.number_identification, row.adress, row.tel, row.email],
                (err) => {
                    if (err) console.error('Error insertando fila CSV:', err);
                }
            );
        })
        .on('end', () => {
            console.log('CSV procesado correctamente');
        });
} else {
    console.log('No se encontró banco_data2.csv — salta carga inicial.');
}


//  Get all clients
app.get('/clientes', (req, res) => {
    db.query('SELECT * FROM clients', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al obtener los clientes' });
        }
        res.json(results);
    });
});

// Add client
app.post('/clientes', (req, res) => {
    const { id_client, name_client, number_identification, adress, tel, email } = req.body;

    if (!id_client || !name_client || !number_identification) {
        return res.status(400).json({ error: 'id_client, name_client y number_identification son obligatorios' });
    }

    db.query(
        'INSERT INTO clients (id_client, name_client, number_identification, adress, tel, email) VALUES (?, ?, ?, ?, ?, ?)',
        [id_client, name_client, number_identification, adress || null, tel || null, email || null],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al agregar el cliente' });
            }
            res.status(201).json({ id_client, name_client, number_identification, adress, tel, email });
        }
    );
});

// Edit client
app.put('/clientes/:id', (req, res) => {
    const { id } = req.params;
    const { name_client, number_identification, adress, tel, email } = req.body;

    if (!name_client || !number_identification) {
        return res.status(400).json({ error: 'name_client y number_identification son obligatorios' });
    }

    db.query(
        'UPDATE clients SET name_client = ?, number_identification = ?, adress = ?, tel = ?, email = ? WHERE id_client = ?',
        [name_client, number_identification, adress || null, tel || null, email || null, id],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Error al actualizar el cliente' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Cliente no encontrado' });
            }
            res.json({ id_client: id, name_client, number_identification, adress, tel, email });
        }
    );
});

//  Delete client
app.delete('/clientes/:id', (req, res) => {
    const { id } = req.params;

    db.query('DELETE FROM clients WHERE id_client = ?', [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al eliminar el cliente' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        res.json({ mensaje: 'Cliente eliminado correctamente' });
    });
});

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend en http://localhost:${PORT}`);
});
