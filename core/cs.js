function injectApple() {
    chrome['extension'].sendRequest({
        method: "getSettings"
    }, function(e) {
        var t = e;
        if (t.with_apple = parseInt(t.with_apple), !document.getElementById("with_apple")) {
            injectAppleStyles(t), runOnPage('window.postMessage({ type: "update_id", uid: vk.id }, "*");');
            var n = '<div id="from_iphone_embedded" style="overflow: hidden; width: 34px; height: 23px; float: right; margin-right: 4px;"><div class="checkbox_pic fl_l ' + (t.with_apple ? "on" : "") + '" id="with_apple" onclick="checkbox(this)"><div></div></div><ul id="device_item"><li class="iphone"></li></ul><div id="choose_post_device"></div></div>';
            $(n).insertAfter(".addpost_button_wrap"), $("#with_apple").on("click", function(e) {
                t.with_apple = !t.with_apple, chrome['extension'].sendRequest({
                    method: "saveSettings",
                    data: {
                        with_apple: t.with_apple ? 1 : 0
                    }
                })
            }), $("#with_apple.checkbox_pic").mouseover(function() {
                runOnPage("showTooltip(document.getElementById('with_apple'), {text: '" + deviceName(parseInt(t.current_device) || 0) + "', black: 1, shift: [12,10]});")
            })
        }
    })
}

function parseResponse(e) {
    e.success ? (runOnPage("Wall.showMore();Wall.clearInput();"), runOnPage('cur.wallNextFrom = "";'), runOnPage("Wall.showMore();Wall.clearInput();")) : e.data.error && 14 == e.data.error.error_code && showCaptcha(e.data.error)
}

function runOnPage(e, t) {
    elemType = t ? "style" : "script";
    var n = document.createElement(elemType);
    n.textContent = e, (document.head || document.documentElement).appendChild(n), t || n.parentNode.removeChild(n)
}

function showCaptcha(e) {
    runOnPage("box = showFastBox({title: getLang('captcha_enter_code'),width: 305},'<div class=\"captcha\"><div><img src=\"" + e.captcha_img + '"/></div><div><input type="text" class="big_text" maxlength="7" placeholder="\' + getLang(\'global_captcha_input_here\') + \'" /><div class="progress" /></div></div></div>\',getLang(\'captcha_send\'),function() { box.submit(); },getLang(\'captcha_cancel\'),function() { box.hide(); });box.submit = function() {key = geByTag1(\'input\', box.bodyNode).value;window.postMessage({ type: "captcha_ready", captcha_key: key, captcha_sid: ' + e.captcha_sid + ' }, "*");box.hide();};')
}

function showMessage(e) {
    var t = e.title || "Возникла ошибка",
        n = e.body || "Что-то пошло не так";
    runOnPage("showFastBox('" + t + "','".concat(n) + "');")
}

function deviceIconPath() {
    return "img/iphone_post_icon.png"
}

function deviceName() {
    return "iPhone"
}

function injectAppleStyles(e) {
    var t = chrome['extension'].getURL(deviceIconPath(parseInt(e.current_device) || 0));
    runOnPage(checkBoxStyle(t) + deviceListStyle(), !0)
}

function checkBoxStyle(e) {
    var t = "#with_apple.checkbox_pic {background: url(" + e + ") no-repeat 0 0;overflow: hidden;opacity: 0.5;filter: alpha(opacity=50);";
    return t += "background-size: 16px; height: 16px; width: 16px;", (t += " }") + "#with_apple.on {opacity: 1;filter: none;}"
}

function deviceListStyle() {
    var e = "#device_item {position: absolute;background-color: #FFF;padding: 0 0 0 0;list-style-type: none;z-index: 1000;display: none;box-shadow: 0px 2px 3px rgba(0, 0, 0, 0.35);border: 1px solid #B2BDCA;border-bottom-right-radius: 2px;border-bottom-left-radius: 2px;";
    return e += "margin-top: 24px;", e += " }", e += "#device_item li {height: 20px;cursor: pointer;opacity: 0.7;", e += "width: 24px;", e += " }", (e += "#device_item li:hover { opacity: 1; }") + (deviceListItemStyle("iphone"))
}

function deviceListItemStyle(e) {
    var t = "#device_item li." + e + " {background: url(" + chrome['extension'].getURL("/img/" + e + "_icon.png") + ") center no-repeat;";
    return (t += "background-size: 16px;") + " }"
}
document.addEventListener("DOMNodeInserted", function() {
    document.getElementById("submit_post") && !document.getElementById("with_apple") && injectApple()
}), chrome['extension'].onRequest.addListener(function(e) {
    "server_response" == e.type && parseResponse(e), "show_message" == e.type && showMessage(e.message)
}), window.addEventListener("message", function(e) {
    e.source == window && e.data.type && ("captcha_ready" == e.data.type ? chrome['extension'].sendRequest({
        method: "resendRequest",
        data: {
            captcha_key: e.data.captcha_key,
            captcha_sid: e.data.captcha_sid
        }
    }) : "update_id" == e.data.type && chrome['extension'].sendRequest({
        method: "updateId",
        data: {
            uid: e.data.uid
        }
    }))
}, !1);