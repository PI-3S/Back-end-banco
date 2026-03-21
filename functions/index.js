const express = require('express');
const cors = require('cors');
const { db, auth } = require('./services/firebase');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API funcionando!' });
});

app.post('/api/users', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name
    });

    await db.collection('users').doc(userRecord.uid).set({
      name,
      email,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ 
      success: true, 
      uid: userRecord.uid 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});