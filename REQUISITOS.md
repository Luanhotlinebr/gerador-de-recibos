# Gerador de recibos

## Escopo proposto para a primeira versão

Preencher, revisar e imprimir um recibo de pagamento em português do Brasil. A impressão também deve permitir salvar em PDF pelo navegador. As capturas do Hiper servem de referência para os campos e a composição do recibo.

A primeira versão é uma página estática com três arquivos de aplicação, conforme a estrutura definida em `AGENTS.md`. Os campos ficam em memória no navegador enquanto a página está aberta. Login, histórico, numeração automática, assinatura digital e integrações ficam fora desta versão. O campo para assinatura manuscrita faz parte do recibo.

## Requisitos e critérios de aceite

| ID | Requisito | Como verificar |
| --- | --- | --- |
| R01 | Identificar quem pagou e quem recebeu com rótulos explícitos. Coletar descrição do pagamento, valor, local e data. Esses campos são obrigatórios na proposta inicial. | Campos vazios ou compostos só por espaços impedem a geração. O erro aparece junto ao campo e o foco vai para o primeiro erro. Na saída, o pagador aparece no texto e o recebedor junto à linha de assinatura. |
| R02 | Aceitar valor em reais no padrão brasileiro. Interpretar a entrada uma vez e manter o valor em centavos inteiros. Exibir o mesmo valor em algarismos e por extenso. | `3.000,01` gera `R$ 3.000,01` e “três mil reais e um centavo”. `0,01` gera “um centavo”. Zero, negativos, agrupamento inválido e mais de duas casas decimais geram erro. |
| R03 | Usar a data local como sugestão inicial, permitir edição e tratar a data como dia de calendário. | `29/02/2024` é aceito e `29/02/2025` é rejeitado. A data escolhida é a mesma na tela e no recibo, inclusive perto da meia-noite. |
| R04 | Permitir documento opcional do recebedor com tipo explícito entre CPF, CNPJ e RG. Preservar zeros à esquerda e manter o tipo separado do conteúdo. | Campo vazio gera recibo sem linha de documento. Quando preenchido, o documento aparece junto ao nome correto. A validação do formato de cada tipo será definida antes da implementação. |
| R05 | Gerar uma prévia com valor destacado, declaração de recebimento, descrição, local, data e linha de assinatura. Prévia e impressão usam o mesmo modelo de recibo e os mesmos dados validados. | Alterar um campo exige atualizar a prévia antes de imprimir. Acentos e quebras de linha são preservados. O texto longo quebra em linhas e a impressão A4 mantém o conteúdo legível e o bloco de assinatura inteiro. A impressão contém somente o recibo. |
| R06 | Manter o preenchimento em memória e permitir uso por teclado e em tela estreita. | Recarregar a página descarta o preenchimento. Conferir que campos não aparecem em armazenamento do navegador, URLs, logs ou requisições. Percorrer o formulário por teclado e verificar uma largura de 360 px sem rolagem horizontal. |

## Decisões de produto pendentes

- O cabeçalho da empresa é fixo, editável ou dispensável? Nas capturas, a empresa do cabeçalho e a pessoa no bloco de assinatura são distintas. Antes de oferecer cabeçalho, definir o papel de cada parte e quais dados vão no documento.
- O documento do recebedor deve ser obrigatório? Quais formatos, regras de validação e formas de exibição o negócio precisa aceitar para CPF, CNPJ e RG?
- Qual é o teto do valor? Qual é o comprimento máximo de nomes e da descrição? Uma descrição extensa pode ocupar mais de uma página?
- Quem vai usar o app e onde será publicado? Confirmar se é uma ferramenta de preenchimento avulso ou se a operação precisa guardar e recuperar recibos emitidos. Se precisar de histórico, definir acesso, retenção e recuperação antes de escolher a arquitetura.

## Ordem de implementação e publicação

1. **Validação.** Definir os limites que afetam o formulário e implementar os testes de valores, datas, campos obrigatórios e identificação das partes.
2. **Fluxo completo.** Implementar formulário, prévia e impressão. Validar o fluxo com dados fictícios e inspecionar o PDF A4 exportado, inclusive com nomes longos e descrição extensa.
3. **Entrega.** Versionar com Git e configurar a integração contínua para executar os testes em cada proposta de mudança. Testar os três arquivos estáticos em um endereço de homologação e verificar que é possível republicar a última versão aprovada. Publicar a versão conferida com HTTPS e repetir o teste com dados fictícios no endereço final.
