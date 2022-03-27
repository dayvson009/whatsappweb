const { Client, List, Buttons, MessageMedia, Contact } = require('whatsapp-web.js');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fs = require('fs');
const { phoneNumberFormatter } = require('./helpers/formatter');
const fileUpload = require('express-fileupload');
const axios = require('axios');
const mime = require('mime-types');

const port = process.env.PORT || 3020;

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(fileUpload({
  debug: true
}));

const SESSION_FILE_PATH = './whatsapp-session.json';
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
  sessionCfg = require(SESSION_FILE_PATH);
}

app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: __dirname
  });
});

const client = new Client({
  restartOnAuthFail: true,
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- this one doesn't works in Windows
      '--disable-gpu'
    ],
  },
  session: sessionCfg
});


/** ----------------- INICIO MEU CÓDIGO --------------- DV
 * String.prototype Cria um Metodo de uma String
 * A função é chamada da seguinte maneira: string.funcao(param)
 * Nesta função ele da um split em tags e retorna o conteúdo de dentro
 */
// String.prototype.getContentTag = function(tag) {

//   let content = String(this).split(`<${tag}>`).slice(1)
//   content = content.map(item => item.split(`</${tag}>`)[0])
//   return content.length > 1 ? content : content[0]

// }

const getContentTag = (msg, tag) => {
  let content = msg.split(`<${tag}>`).slice(1)
  content = content.map(item => item.split(`</${tag}>`)[0])
  return content.length > 1 ? content : content[0]
}

/**
 * Sleep é uma função para dar um pause temporário
 */
const sleep = (ms) => new Promise((resolve)=>setTimeout(resolve, ms))

/**
 * Aqui Envia a mensagem para o DialogFlow, e Retorna a resposta do mesmo
 */
const sendDialogFlow = async (mensagem, numero) => {

  const body = {
    "text": mensagem,
    "userId": numero
  }

  const resp = await axios.post('http://localhost:3030/text_query', body)

  return resp.data

}

/**
 * Função para criar botão de whatsapp
 */
const sendButton = async (phone, msg) => {

  const buttonContent = getContentTag(msg,'buttonContent')
  const buttonTitle = getContentTag(msg,'buttonTitle') || ""
  const buttonFooter = getContentTag(msg,'buttonFooter') || ""
  const buttons = getContentTag(msg,'button') || ""

  const listButtons = buttons.map(item => ({body:item}))
  const button = new Buttons(buttonContent,listButtons,buttonTitle,buttonFooter);

  const number = phoneNumberFormatter(phone);

  await client.sendMessage(number, button)

}

/**
 * Função para criar Lista de whatsapp
 */
const sendList = async (phone, msg) => {

  const listContent = getContentTag(msg,'listContent')
  const listAction = getContentTag(msg,'listAction') || "CLique aqui"
  const listHeaderItens = getContentTag(msg,'listHeaderItens') || ""
  const lists = getContentTag(msg,'list') || ""
  const listSub = getContentTag(msg,'listSub') || ""
  const listTitle = getContentTag(msg,'listTitle') || ""
  const listFooter = getContentTag(msg,'listFooter') || ""

  const listItens = [{title:listHeaderItens,rows:[]}]
  listItens.rows = lists.map((item, index) => ({title:item, description: listSub[index]}))

  const list = await new List(listContent,listAction,listItens,listTitle,listFooter);

  const number = phoneNumberFormatter(phone);

  await client.sendMessage(number, list)
}

/**
 * Função para enviar imagem para whatsapp // TODO poderia ser Arquivo mas preciso entender melhor
 */
const sendImage = async (phone, msg) => {

  const imageUrl = getContentTag(msg,'imageUrl')
  const imageCaption = getContentTag(msg,'imageCaption') || ""

  const number = phoneNumberFormatter(phone);

  const media = await MessageMedia.fromFilePath(imageUrl);

  await client.sendMessage(number, media, { caption: imageCaption })
};

// Talvez não vamos precisar disso, mas deixa aqui - serve para remover quebra de linhas e substitui por §
const textOneLine = text => text.replace(/(\r\n|\n|\r)/gm, "§")
// Aqui faz o inverso pega tudo que tiver § e quebra linha, foi uma gambiarra que fiz rsrsrs
const textBreakLine = text => text.replace(/(§§|§|§§§)/gm, "\r\n")

client.on('message', async msg => {
  if (msg.type != "e2e_notification"){
    
    const chat = await msg.getChat()
    const contact = await msg.getContact()
    const name = contact.name || contact.pushname
    
    if (msg.body !== null){
      
      //Tempo de espera de enviando mensagem
      chat.sendStateTyping()    
      await sleep(3000)
      chat.clearState()
      
      const responseDialogFLow = `${await sendDialogFlow(msg.body, contact.number)}`

      console.log(`--------------------Nova Mensagem--------------------`);
      console.log(`Mensagem do cliente ${contact.number}: ${msg.body}`);
      console.log(`Resposta do DialogFlow: ${responseDialogFLow}`);
      console.log(typeof responseDialogFLow);
      console.log(responseDialogFLow);
      
      const responseDialogFLowOneLine = textOneLine(responseDialogFLow)

      await responseDialogFLow.includes('<imagemCreate>') ? sendImage(msg.from, responseDialogFLow) : ""
      await responseDialogFLow.includes('<text>')         ? msg.reply(msg.from, getContentTag(responseDialogFLow,'text')) : ""
      await responseDialogFLow.includes('<buttonCreate>') ? sendButton(msg.from, responseDialogFLow) : ""
      await responseDialogFLow.includes('<listCreate>')   ? sendList(msg.from, responseDialogFLow) : ""
      !responseDialogFLow.includes("</") ? msg.reply(responseDialogFLow) : ""

      console.log('FIM')
    }


  // if (msg.body !== null && msg.body.includes("Quero saber mais sobre o Método ZDG.")) {
  //   msg.reply("🤑 AUMENTE O FATURAMENTO DOS SEUS LANÇAMENTOS DISPARANDO MENSAGENS DIRETAMENTE PARA O WHATSAPP PESSOAL DE CADA LEAD, SEM PRECISAR DE CELULAR. DE FORMA AUTOMÁTICA E EM MASSA. \r\n\r\nhttps://zapdasgalaxias.com.br/ \r\n\r\n⏱️ As inscrições estão *ABERTAS*");
  // } 
  
  // else if (msg.body !== null && msg.body.includes("Gostaria de conhecer alguns estudos de caso.")) {
  //   msg.reply("*Que ótimo, vou te enviar alguns cases de sucesso:*\r\n\r\n📺 https://youtu.be/S4Cwrnn_Llk \r\nNatália: Nós aumentamos o nosso faturamento e vendemos pra mais clientes com a estratégia ZDG.\r\n\r\n📺 https://youtu.be/pu6PpNRJyoM \r\n Renato: A ZDG é um método que vai permitir você aumentar o seu faturamento em pelo menos 30%.\r\n\r\n📺 https://youtu.be/KHGchIAZ5i0 \r\nGustavo: A estratégia mais barata, eficiente e totalmente escalável.\r\n\r\n📺 https://youtu.be/XP2ns7TOdIQ \r\nYuri: A ferramenta me ajudou muito com as automações da minha loja online.\r\n\r\n📺 https://www.youtube.com/watch?v=08wzrPorZcI \r\nGabi: Implementei a estratégia sem saber nada de programação\r\n\r\n📺 https://www.youtube.com/watch?v=mHqEQp94CiE \r\nLéo: Acoplamos o Método ZDG aos nossos lançamento e otimizamos os nossos resultados.");
  // }
  
  // else if (msg.body !== null && msg.body.includes("O que vou receber entrando para a turma da ZDG?")) {
  //   msg.reply("Tudo que você vai ter acesso na Comunidade ZDG.\r\n\r\nMétodo ZDG: R$5.000,00\r\nBot gestor de grupos: R$1.500,00\r\nMulti-disparador via API: R$1.800,00\r\nWebhooks: R$5.200,00\r\nExtensão do Chrome para extração: R$150,00\r\nPacote de aulas sobre grupos de WhatsApp: R$600,00\r\nPacote de aulas + downloads para implementação dos ChatBots: R$5.000,00\r\nPacote de aulas + downloads para notificações automáticas por WhatsApp: R$4.600,00\r\n\r\nNo total, tudo deveria custar:\r\nR$ 23.850,00\r\nMas você vai pagar apenas: R$197,00");
  // }
  
  // else if (msg.body !== null && msg.body.includes("Gostaria de falar com o Pedrinho, mas obrigado por tentar me ajudar.")) {

  //       const contact = await msg.getContact();
  //       setTimeout(function() {
  //           msg.reply(`@${contact.number}` + ' seu contato já foi encaminhado para o Pedrinho');  
  //           client.sendMessage('5515998566622@c.us','Contato ZDG. https://wa.me/' + `${contact.number}`);
  //         },1000 + Math.floor(Math.random() * 1000));
  
  // }
  
  // else if (msg.body !== null && msg.body.includes("Quero aprender como montar minha API de WhatsApp de GRAÇA.")) {
  //   msg.reply("Aproveite o conteúdo e aprenda em poucos minutos como colocar sua API de WhatsAPP no ar, gratuitamente:\r\n\r\n🎥 https://youtu.be/899mKB3UHdI");
  // }
  
  // else 
  // if (msg.body !== null) {
  //   let sections = [{title:'Escolha a opção desejada',rows:[
  //     {title:'1- Quero saber mais sobre o Método ZDG.', description: 'Entre agora para nossa comunidade.'},
  //     {title:'2- Gostaria de conhecer alguns estudos de caso.', description: 'Aplique o método e colha os resultados.'},
  //     {title:'3- O que vou receber entrando para a turma da ZDG?', description: 'Mais de R$20.000,00 somente em BÔNUS.'},
  //     {title:'4- Gostaria de falar com o Pedrinho, mas obrigado por tentar me ajudar.', description: 'Clica aqui que eu transfiro pra ele.'},
  //     {title:'5- Quero aprender como montar minha API de WhatsApp de GRAÇA.', description: 'Tutorial mamão com açúcar.'}]
  //   }];
  //   let list = new List('😁 Olá, tudo bem? Como vai você? Escolha uma das opções abaixo para iniciarmos a nossa conversa:','Clique aqui',sections,'ZAP das Galáxias','© ZDG');
  //   client.sendMessage(msg.from, list);
  // }

  }
});

client.initialize();

// Socket IO
io.on('connection', function(socket) {
  socket.emit('message', 'Connecting...');

  client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', 'QR Code received, scan please!');
    });
  });

  client.on('ready', () => {
    socket.emit('ready', 'Whatsapp is ready!');
    socket.emit('message', 'Whatsapp is ready!');
  });

  client.on('authenticated', (session) => {
    socket.emit('authenticated', 'Whatsapp is authenticated!');
    socket.emit('message', 'Whatsapp is authenticated!');
    console.log('AUTHENTICATED', session);
    sessionCfg = session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function(err) {
      if (err) {
        console.error(err);
      }
    });
  });

  client.on('auth_failure', function(session) {
    socket.emit('message', 'Auth failure, restarting...');
  });

  client.on('disconnected', (reason) => {
    socket.emit('message', 'Whatsapp is disconnected!');
    fs.unlinkSync(SESSION_FILE_PATH, function(err) {
        if(err) return console.log(err);
        console.log('Session file deleted!');
    });
    client.destroy();
    client.initialize();
  });
});

/**
 * Verifica se um número possui whatsapp ou não
 * @param {string} number 
 * @returns Bolean
 */
const checkRegisteredNumber = async function(number) {
  const isRegistered = await client.isRegisteredUser(number);
  return isRegistered;
}

/**
 * EndPoint pra verificar se o número existe ou não
 * @param {array} ['558184319706', '558100112233']
 * @return Objeto
 */
app.post('/exist-number', async (req, res) => {
  const registrado = []
  const naoRegistrado = []

  for await (number of req.body) {
    await checkRegisteredNumber(number) ? registrado.push(number) : naoRegistrado.push(number);
  }

  res.send({"registrado":registrado, "naoRegistrado": naoRegistrado})
})

// Send message
app.post('/send-message', [
  body('number').notEmpty(),
  body('message').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const number = phoneNumberFormatter(req.body.number);
  const message = req.body.message;

  const isRegisteredNumber = await checkRegisteredNumber(number);

  if (!isRegisteredNumber) {
    return res.status(422).json({
      status: false,
      message: 'The number is not registered'
    });
  }

  client.sendMessage(number, message).then(response => {
    res.status(200).json({
      status: true,
      response: response
    });
  }).catch(err => {
    res.status(500).json({
      status: false,
      response: err
    });
  });
});

// Send media
app.post('/send-media', async (req, res) => {
  const number = phoneNumberFormatter(req.body.number);
  const caption = req.body.caption;
  const fileUrl = req.body.file;

  // const media = MessageMedia.fromFilePath('./image-example.png');
  // const file = req.files.file;
  // const media = new MessageMedia(file.mimetype, file.data.toString('base64'), file.name);
  let mimetype;
  const attachment = await axios.get(fileUrl, {
    responseType: 'arraybuffer'
  }).then(response => {
    mimetype = response.headers['content-type'];
    return response.data.toString('base64');
  });

  const media = new MessageMedia(mimetype, attachment, 'Media');

  client.sendMessage(number, media, {
    caption: caption
  }).then(response => {
    res.status(200).json({
      status: true,
      response: response
    });
  }).catch(err => {
    res.status(500).json({
      status: false,
      response: err
    });
  });
});

const findGroupByName = async function(name) {
  const group = await client.getChats().then(chats => {
    return chats.find(chat => 
      chat.isGroup && chat.name.toLowerCase() == name.toLowerCase()
    );
  });
  return group;
}

// Send message to group
// You can use chatID or group name, yea!
app.post('/send-group-message', [
  body('id').custom((value, { req }) => {
    if (!value && !req.body.name) {
      throw new Error('Invalid value, you can use `id` or `name`');
    }
    return true;
  }),
  body('message').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  let chatId = req.body.id;
  const groupName = req.body.name;
  const message = req.body.message;

  // Find the group by name
  if (!chatId) {
    const group = await findGroupByName(groupName);
    if (!group) {
      return res.status(422).json({
        status: false,
        message: 'No group found with name: ' + groupName
      });
    }
    chatId = group.id._serialized;
  }

  client.sendMessage(chatId, message).then(response => {
    res.status(200).json({
      status: true,
      response: response
    });
  }).catch(err => {
    res.status(500).json({
      status: false,
      response: err
    });
  });
});

// Clearing message on spesific chat
app.post('/clear-message', [
  body('number').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const number = phoneNumberFormatter(req.body.number);

  const isRegisteredNumber = await checkRegisteredNumber(number);

  if (!isRegisteredNumber) {
    return res.status(422).json({
      status: false,
      message: 'The number is not registered'
    });
  }

  const chat = await client.getChatById(number);
  
  chat.clearMessages().then(status => {
    res.status(200).json({
      status: true,
      response: status
    });
  }).catch(err => {
    res.status(500).json({
      status: false,
      response: err
    });
  })
});

// Send button
app.post('/send-button', [
  body('number').notEmpty(),
  body('buttonBody').notEmpty(),
  body('bt1').notEmpty(),
  body('bt2').notEmpty(),
  body('bt3').notEmpty(),
  body('buttonTitle').notEmpty(),
  body('buttonFooter').notEmpty()
  
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const number = phoneNumberFormatter(req.body.number);
  const buttonBody = req.body.buttonBody;
  const bt1 = req.body.bt1;
  const bt2 = req.body.bt2;
  const bt3 = req.body.bt3;
  const buttonTitle = req.body.buttonTitle;
  const buttonFooter = req.body.buttonFooter;
  const button = new Buttons(buttonBody,[{body:bt1},{body:bt2},{body:bt3}],buttonTitle,buttonFooter);

  const isRegisteredNumber = await checkRegisteredNumber(number);

  if (!isRegisteredNumber) {
    return res.status(422).json({
      status: false,
      message: 'The number is not registered'
    });
  }

  client.sendMessage(number, button).then(response => {
    res.status(200).json({
      status: true,
      response: response
    });
  }).catch(err => {
    res.status(500).json({
      status: false,
      response: err
    });
  });
});


app.post('/send-list', [
  body('number').notEmpty(),
  body('ListItem1').notEmpty(),
  body('desc1').notEmpty(),
  body('ListItem2').notEmpty(),
  body('desc2').notEmpty(),
  body('List_body').notEmpty(),
  body('btnText').notEmpty(),
  body('Title').notEmpty(),
  body('footer').notEmpty()
  
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const number = phoneNumberFormatter(req.body.number);
  const sectionTitle = req.body.sectionTitle;
  const ListItem1 = req.body.ListItem1;
  const desc1 = req.body.desc1;
  const ListItem2 = req.body.ListItem2;
  const desc2 = req.body.desc2;
  const List_body = req.body.List_body;
  const btnText = req.body.btnText;
  const Title = req.body.Title;
  const footer = req.body.footer;

  const sections = [{title:sectionTitle,rows:[{title:ListItem1, description: desc1},{title:ListItem2, description: desc2}]}];
  const list = new List(List_body,btnText,sections,Title,footer);

  const isRegisteredNumber = await checkRegisteredNumber(number);

  if (!isRegisteredNumber) {
    return res.status(422).json({
      status: false,
      message: 'The number is not registered'
    });
  }

  client.sendMessage(number, list).then(response => {
    res.status(200).json({
      status: true,
      response: response
    });
  }).catch(err => {
    res.status(500).json({
      status: false,
      response: err
    });
  });
});

server.listen(port, function() {
  console.log('App running on *: ' + port);
});
