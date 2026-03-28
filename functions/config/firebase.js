const admin = require('firebase-admin');

// Montando o objeto de configuração usando as variáveis que você tem no .env
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // O replace garante que as quebras de linha da chave privada sejam lidas corretamente no Vercel
  privateKey: process.env.FIREBASE_PRIVATE_KEY 
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
    : undefined,
};

if (admin.apps.length === 0) {
  if (firebaseConfig.projectId && firebaseConfig.clientEmail && firebaseConfig.privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig),
        databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      });
    } catch (error) {
      console.error("Erro ao inicializar Firebase:", error.message);
    }
  } else {
    console.error("Aviso: Variáveis de ambiente do Firebase ausentes.");
  }
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

module.exports = { admin, db, auth, storage };