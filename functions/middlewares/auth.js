const { auth, db } = require('../config/firebase');

const verificarToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    const usuarioDoc = await db.collection('usuarios').doc(decodedToken.uid).get();
    if (!usuarioDoc.exists) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    req.usuario = { uid: decodedToken.uid, ...usuarioDoc.data() };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

const verificarPerfil = (...perfisPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario || !perfisPermitidos.includes(req.usuario.perfil)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  };
};

module.exports = { verificarToken, verificarPerfil };