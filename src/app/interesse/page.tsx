import React, { useState } from 'react';
import emailjs from '@emailjs/browser';

emailjs.init("nQx9hxIdy5WS92lJa");

export default function InteressePage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [podcastLink, setPodcastLink] = useState('');
  const [averageListeners, setAverageListeners] = useState('');
  const [frequency, setFrequency] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const templateParams = {
        from_name: name,
        to_name: name,
        message: `
Nome: ${name}
Email: ${email}
Link do Podcast: ${podcastLink}
Média de Ouvintes: ${averageListeners}
Periodicidade: ${frequency}
Razão: ${reason}
        `,
        to_email: 'askpod@pracy.com.br',
        reply_to: email
      };

      console.log('Enviando email com params:', templateParams);

      const response = await emailjs.send(
        'pracy_askpod',
        'template_m0gbgdf',
        templateParams,
        'nQx9hxIdy5WS92lJa'
      );

      console.log('Resposta completa:', response);

      if (response.status === 200) {
        setSubmitted(true);
        console.log('Email enviado com sucesso!');
      } else {
        throw new Error('Erro ao enviar email');
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      {submitted ? (
        <div className="relative py-3 sm:max-w-xl sm:mx-auto text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Obrigada por enviar seu interesse. Se você for selecionado pra testar nossa versão beta, entraremos em contato.
          </h1>
        </div>
      ) : (
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="relative px-4 py-10 bg-white mx-8 md:mx-0 shadow rounded-3xl sm:p-10">
            <div className="max-w-md mx-auto">
              <div className="divide-y divide-gray-200">
                <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                  <h2 className="text-2xl font-semibold mb-8">Quero ser um dos primeiros a testar</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nome</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Link do podcast</label>
                      <input
                        type="url"
                        required
                        value={podcastLink}
                        onChange={(e) => setPodcastLink(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Média de ouvintes por episódio</label>
                      <input
                        type="text"
                        required
                        value={averageListeners}
                        onChange={(e) => setAverageListeners(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Periodicidade dos episódios</label>
                      <input
                        type="text"
                        required
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Por que você deveria ser escolhido para testar o AskPod?</label>
                      <textarea
                        required
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={4}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Enviar
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}