const { Client, GatewayIntentBits, MessageType } = require('discord.js');

const { clientId, guildId, token } = require('./config.json');

const fs = require("fs")

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers
	],
});


client.login(token);


client.once('ready', () => {
    console.log('Ready!');
    

  
});




client.on("messageCreate", async msg => { 
   
    if (msg.content.startsWith("FT/Train")) {
        const count =  Number(msg.content.slice(9,msg.content.length))

        if (count && count <= 100) {
            const channel = msg.channel
            let Array = []
            channel.messages.fetch({ limit: count }).then(messages => {
                
                messages.forEach(async m => {
                    if (m.type == MessageType.Reply) {
                       
                        const repliedTo = await channel.messages.fetch(m.reference.messageId);


                        Array.push([repliedTo.content,m.content])
                        console.log(Array)
                    }

                })
              }).then(()=>{


                const send = JSON.stringify(Array)
              
                fs.writeFileSync("Data.json",send)
              })
           
             
        } else if (count) {
            msg.reply("Count should be less than 100")
        }
        
    }



})