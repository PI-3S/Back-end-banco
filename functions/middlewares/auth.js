const admin = require('../config/firebase');

const db = admin.firestore();

const verificarToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);

    const doc = await db.collection('usuarios').doc(decoded.uid).get();

    if (!doc.exists) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    req.usuario = { uid: decoded.uid, ...doc.data() };
    next();

  } catch (error) {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

const verificarPerfil = (...perfisPermitidos) => {
  return (req, res, next) => {
    const perfil = req.usuario?.perfil;

    if (!perfisPermitidos.includes(perfil)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    next();
  };
};

module.exports = { verificarToken, verificarPerfil };