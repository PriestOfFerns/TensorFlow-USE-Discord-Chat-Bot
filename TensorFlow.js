const { kMaxLength } = require("buffer");

const tf_min = require("@tensorflow-models/universal-sentence-encoder")
const tf = require("@tensorflow/tfjs-node")

const { Client, GatewayIntentBits, MessageType } = require('discord.js');

const fs = require("fs")


const { clientId, guildId, token } = require('./config.json');
const { meshgrid } = require("@tensorflow/tfjs-node");



const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers
	],
});








const dotProduct = (xs, ys) => {
    const sum = xs => xs ? xs.reduce((a, b) => a + b, 0) : undefined;

    return xs.length === ys.length ?
    sum(zipWith((a, b) => a * b, xs, ys))
    : undefined;
}

// zipWith :: (a -> b -> c) -> [a] -> [b] -> [c]
const zipWith =
    (f, xs, ys) => {
        const ny = ys.length;
        return (xs.length <= ny ? xs : xs.slice(0, ny))
        .map((x, i) => f(x, ys[i]));
}


let busy = false
let queue = []

async function GenerateReply(msg) {
    const content = msg.content.slice(8, msg.content.length)
    

    let reply = await Reply(content).catch(async err=>{
        console.log(err)
        

    })
    
    if (reply == null || reply.trim().length === 0) {
        msg.reply("Error 420: sent empty string")
        
    } else {
        msg.reply(reply).catch(err=>console.log(err))
    }
    
}


client.on("messageCreate", async msg => {
  
   
    if ( msg.content.slice(0, 7) == "FT/Talk" && msg.content.length > 0) {
        
        if (busy == false) {
            busy = true
            
            await GenerateReply(msg)

            if (queue.length > 0) {
                queue.forEach(async m => {
                    
                    await GenerateReply(m)
                    
                })
                queue = []
            }
            busy = false
           
        } else if (busy == true) {
            const content = msg.content.slice(8, 15)
            queue.push(msg)
            console.log("pushed "+content+" into queue")

           
        }

    } else if (msg.content.startsWith("FT/Relearn")) {
        if (msg.type == MessageType.Reply) {
            const main = msg.content.slice(11,msg.content.length)
            const repliedTo = await msg.channel.messages.fetch(msg.reference.messageId);

            if (repliedTo.author.bot == true) {
            
            
                const OG = await msg.channel.messages.fetch(repliedTo.reference.messageId);

                let oldJs = JSON.parse( fs.readFileSync("Data.json") )
                const input = OG.content.slice(8, OG.content.length)
                oldJs.push([input,main])
               
               fs.writeFileSync("Data.json",JSON.stringify( oldJs) )
               msg.reply("Success, I relearned")
            }
        }

    } else if (msg.content=="FT/Unlearn" && msg.type == MessageType.Reply) {
        const OG = await msg.channel.messages.fetch(msg.reference.messageId);
        if (OG.author.bot == true) {
            

            let oldJs = JSON.parse( fs.readFileSync("Data.json") )


            const found = oldJs.findIndex(elm=>elm[1]==OG.content)

            if (found != -1) {
               
                const deleted = oldJs[found][0]
                oldJs.splice(found,1)
                
                fs.writeFileSync("Data.json",JSON.stringify( oldJs) )
                msg.reply("Deleted element "+found+" which is '"+ deleted + "'")
            }
            
        }
    }
    
    else if (msg.content == "FT/GJ") {
        if (msg.type == MessageType.Reply) {
                       
            const repliedTo = await msg.channel.messages.fetch(msg.reference.messageId);

            if (repliedTo.author.bot == true) {
                msg.reply("Thank you, I will emphasis learning this")


                const OG = await msg.channel.messages.fetch(repliedTo.reference.messageId);


                let oldJs = JSON.parse( fs.readFileSync("Data.json") )
                oldJs.push([OG.content,repliedTo.content])
               
               fs.writeFileSync("Data.json",JSON.stringify( oldJs) )
            }
        }
    } 
    
    
    else if (msg.author.bot == false&&msg.content.slice(0, 7) != "FT/Talk") {
        let Add
        if (msg.type == MessageType.Reply) {
                       
            const repliedTo = await msg.channel.messages.fetch(msg.reference.messageId);
            if (repliedTo.author != msg.author) {
                Add = repliedTo.content
            }
            
      
            
        } else {
            await msg.channel.messages.fetch({ limit: 2 }).then(messages => { 
               const last = messages.last()
               
               if (((new Date().getTime() - last.createdTimestamp) / 60000 )< 5 && last.author != msg.author) {
                    Add = last.content
                   
              
              }
            })
        }
       
        if (Add != null) {
           
            let oldJs = JSON.parse( fs.readFileSync("Data.json") )
             oldJs.push([Add,msg.content])
            
            fs.writeFileSync("Data.json",JSON.stringify( oldJs) )
        }
        
    }
})


client.once('ready', () => {
    console.log('Ready!');
    

  
});






async function Reply(text) {

    const data = JSON.parse( fs.readFileSync("Data.json") )
    let questions = data.map( qa => qa[0] );
    
    

   
    const model = await tf_min.loadQnA();
   


    
 

    const input = {
        queries: [ text ],
        responses: questions
    };
    // console.log( input );
    let embeddings = await model.embed( input );
    let answer
    tf.tidy( () => {
        const embed_query = embeddings[ "queryEmbedding" ].arraySync();
        const embed_responses = embeddings[ "responseEmbedding" ].arraySync();
        let scores = [];
        embed_responses.forEach( response => {
            scores.push( dotProduct( embed_query[ 0 ], response ) );
        });
        // Get the index of the highest value in the prediction
        let id = scores.indexOf( Math.max( ...scores ) );
        answer = data[ id ][1];
    });
    embeddings.queryEmbedding.dispose();
    embeddings.responseEmbedding.dispose();
    return answer
   
}

async function Test(inp) {
    const ret = await Reply(inp)
    console.log(ret)
}

Test("Hello")


client.login(token);

