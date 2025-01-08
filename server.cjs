const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  host: 'mail.pracy.com.br',
  port: 465,
  secure: true,
  auth: {
    user: 'askpod@pracy.com.br',
    pass: 'Af23123011!',
  },
});

app.post('/send-email', (req, res) => {
  const { subject, text } = req.body;

  const mailOptions = {
    from: 'askpod@pracy.com.br',
    to: 'pracyassessoria@gmail.com',
    subject: subject,
    text: text,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Erro ao enviar email:', error);
      console.error('Stack:', error.stack);
      console.error('Detalhes:', error.response);
      console.error('Código do erro:', error.code);
      console.error('Resposta do servidor:', error.response);
      return res.status(500).send('Erro ao enviar email');
    }
    console.log('Email enviado:', info.response);
    console.log('Detalhes do envio:', info.envelope);
    console.log('ID do email:', info.messageId);
    res.status(200).send('Email enviado');
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
