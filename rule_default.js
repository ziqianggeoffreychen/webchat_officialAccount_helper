'use strict';
require('console-stamp')(console, 'HH:MM:ss.l');
var path       = require("path"),
    fs         = require("fs"),
    Entities   = require('html-entities').AllHtmlEntities;
const entities = new Entities();
var wxOfficialAccountHistory = path.join(process.env['USERPROFILE'], "Downloads", "wxOfficialAccountHistory.html"),
    wxPullHistory            = path.join(process.env['USERPROFILE'], "OneDrive - Ericsson AB", "_articles-to-read", "wechat_pull_history.log"),
    pageNumber = 0;

module.exports = {

  summary: 'the default rule for AnyProxy',

  /**
   *
   *
   * @param {object} requestDetail
   * @param {string} requestDetail.protocol
   * @param {object} requestDetail.requestOptions
   * @param {object} requestDetail.requestData
   * @param {object} requestDetail.response
   * @param {number} requestDetail.response.statusCode
   * @param {object} requestDetail.response.header
   * @param {buffer} requestDetail.response.body
   * @returns
   */
  *beforeSendRequest(requestDetail) {
    return null;
  },


  /**
   *
   *
   * @param {object} requestDetail
   * @param {object} responseDetail
   */
  *beforeSendResponse(requestDetail, responseDetail) {
    var reqUrl = requestDetail.url,
        res = responseDetail.response,
        serverResData = responseDetail.response.body.toString();
    if (/"ad":.*"errCode":/.test(serverResData)) {
        var respWithoutAd = Object.assign({}, responseDetail.response);
        respWithoutAd.body = serverResData.replace(/"ad":.*"errCode":/, '"ad":"{}","errCode":');
        console.log("Ads: terminated!");
        return {response: respWithoutAd};
    }
    if (/mp\/getmasssendmsg/i.test(reqUrl)) { // 1st flavor
        try {
            if (res.statusCode === 200) { // should ignore 302
                pageNumber = 0; // reset page number.
                saveUrls(/msgList = (.*?);/.exec(entities.decode(serverResData))[1]);
            } else {
                console.log("Unexpected status code:", res.statusCode)
            }
        } catch (e) {
            console.log(e);
            try {
                var json = JSON.parse(serverResData);
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
                var serverResp = entities.decode(serverResData).replace(/\\/g, "");  // strip "\" in URL.
                wxOfficialAccountHistory = path.join(process.env['USERPROFILE'], "Downloads", /var nickname = \"(.*?)\"/.exec(serverResp)[1] + ".html");
                saveUrls(/var msgList = \'(.*?)\';/.exec(serverResp)[1]);
            } else {
                console.log("Unexpected status code:", res.statusCode)
            }
        } catch (e) {
            console.log(e);
        }
    } else if (/mp\/profile_ext\?action=getmsg/i.test(reqUrl)) { // 2nd flavor: the getmsg action
        try {
            var json = JSON.parse(serverResData);
            if (json.general_msg_list != []) {
                saveUrls(json.general_msg_list);
            }
        } catch (e) {
            console.log(e);
        }
    } else if (/profile\?src=/i.test(reqUrl)) { // 3nd floavor: via sogou profile API
        try {
            pageNumber = 0; // reset page number.
            saveUrls(/var msgList = ({.*?});/.exec(serverResData)[1]);
        } catch (e) {
            console.log(e);
        }
    }
    return null;
  },


  /**
   * default to return null
   * the user MUST return a boolean when they do implement the interface in rule
   *
   * @param {any} requestDetail
   * @returns
   */
  *beforeDealHttpsRequest(requestDetail) {
    return null;
  },

  /**
   *
   *
   * @param {any} requestDetail
   * @param {any} error
   * @returns
   */
  *onError(requestDetail, error) {
    return null;
  },


  /**
   *
   *
   * @param {any} requestDetail
   * @param {any} error
   * @returns
   */
  *onConnectError(requestDetail, error) {
    return null;
  },
};

function saveUrls(urls) {    // Save content_urls in msgList (JSON) to file.
    // console.log(urls);
    var appMsg = JSON.parse(urls).list, msgExt, msgInfo, msgLength = appMsg.length, page = ++pageNumber;
    var outputDiv = '<div class="div-' + page + '">\r\n';
    var strDate, realTitle, realPermanentUrl, realDigest, innerList, innerListLength;
    for (var i = 0; i<msgLength; i++) {
        msgExt = appMsg[i].app_msg_ext_info;
        if (undefined === msgExt) continue; // should be pure image or text rather than articles. e.g., image_msg_ext_info
        realTitle        = msgExt.title;
        realDigest       = msgExt.digest;
        realPermanentUrl = msgExt.content_url;
        strDate          = formatDate(appMsg[i].comm_msg_info.datetime * 1000);
        if (realPermanentUrl.length > 0) { // sometimes, it is empty in this level.
            if (realPermanentUrl.indexOf("http") !== 0) {
                realPermanentUrl = "https://mp.weixin.qq.com" + realPermanentUrl;
            }
            outputDiv += strDate + '&emsp;<a class="top-' + page + ' gen-' + page + '" target="_blank" href="' + realPermanentUrl + '">' + realTitle + '</a>&emsp;' + realDigest + '<br>\r\n';
        }

        innerList = msgExt.multi_app_msg_item_list;
        innerListLength = innerList.length;
        for (var j = 0; j<innerListLength; j++) {
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

    console.log("Write to", wxOfficialAccountHistory, "Page:", page, "@", strDate);
    // console.trace("Who is calling me, let's have a look:")
    fs.writeFile(wxOfficialAccountHistory, outputDiv + '</div>\r\n', {flag: "a"}, (err) => {
        if (err) throw err;
    });
    if (pageNumber === 1) {
        fs.writeFile(wxPullHistory, formatDate(appMsg[0].comm_msg_info.datetime * 1000) + "\t" + wxOfficialAccountHistory + "\n", {flag: "a"}, (err) => {
            if (err) throw err;
        });
    }
    process.stdout.write('\x07');
}

function formatDate(milliseconds) {
    var realDate, strHour, strMin, strSec;
    realDate = new Date(milliseconds);
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
    return realDate.getFullYear() + "-" + (realDate.getMonth()+1) + "-" + realDate.getDate() + " " + strHour + ":" + strMin + ":" + strSec;
}