// ==UserScript==
// @name	Human readable Weixin page
// @author	Geoffrey
// @description	Optimization weixin web page
// @encoding	utf-8
// @include     http://mp.weixin.qq.com/s*
// @include     https://mp.weixin.qq.com/s*
// @include     https://mp.weixin.qq.com/mp/appmsg/*
// @require     http://code.jquery.com/jquery-3.2.1.min.js
// @run-at	    document-end
// @version	    0.0.1
// ==/UserScript==

//$('#js_pc_qr_code').remove();
//$('.rich_media').style.width='100%';
qrCode = document.getElementById('js_pc_qr_code');
if (undefined != qrCode) {
	qrCode.remove();
}

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
myButton.innerText = "Original picture";
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

	var videoFill = document.querySelector('video');
	var iconMidPlay = document.getElementsByClassName('icon_mid_play')[0];
	if (undefined === videoFill && window.frames.length > 0) {
		videoFill = window.frames[0].document.querySelector('video');
		iconMidPlay = window.frames[0].document.getElementsByClassName('icon_mid_play')[0];
	}
	if (undefined !== videoFill) {
		var nbspSpan = document.createElement("span");
		nbspSpan.innerHTML = "&nbsp;";
		document.querySelector('#divAux').prepend(nbspSpan);
		nbspSpan = document.createElement("span");
		nbspSpan.innerHTML = "&nbsp;";
		document.querySelector('#divAux').prepend(nbspSpan);

		var myVideoLink = document.createElement("a");
		myVideoLink.id = "video_direct_link";
		myVideoLink.href = videoFill.getAttribute("origin_src");
		myVideoLink.innerHTML = "Video Direct Link";
		myVideoLink.style = "color: blue; text-decoration-line: underline; text-decoration: wavy";
		document.querySelector('#divAux').prepend(myVideoLink);
		nbspSpan = document.createElement("span");
		nbspSpan.innerHTML = "&nbsp;";
		document.querySelector('#divAux').prepend(nbspSpan);

		var setPlaybackRate = document.createElement("button");
		setPlaybackRate.id = "setPlaybackRate";
		setPlaybackRate.style.margin = "5px";
		setPlaybackRate.textContent = "Playback Rate";
		document.querySelector('#divAux').prepend(setPlaybackRate);
		$('#setPlaybackRate').click(() =>  {
			videoFill.playbackRate = $('#currentRate')[0].value;
		});

		var mySelect = document.createElement("select");
		mySelect.id = "currentRate";
		mySelect.style.margin = "5px";
		var myOpt10 = document.createElement("option");
		myOpt10.value = 1;
		myOpt10.text = "1";
		var myOpt15 = document.createElement("option");
		myOpt15.value = 1.5;
		myOpt15.text = "1.5";
		var myOpt20 = document.createElement("option");
		myOpt20.value = 2;
		myOpt20.text = "2";
		mySelect.appendChild(myOpt10);
		mySelect.appendChild(myOpt15);
		mySelect.appendChild(myOpt20);
		document.querySelector('#divAux').prepend(mySelect);
		$('#currentRate').change(() => {
			$('#setPlaybackRate').click();
		});
		mySelect.value = 1.5;
		$('#setPlaybackRate').click();
		iconMidPlay.addEventListener("click", function() {
			setTimeout(function() {
				$('#setPlaybackRate').click();
			}, 50);
		});
	}
}, 2000);
