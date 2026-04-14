// functions/scripts/setup-firestore.js
const path = require('path');

// Carrega o .env da pasta functions (um nível acima)
require('dotenv').config({ 
  path: path.resolve(__dirname, '../.env')  // Sobe UMA pasta!
});

const admin = require('firebase-admin');

// Debug: verifica se carregou
console.log('📋 Verificando variáveis:');
console.log('PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅' : '❌');
console.log('CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✅' : '❌');
console.log('PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✅' : '❌');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅' : '❌');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅' : '❌');

// Se não encontrar, tenta sem path (já que está na mesma hierarquia)
if (!process.env.FIREBASE_PROJECT_ID) {
  console.log('⚠️ Tentando carregar sem path específico...');
  require('dotenv').config();
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

async function setupFirestore() {
  console.log('🚀 Iniciando configuração do Firestore...\n');
  
  const batch = db.batch();
  
  // 1. Configuração de Email
  console.log('📧 Criando configuração de email...');
  const emailConfigRef = db.collection('configuracoes').doc('email_config');
  batch.set(emailConfigRef, {
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    user: process.env.EMAIL_USER || "senac.atividades@gmail.com",
    pass: process.env.EMAIL_PASS || "COLOQUE_SUA_SENHA_APP_AQUI",
    from: `SGC SENAC <${process.env.EMAIL_USER || "senac.atividades@gmail.com"}>`,
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    updated_by: "system"
  });
  
  // 2. Configuração do Sistema
  console.log('⚙️ Criando configurações do sistema...');
  const sistemaRef = db.collection('configuracoes').doc('sistema_config');
  batch.set(sistemaRef, {
    nome_sistema: "SGC - Sistema de Gestão de Certificados",
    instituicao: "SENAC",
    logo_url: "/assets/logo-white.png",
    cor_primaria: "hsl(210, 80%, 55%)",
    cor_secundaria: "hsl(30, 95%, 55%)",
    updated_at: new Date().toISOString()
  });
  
  // 3. Limites do Sistema
  console.log('📏 Criando limites do sistema...');
  const limitesRef = db.collection('configuracoes').doc('limites_config');
  batch.set(limitesRef, {
    tamanho_maximo_upload: 4,
    unidade_tamanho: "MB",
    formatos_permitidos: ["pdf", "jpg", "png", "webp"],
    horas_minimas_por_curso: { default: 200 },
    updated_at: new Date().toISOString()
  });
  
  await batch.commit();
  
  console.log('\n✅ TUDO CONFIGURADO COM SUCESSO!');
  console.log('\n📋 Coleções criadas:');
  console.log('   ✅ configuracoes/email_config');
  console.log('   ✅ configuracoes/sistema_config');
  console.log('   ✅ configuracoes/limites_config');
}

setupFirestore().catch(error => {
  console.error('❌ Erro:', error.message);
});