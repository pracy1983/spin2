import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'mail.pracy.com.br',
  port: 465,
  secure: true, // true para 465, false para outras portas
  auth: {
    user: 'askpod@pracy.com.br',
    pass: 'Af23123011!',
  },
});

export const sendEmail = (subject: string, text: string) => {
  const mailOptions = {
    from: 'askpod@pracy.com.br',
    to: 'pracyassessoria@gmail.com',
    subject: subject,
    text: text,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Erro ao enviar email:', error);
    } else {
      console.log('Email enviado:', info.response);
    }
  });
};
