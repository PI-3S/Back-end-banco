const { db } = require('../config/firebase');

const registrarLog = async (usuario_id, acao, detalhes = {}) => {
  try {
    await db.collection('logs').add({
      usuario_id,
      acao,
      detalhes,
      criado_em: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao registrar log:', error);
  }
};

module.exports = { registrarLog };