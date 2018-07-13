// ==UserScript==
// @name        easy wechat official account
// @author      Geoffrey Chen
// @description Add a button to open all URLs in one page.
// @encoding    utf-8
// @include     file:///C:/Users/eziqche/Downloads/*.html
// @require     http://code.jquery.com/jquery-3.2.1.min.js
// @run-at      document-end
// @version     0.0.2
// ==/UserScript==

/*
Debug in Chrome Console, manually import JQuery.

var importJs=document.createElement('script');
importJs.setAttribute("type","text/javascript");
importJs.setAttribute("src", 'http://code.jquery.com/jquery-3.2.1.min.js');
document.head.appendChild(importJs);
*/

"use strict";

if (0 === $('.top-1.gen-1').length) {
    return;
}

// UTF-8 chars are no longer supported by new Tampermonkey. Need to replace below Chinese characters manually.
// @name 微信公众号·轻松阅读
var myBtnGenTextContent = "全部打开",
    myBtnTopTextContent = "全部打开：头条",
    myBtnExtTextContent = "全部打开：普通",
    myBtn60sTextContent = "罗胖60秒",
    btnToggleTextDisplayAll = "全部显示",
    btnToggleTextHideAll = "全部显示",
    batch7 = "一次打开7页",
    batch10 = "一次打开10页";

var dayOfWeek = new Date().getDay();
var weekendMode = (dayOfWeek == 6 || dayOfWeek == 0) && localStorage.getItem("weekend_batch_size") != undefined && localStorage.getItem("weekend_batch_size") === "7";

var radioBatchSize10 = document.createElement("input");
radioBatchSize10.type = "radio";
radioBatchSize10.name = "radioBatchSize";
radioBatchSize10.value = 10;
radioBatchSize10.checked = !weekendMode;

var radioBatchSize7 = document.createElement("input");
radioBatchSize7.type = "radio";
radioBatchSize7.name = "radioBatchSize";
radioBatchSize7.value = 7;
radioBatchSize7.checked = weekendMode;

var classToColor = {
    "gen": "lightseagreen",
    "top": "lightcoral",
    "ext": "lightslategrey"
};

$('document').ready(() => {
    // set title to file name (URL decoded)
    var fileLctn = document.location.href.split("/"),
        fileName = fileLctn[fileLctn.length-1].replace(/.html#?/,"");
    document.title = decodeURI(fileName);

    // set favicon (favorite icon)
    var myFavicon = document.createElement("link");
    myFavicon.rel = "shortcut icon";
    myFavicon.type = "image/x-icon";
    myFavicon.href = "https://www.ericsson.com/favicon.ico";
    document.head.append(myFavicon);

    $('a[class*=ext]').each((idx, thisLnk) => {thisLnk.style.color = "grey";});

    var links = $("a"), linkArray = [],
        pageCount = links[links.length-1].getAttribute("class").split(/[- ]/)[1];

    var mySelect = document.createElement("select");
    mySelect.id = "currentSelectedPage";
    mySelect.style.margin = "5px";
    var myOpt = document.createElement("option");
    myOpt.value = ""; // for wild card matching.
    myOpt.text = "all";
    mySelect.appendChild(myOpt);

    for (var i=1; i<=pageCount; i++) {
        myOpt = document.createElement("option");
        myOpt.value = i;
        myOpt.text = i;
        mySelect.appendChild(myOpt);
        var myLink = document.createElement("a");
        myLink.text = i;
        myLink.href = "#";
        myLink.id = 'page-' + i;
        linkArray.push(myLink);
    }
    mySelect.selectedIndex = pageCount; // select the last page as default.

    var concurrentOpenPages = document.createElement("input");
    concurrentOpenPages.id = "concurrentOpenPages";
    concurrentOpenPages.type = "hidden";
    concurrentOpenPages.value = 10;
    var windowOpenDelay = document.createElement("input");
    windowOpenDelay.id = "windowOpenDelay";
    windowOpenDelay.type = "hidden";
    windowOpenDelay.value = 800; // 800ms

    var myBtnGen = document.createElement("button");
    myBtnGen.id = "openAllGenArticleOnSpecifiedPage";
    myBtnGen.style.margin = "5px";
    myBtnGen.textContent = myBtnGenTextContent;

    var myBtnTop = document.createElement("button");
    myBtnTop.id = "openAllTopArticleOnSpecifiedPage";
    myBtnTop.style.margin = "5px";
    myBtnTop.textContent = myBtnTopTextContent;

    var myBtnExt = document.createElement("button");
    myBtnExt.id = "openAllExtArticleOnSpecifiedPage";
    myBtnExt.style.margin = "5px";
    myBtnExt.textContent = myBtnExtTextContent;

    var myBtnToggleDisplay = document.createElement("button");
    myBtnToggleDisplay.id = "toggleDisplayAll";
    myBtnToggleDisplay.style.margin = "5px";
    myBtnToggleDisplay.value = "displayAll"; // initial state: displayAll. Toggle between displayAll and hideAll.
    myBtnToggleDisplay.textContent = btnToggleTextDisplayAll;

    var myBtn60s = document.createElement("button");
    myBtn60s.id = "myBtn60s";
    myBtn60s.style.margin = "5px";
    myBtn60s.textContent = myBtn60sTextContent;

    document.body.prepend(document.createElement("br"),
                          windowOpenDelay,
                          concurrentOpenPages,
                          mySelect,
                          myBtnGen,
                          myBtnTop,
                          myBtnExt,
                          myBtnToggleDisplay,
                          myBtn60s,
                          document.createElement("br"));

    var radioLabel10 = document.createElement("span");
    radioLabel10.innerHTML = batch10;
    document.body.prepend(radioLabel10);
    document.body.prepend(radioBatchSize10);

    var radioLabel7 = document.createElement("span");
    radioLabel7.innerHTML = batch7;
    document.body.prepend(radioLabel7);
    document.body.prepend(radioBatchSize7);

    prependTabs(6);

    myLink = document.createElement("a");
    myLink.text = ">";
    myLink.href = "#";
    myLink.id = 'page-next';
    document.body.prepend(myLink);

    var nbspSpan = document.createElement("span");
    nbspSpan.innerHTML = "&nbsp;";
    document.body.prepend(nbspSpan);

    myLink = document.createElement("a");
    myLink.text = "<";
    myLink.href = "#";
    myLink.id = 'page-previous';
    document.body.prepend(myLink);

    prependTabs(3);

    linkArray.reverse();
    linkArray.forEach(lnk => {
        document.body.prepend(lnk);
        var nbspSpan = document.createElement("span");
        nbspSpan.innerHTML = "&nbsp;";
        document.body.prepend(nbspSpan);
        $('#page-' + lnk.text).click((clickEvent) => {
            // console.debug("Page " + clickEvent.target.text + " was clicked.");
            $('[class^=div]').each((idx, thisDiv) => thisDiv.hidden = true);
            $('.div-' + clickEvent.target.text)[0].hidden = false;
            $('#currentSelectedPage')[0].value = clickEvent.target.text; // synchronize to <select> tag.
            window.scrollTo(0,0);
        });
    });

    $('#page-' + pageCount).click(); // display the oldest one.

    $('#toggleDisplayAll').click(() =>  {
        $('[class^=div]').each((idx, thisDiv) => {
            thisDiv.hidden = ("hideAll" === $('#toggleDisplayAll')[0].value);
        });
        var btnToggle = $('#toggleDisplayAll')[0];
        if ("hideAll" === btnToggle.value) {
            btnToggle.value = "displayAll";
            btnToggle.textContent = btnToggleTextDisplayAll;
        } else {
            $('#currentSelectedPage')[0].value = "";  // set current page to "all".
            btnToggle.value = "hideAll";
            btnToggle.textContent = btnToggleTextHideAll;
        }
    });
    $('#myBtn60s').click(() =>  {
        var maxPages = $("input[name='radioBatchSize']:checked").val(),
            openDelay = $("#windowOpenDelay")[0].value,
            currentOpenPages = 0;
        $('a[class*=ext-' + $('#currentSelectedPage')[0].value + ']').each((idx, thisLnk) => {
            if ((currentOpenPages < maxPages) &&
                (undefined === thisLnk.visited) &&
                (0 === thisLnk.innerText.indexOf(myBtn60sTextContent))) {
                thisLnk.visited = true;
                thisLnk.style.color = classToColor["ext"];
                setTimeout(url => window.open(url), openDelay*currentOpenPages, thisLnk.href);
                currentOpenPages++;
            }
        });
    });
    $('#openAllGenArticleOnSpecifiedPage').click(() => {openAll('gen');});
    $('#openAllTopArticleOnSpecifiedPage').click(() => {openAll('top');});
    $('#openAllExtArticleOnSpecifiedPage').click(() => {openAll('ext');});
    $('#currentSelectedPage').change(() => {
        var currPage = $('#currentSelectedPage')[0].value;
        if ("" === currPage) {
            $('#toggleDisplayAll').click();
        } else {
            $('#page-' + currPage).click();
        }
        // console.debug("currentSelectedPage is now: " + $('#currentSelectedPage')[0].value);
    });
    $('#page-previous').click(() => {
        // console.debug("Navigating to previous page");
        var currentPage = $('#currentSelectedPage')[0];
        if ("" === currentPage.value) {
            // console.debug("Go to first page.");
            currentPage.value = 1; // 1st page
        } else if (currentPage.value > 1) {
            currentPage.value--;
        }
        $('#currentSelectedPage').change();
    });
    $('#page-next').click(() => {
        // console.debug("Navigating to next page");
        var currentPage = $('#currentSelectedPage')[0];
        if ("" === currentPage.value) {
            // console.debug("Go to last page.");
            currentPage.value = currentPage.length - 1; // last page
        } else if (currentPage.value < currentPage.length - 1){
            currentPage.value++;
        }
        $('#currentSelectedPage').change();
    });
    $('input[name=radioBatchSize').change(function () {
        localStorage.setItem("weekend_batch_size", this.value);
    });
});

function pageUpOrDown()
{
    var keyCode = window.event.keyCode;
    if (keyCode == 37) { // ArrowLeft
        $('#page-previous').click();
    } else if (keyCode == 39) { // ArrowRight
        $('#page-next').click();
    }
}

document.onkeydown = pageUpOrDown;

function prependTabs(n) {
    for (var i=0; i<n; i++) {
        var nbspSpan = document.createElement("span");
        nbspSpan.innerHTML = "&emsp;";
        document.body.prepend(nbspSpan);
    }
}

function openAll(className) {
    // console.debug("button openAll [" + className + "] articles is clicked.");
    var maxPages = $("input[name='radioBatchSize']:checked").val(),
        openDelay = $("#windowOpenDelay")[0].value,
        currentOpenPages = 0;
    $('a[class*=' + className + '-' + $('#currentSelectedPage')[0].value + ']').each((idx, thisLnk) => {
        if ((currentOpenPages < maxPages) &&
            (undefined === thisLnk.visited)) {
            thisLnk.visited = true;
            thisLnk.style.color = classToColor[className];
            setTimeout(url => window.open(url), openDelay*currentOpenPages, thisLnk.href);
            currentOpenPages++;
        }
    });
}
