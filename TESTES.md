# Testes de aceitação

Abra o arquivo index.html no navegador. Use apenas dados fictícios, como Pessoa Pagadora, Pessoa Recebedora, Fortaleza - CE e “Pagamento de serviço de demonstração”.

| Critério | Ação | Resultado esperado |
| --- | --- | --- |
| R01 | Envie o formulário vazio. Depois, repita com espaços no campo Quem pagou e os demais campos preenchidos. | Cada campo obrigatório inválido mostra seu erro e o foco vai para o primeiro. |
| R01 | Gere uma prévia com os nomes fictícios acima. | Pessoa Pagadora aparece na declaração. Pessoa Recebedora aparece junto à linha de assinatura. |
| R02 | Gere uma prévia com 3.000,01 e outra com 0,01. | A primeira mostra R$ 3.000,01 e “três mil reais e um centavo”. A segunda mostra R$ 0,01 e “um centavo”. |
| R02 | Tente gerar com 0, -1,00, 3.00,01 e 1,001. | Cada tentativa mostra um erro de valor e impede a geração. |
| R03 | Abra a página e compare a data sugerida com o dia local. Gere com 29/02/2024 e tente com 29/02/2025. | A data sugerida corresponde ao dia local. A primeira data aparece no recibo. A segunda impede a geração. |
| R04 | Gere sem documento. Depois, selecione RG, digite 001234-X e gere novamente. | A primeira prévia omite a linha de documento. A segunda mostra RG e 001234-X junto ao recebedor. |
| R05 | Gere a prévia e altere o valor. Tente imprimir pelo botão e pelo menu do navegador. | A prévia desatualizada fica indisponível para impressão. Depois de gerar novamente, a impressão mostra o valor novo. |
| R05 | Gere com nomes de 120 caracteres e uma descrição de 600 caracteres com acentos, quebras de linha e uma palavra longa. Salve como PDF em A4. | O PDF contém só o recibo. O texto quebra sem cortes, mantém acentos e quebras de linha, e a assinatura fica inteira. |
| R05 | Inclua o texto literal `<b>Serviço</b>` na descrição e gere a prévia. | As marcações aparecem como texto na declaração e no PDF. |
| R06 | Ajuste a janela para 360 px e use Tab e Enter para preencher e gerar a prévia. | Os campos e botões são alcançáveis por teclado e a página não apresenta rolagem horizontal. |
| R06 | Com as ferramentas do navegador abertas, gere a prévia e recarregue a página. | O preenchimento é descartado. Os dados do formulário não aparecem na URL, no armazenamento, no console nem nas requisições. |
