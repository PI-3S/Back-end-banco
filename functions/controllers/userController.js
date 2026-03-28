const { db, auth } = require('../config/firebase');

const userController = {
  // Criar usuário
  async createUser(req, res) {
    try {
      const { email, password, name } = req.body;
      
      // Criar usuário no Authentication
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: name
      });

      // Salvar dados adicionais no Firestore (Ajustado para 'usuarios')
      await db.collection('usuarios').doc(userRecord.uid).set({
        nome: name, // Usando 'nome' para seguir o padrão das outras rotas
        email,
        createdAt: new Date().toISOString()
      });

      res.status(201).json({ 
        message: 'Usuário criado com sucesso', 
        uid: userRecord.uid 
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Listar usuários
  async getUsers(req, res) {
    try {
      const usersSnapshot = await db.collection('usuarios').get();
      const users = [];
      
      usersSnapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() });
      });

      res.json(users);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Buscar usuário por ID
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const userDoc = await db.collection('usuarios').doc(id).get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.json({ id: userDoc.id, ...userDoc.data() });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Atualizar usuário
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      await db.collection('usuarios').doc(id).update({
        nome: name,
        updatedAt: new Date().toISOString()
      });

      res.json({ message: 'Usuário atualizado com sucesso' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Deletar usuário
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      
      // Deletar do Authentication
      await auth.deleteUser(id);
      
      // Deletar do Firestore
      await db.collection('usuarios').doc(id).delete();

      res.json({ message: 'Usuário deletado com sucesso' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = userController;