var utils      = require("./util"),
    bodyParser = require("body-parser"),
    path       = require("path"),
    fs         = require("fs"),
    Promise    = require("promise"),
    Entities   = require('html-entities').AllHtmlEntities;
const entities = new Entities();
var isRootCAFileExists = require("./certMgr.js").isRootCAFileExists(),
    interceptFlag      = false,
    wxOfficialAccountHistory = path.join(process.env['USERPROFILE'], "Downloads", "wxOfficialAccountHistory.html"),
    pageNumber = 0;

//e.g. [ { keyword: 'aaa', local: '/Users/Stella/061739.pdf' } ]
var mapConfig = [],
    configFile = "mapConfig.json";
function saveMapConfig(content,cb){
    new Promise(function(resolve,reject){
        var anyproxyHome = utils.getAnyProxyHome(),
            mapCfgPath   = path.join(anyproxyHome,configFile);

        if(typeof content == "object"){
            content = JSON.stringify(content);
        }
        resolve({
            path    :mapCfgPath,
            content :content
        });
    })
    .then(function(config){
        return new Promise(function(resolve,reject){
            fs.writeFile(config.path, config.content, function(e){
                if(e){
                    reject(e);
                }else{
                    resolve();
                }
            });
        });
    })
    .catch(function(e){
        cb && cb(e);
    })
    .done(function(){
        cb && cb();
    });
}
function getMapConfig(cb){
    var read = Promise.denodeify(fs.readFile);

    new Promise(function(resolve,reject){
        var anyproxyHome = utils.getAnyProxyHome(),
            mapCfgPath   = path.join(anyproxyHome,configFile);

        resolve(mapCfgPath);
    })
    .then(read)
    .then(function(content){
        return JSON.parse(content);
    })
    .catch(function(e){
        cb && cb(e);
    })
    .done(function(obj){
        cb && cb(null,obj);
    });
}

setTimeout(function(){
    //load saved config file
    getMapConfig(function(err,result){
        if(result){
            mapConfig = result;
        }
    });
},1000);


module.exports = {
    token: Date.now(),
    summary:function(){
        var tip = "the default rule for AnyProxy.";
        if(!isRootCAFileExists){
            tip += "\nRoot CA does not exist, will not intercept any https requests.";
        }
        return tip;
    },

    shouldUseLocalResponse : function(req,reqBody){
        //intercept all options request
        var simpleUrl = (req.headers.host || "") + (req.url || "");
        mapConfig.map(function(item){
            var key = item.keyword;
            if(simpleUrl.indexOf(key) >= 0){
                req.anyproxy_map_local = item.local;
                return false;
            }
        });


        return !!req.anyproxy_map_local;
    },

    dealLocalResponse : function(req,reqBody,callback){
        if(req.anyproxy_map_local){
            fs.readFile(req.anyproxy_map_local,function(err,buffer){
                if(err){
                    callback(200, {}, "[AnyProxy failed to load local file] " + err);
                }else{
                    var header = {
                        'Content-Type': utils.contentType(req.anyproxy_map_local)
                    };
                    callback(200, header, buffer);
                }
            });
        }
    },

    replaceRequestProtocol:function(req,protocol){
    },

    replaceRequestOption : function(req,option){
    },

    replaceRequestData: function(req,data){
    },

    replaceResponseStatusCode: function(req,res,statusCode){
    },

    replaceResponseHeader: function(req,res,header){
    },

    // Deprecated
    // replaceServerResData: function(req,res,serverResData){
    //     return serverResData;
    // },

    replaceServerResDataAsync: function (req, res, serverResData, callback) {
        var reqUrl = req.url;
        if (/mp\/getmasssendmsg/i.test(reqUrl)) { // 1st flavor
            try {
                if (res.statusCode === 200) { // should ignore 302
                    pageNumber = 0; // reset page number.
                    saveUrls(/msgList = (.*?);/.exec(entities.decode(serverResData.toString()))[1]);
                } else {
                    console.log("Unexpected status code: " + res.statusCode)
                }
            } catch (e) {
                console.log(e);
                try {
                    var json = JSON.parse(serverResData.toString());
                    if (json.general_msg_list != []) {
                        saveUrls(json.general_msg_list);
                    }
                } catch (e) {
                    console.log(e);
                }
            }
        } else if (/mp\/profile_ext\?action=home.*&devicetype=/i.test(reqUrl)) {  // 2nd flavor: the home action
            try {
                if (res.statusCode === 200) {
                    pageNumber = 0; // reset page number.
                    serverResp = entities.decode(serverResData.toString()).replace(/\\/g, "");  // strip "\" in URL.
                    wxOfficialAccountHistory = path.join(process.env['USERPROFILE'], "Downloads", /var nickname = \"(.*?)\"/.exec(serverResp)[1] + ".html");
                    saveUrls(/var msgList = \'(.*?)\';/.exec(serverResp)[1]);
                } else {
                    console.log("Unexpected status code: " + res.statusCode)
                }
            } catch (e) {
                console.log(e);
            }
        } else if (/mp\/profile_ext\?action=getmsg/i.test(reqUrl)) { // 2nd flavor: the getmsg action
            try {
                var json = JSON.parse(serverResData.toString());
                if (json.general_msg_list != []) {
                    saveUrls(json.general_msg_list);
                }
            } catch (e) {
                console.log(e);
            }
        } else if (/profile\?src=/i.test(reqUrl)) { // 3nd floavor: via sogou profile API
            try {
                pageNumber = 0; // reset page number.
                saveUrls(/var msgList = (.*?);/.exec(entities.decode(serverResData.toString()))[1]);
            } catch (e) {
                console.log(e);
            }
        }
        callback(serverResData);
    },

    pauseBeforeSendingResponse: function(req,res){
    },

    shouldInterceptHttpsReq:function(req){
        return interceptFlag;
    },

    //[beta]
    //fetch entire traffic data
    fetchTrafficData: function(id,info){},

    setInterceptFlag: function(flag){
        interceptFlag = flag && isRootCAFileExists;
    },

    _plugIntoWebinterface: function(app,cb){

        app.get("/filetree",function(req,res){
            try{
                var root = req.query.root || utils.getUserHome() || "/";
                utils.filewalker(root,function(err, info){
                    res.json(info);
                });
            }catch(e){
                res.end(e);
            }
        });

        app.use(bodyParser.json());
        app.get("/getMapConfig",function(req,res){
            res.json(mapConfig);
        });
        app.post("/setMapConfig",function(req,res){
            mapConfig = req.body;
            res.json(mapConfig);

            saveMapConfig(mapConfig);
        });

        cb();
    },

    _getCustomMenu : function(){
        return [
            // {
            //     name:"test",
            //     icon:"uk-icon-lemon-o",
            //     url :"http://anyproxy.io"
            // }
        ];
    }
};

function saveUrls(urls) {    // Save content_urls in msgList (JSON) to file.
    var appMsg = JSON.parse(urls).list, msgExt, msgInfo, msgLength = appMsg.length, page = ++pageNumber;
    var outputDiv = '<div class="div-' + page + '">\r\n';
    var realDate, strHour, strMin, strSec, realTitle, realPermanentUrl, realDigest, innerList, innerListLength;
    for (i = 0; i<msgLength; i++) {
        msgExt = appMsg[i].app_msg_ext_info;
        if (undefined === msgExt) continue; // should be pure image or text rather than articles. e.g., image_msg_ext_info
        realTitle        = msgExt.title;
        realDigest       = msgExt.digest;
        realPermanentUrl = msgExt.content_url;
        if (realPermanentUrl.length > 0) { // sometimes, it is empty in this level.
            if (realPermanentUrl.indexOf("http") !== 0) {
                realPermanentUrl = "https://mp.weixin.qq.com" + realPermanentUrl;
            }
            realDate = new Date(appMsg[i].comm_msg_info.datetime * 1000);
            strHour = realDate.getHours();
            if (strHour < 10) {
                strHour = "0" + strHour; // prepend "0" to be fixed length hour string
            }
            strMin = realDate.getMinutes();
            if (strMin < 10) {
                strMin = "0" + strMin;
            }
            strSec = realDate.getSeconds();
            if (strSec < 10) {
                strSec = "0" + strSec;
            }
            strDate = realDate.getFullYear() + "-" + (realDate.getMonth()+1) + "-" + realDate.getDate() + " " + strHour + ":" + strMin + ":" + strSec;
            outputDiv += strDate + '&emsp;<a class="top-' + page + ' gen-' + page + '" target="_blank" href="' + realPermanentUrl + '">' + realTitle + '</a>&emsp;' + realDigest + '<br>\r\n';
        }

        innerList = msgExt.multi_app_msg_item_list;
        innerListLength = innerList.length;
        for (j = 0; j<innerListLength; j++) {
            msgExt = innerList[j];
            realTitle        = msgExt.title;
            realDigest       = msgExt.digest;
            realPermanentUrl = msgExt.content_url;
            if (realPermanentUrl.length > 0) { // sometimes, it is empty in this level.
                if (realPermanentUrl.indexOf("http") !== 0) {
                    realPermanentUrl = "https://mp.weixin.qq.com" + realPermanentUrl;
                }
                outputDiv += strDate + '&emsp;<a class="ext-' + page + ' gen-' + page + '" target="_blank" href="' + realPermanentUrl + '">' + realTitle + '</a>&emsp;' + realDigest + '<br>\r\n';
            }
        }
    }

    console.log("Writing to " + wxOfficialAccountHistory + " ...");
    // console.trace("Who is calling me, let's have a look:")
    fs.writeFile(wxOfficialAccountHistory, outputDiv + '</div>\r\n', {flag: "a"}, (err) => {
        if (err) throw err;
    });
    console.log("Written.")
}