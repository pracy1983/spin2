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
      return res.status(500).send('Erro ao enviar email');
    }
    res.status(200).send('Email enviado');
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
