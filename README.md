# whatsappweb

Nesse sistema temos acesso a uma api do whatsappweb, conseguimos modificar para interagir com o dialogflow e outras aplicações.

## Instalação

Insira o comando `npm install` para que seja instalada todas dependencias do projeto, logo após insira o comando `npm start` para que sua aplicação começe a rodar.


## Funcionalidades

É possível criar comandos dinamicamente através do DialogFlow e Whatsapp utilizando o método de Tags, a sequencia inicial para verificar se existem os elementos são: 

```
<imagemCreate> --- Se no texto de resposta conter essa tag, ele vai criar como primeiro elemento da conversa
<text> ----------- Logo após ele cria um texto
<buttonCreate> --- Se preferir pode também inserir um botão
<listCreate> ----- E por fim uma lista se existir
```

Pra que serve cada uma delas:

```
<imagemCreate> --- Enviar mensagem com imagem no whatsapp
<text> ----------- Só envia mensagem de texto como resposta
<buttonCreate> --- Cria botões no whatsapp
<listCreate> ----- Cria lista de whatsapp
```


## Criando listas

Para criar uma lista precisamos inserir a sequencia abaixo de código, lembrando que só (Listcontent e list) que é Obrigatório, caso os outros não existam ele vai ignorar e deixar em branco

```
<listContent>...</listContent> ---------- Mensagem do whatsapp antes da lista
<listAction>...</listAction> ------------ Botão que aciona a lista ex: clique aqui
<listHeaderItens>...</listHeaderItens> -- Titúlo em verde quando abre a lista, abaixo do Título
<list>...</list> ------------------------ Item da lista
<listSub>...</listSub> ------------------ SubItem da lista
<listTitle>...</listTitle> -------------- Título mensagem da Lista
<listFooter>...</listFooter> ------------ Rodapé mensagem da Lista

```

```
Lista limpa:
<listContent></listContent>
<listAction></listAction>
<listHeaderItens></listHeaderItens>
<list></list>
<listSub></listSub>
<listTitle></listTitle>
<listFooter></listFooter>

```

## Criando botões

Para criar botões precisamos inserir a sequencia abaixo de código, lembrando que só (ButtonContent e button) que é Obrigatório, caso os outros não existam ele vai ignorar e deixar em branco

```
<buttonContent>...</buttonContent>-- Mensagem do whatsapp antes dos botões
<buttonTitle>...</buttonTitle>------ Título da mensagem
<buttonFooter>...</buttonFooter>---- Texto do Rodapé
<button>...</button>---------------- Botões
```

```
Lista limpa:
<buttonContent></buttonContent>
<buttonTitle></buttonTitle>
<buttonFooter></buttonFooter>
<button></button>
```

## Criando Imagens

Para enviar imagem adicionamos ao texto as tags abaixo, lembrando que só (imageUrl) que é Obrigatório, caso os outros não existam ele vai ignorar e deixar em branco

```
<imageUrl>...</imageUrl>----------- Caminho da imagem contida na pasta ./media
<imageCaption>...</imageCaption>--- Mensagem que fica abaixo da imagem
```

```
Lista limpa:
<imageUrl></imageUrl>
<imageCaption></imageCaption>
```


## Requisições

Vamos implementar o metódo POST e GET também já vindo do Dialogflow da seguinte maneira:

```
<GET>https://url/endpoint</GET>
<POST>https://url/endpoint</post>
<POSTDATA>{key: value}</POSTDATA>
```

Dessa forma conseguiremos obter o retorno esperado de uma outra aplicação qualquer, tornando essa aqui independente facilitando futuras manutenções