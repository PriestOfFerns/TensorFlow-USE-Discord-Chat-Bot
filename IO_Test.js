






const { Client, GatewayIntentBits, MessageType, EmbedBuilder  } = require('discord.js');
const brain = require("brain.js")
const fs = require("fs")

const net = new brain.recurrent.LSTM();





const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
});
const { clientId, guildId, token } = require('./config.json');
const { table } = require('console');

client.once('ready', () => {
    console.log('Ready!');
    

    const BrainData = JSON.parse(fs.readFileSync("Brain.json"))
   
    if (BrainData.length > 0) {
        net.fromJSON(BrainData)
    }
    
    Train()
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'talk') {
        

        await interaction.deferReply() ;
        const reply = await net.run();
        console.log("Reply is: "+reply);
        interaction.editReply(reply);
    } else {
        await interaction.reply('Invalid command name, amigo!');
    }
});


const limit = 10

client.on("messageCreate", async msg => {
    if (msg.content == "FT/Train") {
       Train(msg)
    }

    else if (msg.content.slice(0, 7) == "FT/Talk" && msg.content.length > 0) {

        const content = msg.content.slice(8, 15)
        console.time("Generating Message: ")
        const reply = await net.run(content)
        console.timeEnd("Generating Message: ")
        if (reply != "" && reply !=" ") {
            msg.reply(reply)
        } else {
  
            const emb = new EmbedBuilder()
                .setColor(800020)
                .setTitle('I am idot')
                .setDescription("I am an idiot, and sent an empty message")


            msg.reply({embeds: [emb]})
        }
        

    } else if (msg.author.bot == false) {
        let Input
        let Output

        if (msg.type == MessageType.Reply) {
            const repliedTo = await msg.channel.messages.fetch(msg.reference.messageId);

            if (repliedTo) {
                Input = repliedTo.content
                Output = msg.content
            }

        } else {


            const messages = await msg.channel.messages.fetch({ limit: 2 })
            let lastMessage = messages.first(2)[1];

            if (lastMessage.content != "FT/Train" && lastMessage.content.slice(0, 7) != "FT/Talk") {

                const diff = (new Date().getTime() - lastMessage.createdTimestamp) / 60000;


                if (!lastMessage.author.bot && diff < limit) {
                    Input = lastMessage.content
                    Output = msg.content
                }

            }
        }


        if (Input && Output) {
            const json = JSON.parse(fs.readFileSync("Data.json"));
            json.push({ input: Input, output: Output })
            fs.writeFileSync("Data.json", JSON.stringify(json));
        }
    }

})

let etaCalc = 0.8
async function Train(msg) {
   

    const trainingData = JSON.parse(fs.readFileSync("Data.json"));
    console.log(trainingData.length)
    if (trainingData.length > 0) {

        let channel = await client.channels.fetch("999378542758469723");
        if (msg) {
            channel = msg.channel
        } 
        
        const emb = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Am Training')
            .setDescription("AM GOING TO TRAIN ON "+(trainingData.length).toString()+" ENTRIES; ETA IS "+(Math.floor((trainingData.length*etaCalc*10))/10).toString()+" MINUTES")
          
  


        const message = await channel.send({embeds: [emb]})

        fs.writeFileSync("Data.json", "[]")

        const Date1 =   Date.now()

        net.train(trainingData);
       
        const json = net.toJSON();
        fs.writeFileSync("Brain.json", JSON.stringify(json));

        const Diff =  (Date.now()-Date1)/1000/60
        etaCalc = Diff/trainingData.length

       

        const emb2 = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Training Done')
            .setDescription("AM DONE TRAINING, POGGERS")
            .setFields(	
                { name: 'It took', value: (Diff).toString()+" Minutes" },
                { name: 'New etaCalc is', value: (etaCalc).toString()+" Minutes Per Entry" },)
        
        channel.send({embeds: [emb2]})
    }
    
}


setTimeout(Train, 1000 * 60 * 30)

client.login(token);

