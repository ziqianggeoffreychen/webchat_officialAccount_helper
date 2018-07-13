// ==UserScript==
// @name	Human readable Weixin page
// @author	Geoffrey
// @description	公众号页面优化
// @encoding	utf-8
// @include     http://mp.weixin.qq.com/s*
// @include     https://mp.weixin.qq.com/s*
// @require     http://code.jquery.com/jquery-3.2.1.min.js
// @run-at	    document-end
// @version	    0.0.1
// ==/UserScript==

//$('#js_pc_qr_code').remove();
//$('.rich_media').style.width='100%';
document.getElementById('js_pc_qr_code').remove();
var richMedia0 = document.getElementsByClassName('rich_media')[0];
if (undefined !== richMedia0) {
    richMedia0.style.width='100%';
}

var myDiv = document.createElement("div");
myDiv.id = "divAux";
myDiv.align = "right";
var jsArticle = document.querySelector('#js_article');
if (undefined !== jsArticle) {
    jsArticle.prepend(myDiv);
}

var myButton = document.createElement("button");
myButton.id = "restoreImgSize";
myButton.innerText = "图片<-原始尺寸";
myButton.style = "background: #fafafa; border-style: dashed";
myButton.onclick = function() {
    var allImg = document.querySelectorAll('img');
    var imgCount = allImg.length;
    var imgItr, i;
    for (i=0; i < imgCount; i++) {
        imgItr = allImg[i];
        if ("img_loading" === imgItr.getAttribute('class')) {
            //imgItr.scrollIntoView();
            imgItr.removeAttribute('class'); // remove "img_loading" class.
            imgItr.src = imgItr.getAttribute('data-src'); // set real image src.
            // imgItr.onload = ""; // override the "delay-loading-image" function.
        }
        if (undefined === imgItr.getAttribute('width') || "100%" === imgItr.getAttribute('width') || "100%" === imgItr.getAttribute('_width') || "85%" === imgItr.getAttribute('_width')) {
            console.debug("set auto width to [" + imgItr.src + "]");
            imgItr.style.width = 'auto';
            imgItr.style.height = 'auto';
            // imgItr.setAttribute('_width', 'auto');
        }
        imgItr.onload = undefined;
    }
    document.querySelector('#restoreImgSize').scrollIntoView();
    document.querySelector('#restoreImgSize').blur();

    // if there is 'data-s' atrribute, use it to set image size.
    //  height:  $('[data-s]').getAttribute('data-s').split(',')[0]
    //  width:   $('[data-s]').getAttribute('data-s').split(',')[1]
    var imgDataS = document.querySelectorAll('[data-s]');
    imgCount = imgDataS.length;
    var widthInDataS;
    for (i=0; i<imgCount; i++) {
        // dataW = imgDataS[i].getAttribute('data-w');
        // imgDataS[i].style.width = (undefined != dataW) ? dataW+"px" : imgDataS[i].getAttribute('data-s').split(',')[1]+"px";
        imgItr = imgDataS[i];
        widthInDataS = imgItr.getAttribute('data-s').split(',')[1];
        if ("640" === widthInDataS) { // 640px is a common one, let's handle it.
            console.debug("set src to 640px: [" + imgItr.src + "]");
            imgItr.src = imgItr.getAttribute("data-src").replace(/\/0\..*/, "/640");
        }
        if (imgItr.naturalWidth > widthInDataS) { // never enlarge the image.
            console.debug("Natural width is larger, set it to width in data-s attribute: [" + imgItr.src + "]");
            imgItr.style.width = widthInDataS + "px";
        }
    }
    $('[style*=width]').width('auto');
    $('.rich_media_area_primary_inner').css('max-width', '100%');
};
document.querySelector('#divAux').prepend(myButton);
document.querySelector('#restoreImgSize').click();

var richMediaThumb = document.getElementsByClassName('rich_media_thumb')[0];
if (undefined !== richMediaThumb) {
    richMediaThumb.removeAttribute('class');
}

var padding10px = document.querySelector('[style^="padding: 10px; display"]');
if (null !== padding10px) {
    padding10px.style.width="99%";
}

setTimeout(function() {
    document.querySelector('#restoreImgSize').click();
    unsafeWindow.onscroll = undefined;
    unsafeWindow.title = msg_title;
    document.title = msg_title;
}, 1000);
