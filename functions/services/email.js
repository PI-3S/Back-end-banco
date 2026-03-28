const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const enviarEmailCoordenador = async (emailCoordenador, nomeAluno) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: emailCoordenador,
    subject: 'Nova submissão de atividade complementar',
    html: `
      <h2>Nova submissão recebida!</h2>
      <p>O aluno <strong>${nomeAluno}</strong> enviou uma nova solicitação de atividade complementar.</p>
      <p>Acesse o sistema para validar.</p>
    `,
  });
};

const enviarEmailAluno = async (emailAluno, nomeAluno, status) => {
  const aprovado = status === 'aprovado';

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: emailAluno,
    subject: `Sua submissão foi ${status}`,
    html: `
      <h2>Atualização da sua submissão</h2>
      <p>Olá, <strong>${nomeAluno}</strong>!</p>
      <p>Sua atividade complementar foi <strong>${aprovado ? '✅ aprovada' : '❌ reprovada'}</strong>.</p>
      <p>Acesse o sistema para mais detalhes.</p>
    `,
  });
};

module.exports = { enviarEmailCoordenador, enviarEmailAluno };