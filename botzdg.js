const { Client, List, Buttons, MessageMedia, Contact, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
// const qrcode = require('qrcode');
const qrcode = require('qrcode-terminal');
const http = require('http');
const https = require('https');
const fileUpload = require('express-fileupload');
const axios = require('axios');
const mime = require('mime-types');
const port = process.env.PORT || 3019;
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const httpAgent = new http.Agent({keepAlive: true});
const httpsAgent = new https.Agent({keepAlive: true});

app.use(express.json());
app.use(express.urlencoded({
extended: true
}));
app.use(fileUpload({
debug: true
}));
app.use("/", express.static(__dirname + "/"))

// app.get('/', (req, res) => {
//   res.sendFile('index.html', {
//     root: __dirname
//   });
// });

const client = new Client({
  // authStrategy: new LocalAuth({ clientId: 'bot-zdg' }),
  puppeteer: { headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- this one doesn't works in Windows
      '--disable-gpu'
    ] }
});

client.initialize();

client.on('qr', (qr) => {
    qrcode.generate(qr, {small: true});
    console.log('zapdasgalaxias.com.br BOT-ZDG QRCode recebido', qr);
});

client.on('authenticated', () => {
    console.log('zapdasgalaxias.com.br BOT-ZDG Autenticado');
});

client.on('auth_failure', msg => {
    console.error('zapdasgalaxias.com.br BOT-ZDG Falha na autenticação', msg);
});

client.on('ready', () => {
    console.log('zapdasgalaxias.com.br BOT-ZDG Dispositivo pronto');
});

client.on('change_state', state => {
    console.log('zapdasgalaxias.com.br BOT-ZDG Status de conexão: ', state );
});

client.on('disconnected', (reason) => {
    console.log('zapdasgalaxias.com.br BOT-ZDG Cliente desconectado', reason);
});

// Send message
app.post('/zdg-message', [
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

  const number = req.body.number;
  const numberDDI = number.substr(0, 2);
  const numberDDD = number.substr(2, 2);
  const numberUser = number.substr(-8, 8);
  const message = req.body.message;

  if (numberDDI !== "55") {
    const numberZDG = number + "@c.us";
    client.sendMessage(numberZDG, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-ZDG Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-ZDG Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
    const numberZDG = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(numberZDG, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-ZDG Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-ZDG Mensagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
    const numberZDG = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(numberZDG, message).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-ZDG Mensagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-ZDG Mensagem não enviada',
      response: err.text
    });
    });
  }
});


// Send media
app.post('/zdg-media', [
  body('number').notEmpty(),
  body('caption').notEmpty(),
  body('file').notEmpty(),
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

  const number = req.body.number;
  const numberDDI = number.substr(0, 2);
  const numberDDD = number.substr(2, 2);
  const numberUser = number.substr(-8, 8);
  const caption = req.body.caption;
  const fileUrl = req.body.file;

  let mimetype;
  const attachment = await axios.get(fileUrl, {
    responseType: 'arraybuffer'
  }).then(response => {
    mimetype = response.headers['content-type'];
    return response.data.toString('base64');
  });

  const media = new MessageMedia(mimetype, attachment, 'Media');

  if (numberDDI !== "55") {
    const numberZDG = number + "@c.us";
    client.sendMessage(numberZDG, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-ZDG Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-ZDG Imagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
    const numberZDG = "55" + numberDDD + "9" + numberUser + "@c.us";
    client.sendMessage(numberZDG, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-ZDG Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-ZDG Imagem não enviada',
      response: err.text
    });
    });
  }
  else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
    const numberZDG = "55" + numberDDD + numberUser + "@c.us";
    client.sendMessage(numberZDG, media, {caption: caption}).then(response => {
    res.status(200).json({
      status: true,
      message: 'BOT-ZDG Imagem enviada',
      response: response
    });
    }).catch(err => {
    res.status(500).json({
      status: false,
      message: 'BOT-ZDG Imagem não enviada',
      response: err.text
    });
    });
  }
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
    console.log("Checando numero: "+number)
    if(number)
      await checkRegisteredNumber(number) ? registrado.push(number) : naoRegistrado.push(number);
    else
      naoRegistrado.push(number)
  }
  res.send({"registrado":registrado, "naoRegistrado": naoRegistrado})
})

const phoneNumberFormatter = number => {
  number = number.split('@')[0]
  pais = number.substr(0,2)
  ddd = number.substr(2,2)
  numero = number.substr(-8,8)

  return ddd.toString() <= '30' ? `55${ddd}9${numero}@c.us` : `55${ddd}${numero}@c.us`;
}

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
  
  const resp = await axios.post('http://10.0.3.123:3030/text_query', body, { httpAgent })
  
  return resp.data

}

const requestGET = async (phone, msg) => {

  const urlGet = getContentTag(msg,'GET')

  const number = phoneNumberFormatter(phone);

  
  const message = await axios.get(urlGet);

  console.log(message)
  console.log(message.data)

  console.log("Enviando GET", new Date())
  await client.sendMessage(number, message.data)

}

const requestPOST = async (phone, msg) => {

  const urlPost = getContentTag(msg,'POST')
  const dataPost = getContentTag(msg,'POSTDATA')

  const number = phoneNumberFormatter(phone);

  const message = await axios.post(urlPost, dataPost);
  
  console.log(message)
  console.log(message.data)

  console.log("Enviando POST", new Date())
  await client.sendMessage(number, message.data)

}

/**
 * Função para criar botão de whatsapp
 */
const sendButton = async (phone, msg) => {

  const buttonContent = getContentTag(msg,'buttonContent')
  const buttonTitle = getContentTag(msg,'buttonTitle') || ""
  const buttonFooter = getContentTag(msg,'buttonFooter') || ""
  const buttons = getContentTag(msg,'button') || ""

  const listButtons = typeof buttons != 'string' ? buttons.map(item => ({body:item})) : [{body:buttons}]

  const button = new Buttons(buttonContent,listButtons,buttonTitle,buttonFooter);

  const number = phoneNumberFormatter(phone);
  console.log("Enviando Botão", new Date())
  
  await client.sendMessage(number, button)

}

/**
 * Função para criar Lista de whatsapp
 */
const sendList = async (phone, msg) => {

  const listContent = getContentTag(msg,'listContent')
  const listAction = getContentTag(msg,'listAction') || "Clique aqui"
  const listHeaderItens = getContentTag(msg,'listHeaderItens') || ""
  const lists = getContentTag(msg,'list') || ""
  const listSub = getContentTag(msg,'listSub') || false
  const listTitle = getContentTag(msg,'listTitle') || ""
  const listFooter = getContentTag(msg,'listFooter') || ""

  const listItens = [{title:listHeaderItens, rows:[]}]

  listItens[0].rows = typeof lists != 'string' ? lists.map((item, index) => ({title:item, description: listSub[index] || ""})) : [{title:lists, description: listSub[0] || ""}]
  console.log(listContent)
  console.log(listAction)
  console.log(listItens)
  console.log(listTitle)
  console.log(listFooter)
  const list = new List(listContent,listAction,listItens,listTitle,listFooter);

  const number = phoneNumberFormatter(phone);
  console.log("Enviando Lista", new Date())
  await client.sendMessage(number, list)
}

/**
 * Função para enviar imagem para whatsapp // TODO poderia ser Arquivo mas preciso entender melhor
 */
const sendImage = async (phone, msg) => {

  const imageUrl = getContentTag(msg,'imageUrl')
  const imageCaption = getContentTag(msg,'imageCaption') || ""

  const number = phoneNumberFormatter(phone);

  const media = MessageMedia.fromFilePath(imageUrl);
  console.log("Enviando imagem", new Date())
  await client.sendMessage(number, media, { caption: imageCaption })
};

// Talvez não vamos precisar disso, mas deixa aqui - serve para remover quebra de linhas e substitui por §
const textOneLine = text => text.replace(/(\r\n|\n|\r)/gm, "§")
// Aqui faz o inverso pega tudo que tiver § e quebra linha, foi uma gambiarra que fiz rsrsrs
const textBreakLine = text => text.replace(/(§§|§|§§§)/gm, "\r\n")

client.on('message', async msg => {
  if (msg.body == '!ping') {
    msg.reply('pong');
  }
  if (msg.type != "e2e_notification" || msg.type != "call_log"){
    console.log(msg.body)
    
    const chat = await msg.getChat()
    const contact = await msg.getContact()
    const name = contact.name || contact.pushname
    
    console.log("============== CONTACT ===================")
    console.log(msg)
    console.log("============== CONTACT ===================")
    console.log(contact)
    console.log("================ CHAT ====================")
    console.log(chat)
    if (msg.body !== null){
      
      //Tempo de espera de enviando mensagem
      chat.sendStateTyping()    
      await sleep(3000)
      chat.clearState()
      
      const responseDialogFLow = `${await sendDialogFlow(msg.body, contact.number)}`
      console.log(responseDialogFLow)
      console.log(`--------------------Nova Mensagem--------------------`);
      console.log(`Mensagem do cliente ${contact.number}: ${msg.body}`);
      console.log(`Resposta do DialogFlow: ${responseDialogFLow}`);
      
      const responseDialogFLowOneLine = textOneLine(responseDialogFLow)

      responseDialogFLow.includes('<imagemCreate>') ? await sendImage(msg.from, responseDialogFLow) : "";
      responseDialogFLow.includes('<text>')         ? msg.reply(msg.from, getContentTag(responseDialogFLow,'text')) : ""
      responseDialogFLow.includes('<buttonCreate>') ? await sendButton(msg.from, responseDialogFLow) : ""
      responseDialogFLow.includes('<listCreate>')   ? await sendList(msg.from, responseDialogFLow) : ""
      responseDialogFLow.includes('<GET>')   ? await requestGET(msg.from, responseDialogFLow) : ""
      responseDialogFLow.includes('<POST>')   ? await requestPOST(msg.from, responseDialogFLow) : ""
      !responseDialogFLow.includes("</") ? await client.sendMessage(msg.from, responseDialogFLow) : ""

      console.log('FIM')
    }
  }
});
// ----------------- FIM IMPLEMENTAÇÂO ---------------------

    
server.listen(port, function() {
        console.log('App running on *: ' + port);
});
