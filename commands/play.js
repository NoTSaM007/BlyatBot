const ytdlc = require ("ytdl-core");
const Discord = require("discord.js");


async function play(connection, message, bot) {
    var server = servers[message.guild.id];
    var video;

    nowPlaying[message.guild.id] = server.queue.shift();
    video = await ytdlc.getInfo(nowPlaying[message.guild.id]);

    var iconurl = bot.user.avatarURL;
    var embed = new Discord.RichEmbed()
        .setAuthor("BlyatBot", iconurl)
        .setColor([255, 0, 0])
        .setDescription("**Spielt gerade:**\n" +
        video.title)
        .setThumbnail(video.thumbnail_url.replace("default.jpg", "hqdefault.jpg"))
        //.setThumbnail(video.thumbnail_url.replace("default.jpg", "hqdefault.jpg"))
    message.channel.send(embed); // This sends a message of the current music playing

    server.dispatcher = connection.playStream(ytdlc(nowPlaying[message.guild.id], { filter: "audioonly" })); // This will stream only the audio part of the video.
    if (volume[message.guild.id]) // This checks if the users have set a volume
        server.dispatcher.setVolume(volume[message.guild.id]); // This sets the volume of the stream

    server.dispatcher.on("end", function () {
        nowPlaying[message.guild.id] = null;
        if (server.queue.length > 0){
            play(connection, message, bot);
        }
        else {
            connection.disconnect();
            server.dispatcher = null;
        }
    });
}

module.exports.run = async (bot, message, args) => {
    var iconurl = bot.user.avatarURL;

    if (!args[0]) {
        var embed = new Discord.RichEmbed()
            .setAuthor("BlyatBot", iconurl)
            .setColor([255, 0, 0])
            .setDescription(`**Verwendung**: blyat play <link>`)
                message.channel.send(embed);
                return;
            }
    if (!message.member.voiceChannel) {
        message.channel.send("Blyat, ich kann keine Musik spielen, wenn du nicht in einem VoicChannel bist!");
        return;
     }
    if (!servers[message.guild.id])
        servers[message.guild.id] = {
            queue: []
        };

    var server = servers[message.guild.id];
    server.queue.push(args[0]);
    if (server.dispatcher) {
        if (server.queue.length > 0) {
            var title = await ytdlc.getInfo(args[0]);
            var embed = new Discord.RichEmbed()
                .setAuthor("BlyatBot", iconurl)
                .setColor([255, 0, 0])
                .setDescription(`**Zur Liste hinzugefügt:**\n` +
                    title.title)
                .setThumbnail(title.thumbnail_url.replace("default.jpg", "hqdefault.jpg"))
            message.channel.send(embed);
        }
    }

    if (!message.guild.voiceConnection)
        message.member.voiceChannel.join().then(function (connection) {
            if (!server.dispatcher)
                play(connection, message, bot);
                })
            else {
                if (!server.dispatcher)
                    play(message.guild.voiceConnection, message, bot);
            }
}
module.exports.help = {
    name: "play"
}