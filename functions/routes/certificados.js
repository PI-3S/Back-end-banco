const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const { verificarToken, verificarPerfil } = require('../middlewares/auth');
const multer = require('multer');

const db = admin.firestore();
const bucket = admin.storage().bucket();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/certificados - Aluno faz upload
router.post('/', verificarToken, verificarPerfil('aluno'), upload.single('arquivo'), async (req, res) => {
  try {
    const { submissao_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo é obrigatório' });
    }

    if (!submissao_id) {
      return res.status(400).json({ error: 'submissao_id é obrigatório' });
    }

    const nomeArquivo = `certificados/${Date.now()}_${req.file.originalname}`;
    const file = bucket.file(nomeArquivo);

    await file.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
    });

    await file.makePublic();

    const url = `https://storage.googleapis.com/${bucket.name}/${nomeArquivo}`;

    const docRef = await db.collection('certificados').add({
      submissao_id,
      nome_arquivo: req.file.originalname,
      url_arquivo: url,
      processado_ocr: false,
      texto_extraido: null,
      created_at: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      id: docRef.id,
      url_arquivo: url,
      mensagem: 'Certificado enviado com sucesso!',
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/certificados?submissao_id=xxx
router.get('/', verificarToken, async (req, res) => {
  try {
    const { submissao_id } = req.query;

    let query = db.collection('certificados');

    if (submissao_id) {
      query = query.where('submissao_id', '==', submissao_id);
    }

    const snapshot = await query.get();

    const certificados = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ success: true, certificados });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;