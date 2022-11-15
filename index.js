const { Client, GatewayIntentBits } = require('discord.js');
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

    //net.fromJSON(JSON.parse(fs.readFileSync("Brain.json")))
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'talk') {
        await interaction.reply('Invalid command, amigo!');

        //await interaction.deferReply() ;
        //const reply = await net.run();
        //console.log("Reply is: "+reply);
        //interaction.editReply(reply);
    } else {
        await interaction.reply('Invalid command name, amigo!');
    }
});

client.on("messageCreate", msg => {



    console.log(msg.content)


    if (msg.content == "FT/Talk") {
        console.time("Generating Message: ")
        const reply =  net.run();
        console.log("REPLY IS: "+reply )
        if (reply && reply !== "") {
            msg.reply(reply)
        }
       
        console.timeEnd("Generating Message: ")
    }else{
        
        const json = JSON.parse(fs.readFileSync("Data.json"));
        json.push(msg.content)
        fs.writeFileSync("Data.json",JSON.stringify(json));
    }
})

function Train() {
    const trainingData = JSON.parse(fs.readFileSync("Data.json"));
    console.log(trainingData.length)
    if (trainingData.length > 0) {
        fs.writeFileSync("Data.json",JSON.stringify([]))

        console.time("Training on message: ");
        net.train(trainingData);
        console.timeEnd("Training on message: ");
        const json = net.toJSON();
        fs.writeFileSync("Brain.json",JSON.stringify(json));
    }

}

Train()
setTimeout(Train,60000)

client.login(token);

 