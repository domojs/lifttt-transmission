module.exports={
    name:"transmission", 
    "triggers":
    [
        {
            name:"download-completed",
            fields:[
                {name:"url", displayName:"the url to the transmission web ui"},
                {name:"userName", displayName:"the user name"},
                {name:"password", displayName:"the password"}, 
                {name:"frequency", displayName:"The number of milliseconds to run it"},
                {name:"initDate", displayName:"ticks of the date you would like to initialize the last retrieve"}
            ],
            when:function(fields,callback){
                var sessionId='';
                var lastDate=new Date(fields.initDate);
                function getTorrents(auth, sess, last){
                    var settings={dataType:'json', contentType:'json', headers:{'X-Transmission-Session-Id':sessionId || sess }, data:{
                        "arguments": { "fields": [ "id", "name", "files", "doneDate" ] },
                        "method": "torrent-get",
                        "tag": Math.ceil(Math.random()*10000)
                        }, success:function(data){
                            $.each(data.arguments.torrents, function(index, item){
                                if(new Date(item.doneDate*1000)>(lastDate || last))
                                {
                                    $.eachAsync(item.files, function(index, file, next){
                                        var result={name:file.name, folder:file.name.substring(0,file.name.lastIndexOf('/'))};
                                        callback(result, next);
                                    });
                                }
                                else
                                    console.log(item.id+' is not new');
                            });
                            lastDate=new Date();
                        }, error:function(data, responseCode, res){
                            console.log('errorCode '+responseCode);
                            if(responseCode==409){
                                sessionId=res.headers['x-transmission-session-id'];
                                getTorrents(true,sessionId || sess, lastDate || last);
                            }
                            if(responseCode==401){
                                sessionId=res.headers['x-transmission-session-id'];
                                getTorrents(true, sessionId || sess, lastDate || last);
                            }
                        }};
                    if(auth && fields.userName && fields.password)
                    {
                        settings.auth=fields.userName+':'+fields.password;
                    }
                    $.ajax(fields.url, settings);
                };
                
                var interval=setInterval(function(){ getTorrents(false,sessionId, lastDate); },fields.frequency*1000);
                process.on('exit', function(){
                    clearInterval(interval);
                });
            }
        }
    ],
    "actions":
    [
    ]
};