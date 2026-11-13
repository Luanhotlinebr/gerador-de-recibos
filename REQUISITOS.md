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
| R04 | Permitir documento opcional do recebedor com tipo explícito entre CPF, CNPJ e RG. Preservar zeros à esquerda e manter o tipo separado do conteúdo. | Campo vazio omite a linha de documento. CPF exige 11 dígitos. CNPJ aceita 12 letras ou números seguidos de dois dígitos verificadores válidos. Ambos aparecem formatados junto ao recebedor. RG de nove dígitos recebe a máscara e variantes são preservadas. |
| R05 | Gerar uma prévia com valor destacado, declaração de recebimento, descrição, local, data e linha de assinatura. Prévia e impressão usam o mesmo modelo de recibo e os mesmos dados validados. | Alterar um campo exige atualizar a prévia antes de imprimir. Acentos e quebras de linha são preservados. O texto longo quebra em linhas e a impressão A4 mantém o conteúdo legível e o bloco de assinatura inteiro. A impressão contém somente o recibo. |
| R06 | Manter o preenchimento em memória e permitir uso por teclado e em tela estreita. | Recarregar a página descarta o preenchimento. Conferir que campos não aparecem em armazenamento do navegador, URLs, logs ou requisições. Percorrer o formulário por teclado e verificar uma largura de 360 px sem rolagem horizontal. |

## Decisões de produto pendentes

- O cabeçalho da empresa é fixo, editável ou dispensável? Nas capturas, a empresa do cabeçalho e a pessoa no bloco de assinatura são distintas. Antes de oferecer cabeçalho, definir o papel de cada parte e quais dados vão no documento.
- Quem vai usar o app e onde será publicado? Confirmar se é uma ferramenta de preenchimento avulso ou se a operação precisa guardar e recuperar recibos emitidos. Se precisar de histórico, definir acesso, retenção e recuperação antes de escolher a arquitetura.

## Decisões adotadas na primeira versão

- R02. Valores de R$ 0,01 a R$ 999.999.999,99, com agrupamento opcional por ponto e até duas casas decimais após a vírgula.
- R04. O documento é opcional e o recibo identifica o tipo escolhido. CPF usa a máscara `000.000.000-00`. CNPJ usa `XX.XXX.XXX/XXXX-00`, com letras de A a Z ou números nas posições X. Letras minúsculas são convertidas para maiúsculas. Os dois dígitos verificadores são conferidos localmente pelo módulo 11 da Receita Federal, inclusive no CNPJ numérico. RG de nove dígitos usa `00.000.000-0`. As demais variantes de RG são transcritas como digitadas, removendo espaços externos e respeitando o limite de 32 caracteres.
- R01 e R05. O formulário admite até 120 caracteres por nome, 100 no local e 600 na descrição. Se o conteúdo precisar de mais espaço na impressão, a declaração pode continuar na página seguinte e o rodapé com a assinatura deve ficar inteiro.
- R05 e R06. A prévia é descartada ao editar o formulário. O preenchimento existe em memória durante o uso da página e pode sair do navegador como impressão ou PDF por ação do usuário.

## Ordem de implementação e publicação

1. **Validação.** Definir os limites que afetam o formulário e implementar os testes de valores, datas, campos obrigatórios e identificação das partes.
2. **Fluxo completo.** Implementar formulário, prévia e impressão. Validar o fluxo com dados fictícios e inspecionar o PDF A4 exportado, inclusive com nomes longos e descrição extensa.
3. **Entrega.** Versionar com Git e configurar a integração contínua para executar os testes em cada proposta de mudança. Testar os três arquivos estáticos em um endereço de homologação e verificar que é possível republicar a última versão aprovada. Publicar a versão conferida com HTTPS e repetir o teste com dados fictícios no endereço final.
