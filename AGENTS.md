# Regras para trabalhar no gerador de recibos

## Estrutura da primeira versão

O app usa apenas HTML, CSS e JavaScript nativos, em três arquivos na raiz:

- `index.html` contém a estrutura do formulário e do recibo.
- `styles.css` contém os estilos de tela e de impressão.
- `script.js` contém a validação, a formatação e o comportamento da interface.

Carregue o CSS e o JavaScript pelo HTML, em arquivos externos. Mantenha o app sem frameworks, bibliotecas de execução, servidor de aplicação ou etapa de compilação. Os três arquivos são os publicados na hospedagem estática. Arquivos de documentação e testes ficam fora desse conjunto.

- Consulte `REQUISITOS.md` antes de alterar o comportamento do app. Vincule cada entrega aos critérios de aceite correspondentes. Registre decisões de produto que afetem emissão, armazenamento ou publicação.
- Mantenha uma única regra para interpretar e validar valores e datas. Use centavos inteiros para dinheiro e trate a data como dia de calendário. Gere a prévia e a impressão a partir dos mesmos dados validados.
- Use dados fictícios nos testes, exemplos e demonstrações. Mantenha dados preenchidos pelo usuário fora de logs, URLs e serviços externos. Renderize campos como texto.
- Faça mudanças pequenas e revisáveis. Inclua um teste de regressão ao corrigir valor, data, identificação das partes ou impressão. Preserve as verificações existentes ao corrigir falhas.
- Antes de concluir uma mudança de código, execute as verificações aplicáveis do projeto. Se alterar o recibo, confira também a saída de impressão A4. Informe o que executou, o resultado e o que ficou pendente.

Os comandos do projeto serão registrados quando a estrutura inicial estiver definida.
