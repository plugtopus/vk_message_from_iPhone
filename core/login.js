function setAppInfo() {
    $(".device a").attr("href", "http://vk.com/app" + urlParams.client_id), $(".device .name").text(urlParams.device_name)
}

function login(e) {
    var a = {
        username: $(".username").val(),
        password: $(".password").val(),
        client_id: urlParams.client_id,
        client_secret: urlParams.client_secret,
        grant_type: "password",
        scope: "474367",
        captcha_sid: $(".captcha_sid").val(),
        captcha_key: $(".captcha_key").val()
    };
    $(".2_fa_box").is(":visible") && (a.code = $(".code").val()), clearOldData(), $.ajax({
        url: "https://oauth.vk.com/token",
        data: a
    }).fail(function(a) {
        processError(a, e)
    }).done(function(e) {
        chrome['extension'].sendRequest({
            method: "login",
            data: e
        })
    })
}

function clearOldData() {
    $(".errors").hide(), $(".captcha_box").hide(), $(".captcha_sid").val(""), $(".captcha_key").val(""), $(".code").val(""), $(".2_fa_box").hide()
}

function processError(e, a) {
    var i = e.responseJSON;
    if (i.error) switch (i.error) {
        case "invalid_client":
            "Username or password is incorrect" == i.error_description && $(".invalid_client").show(), "client_secret is incorrect" != i.error_description && "client_secret is undefined" != i.error_description || (a ? chrome['extension'].sendRequest({
                method: "deviceUnavailable"
            }) : chrome['extension'].sendRequest({
                method: "updateDeviceInfo"
            }));
            break;
        case "need_captcha":
            $(".captcha_img").attr("src", i.captcha_img), $(".captcha_sid").val(i.captcha_sid), $(".captcha_box").show();
            break;
        case "need_validation":
            "2fa_app" == i.validation_type || "2fa_sms" == i.validation_type ? ("2fa_sms" == i.validation_type && sendSms(i.validation_sid), $(".need_" + i.validation_type + "_validation").show(), $(".2_fa_box").show()) : ($(".need_validation a").attr("href", i.redirect_uri), $(".need_validation").show());
            break;
        case "invalid_request":
            $(".invalid_request").show();
            break;
        default:
            $(".invalid_client").show()
    } else $(".invalid_client").show()
}

function sendSms(e) {
    $.ajax({
        url: "https://api.vk.com/method/auth.validatePhone?voice=0&v=5.46&sid=" + e
    })
}
$(document).ready(function() {
    setAppInfo(), $(".popup_login_btn").click(function() {
        login(!1)
    }), $(".username, .password, .captcha_key, .code").keypress(function(e) {
        13 == e.which && $(".popup_login_btn").click()
    })
});
var urlParams = function() {
    for (var e = {}, a = window.location.search.substring(1).split("&"), i = 0; i < a.length; i++) {
        var t = a[i].split("=");
        if (void 0 === e[t[0]]) e[t[0]] = t[1];
        else if ("string" == typeof e[t[0]]) {
            var n = [e[t[0]], t[1]];
            e[t[0]] = n
        } else e[t[0]].push(t[1])
    }
    return e
}();
chrome['extension'].onRequest.addListener(function(e) {
    "retry_login" == e.type && (urlParams.client_id = e.new_client_id, urlParams.client_secret = e.new_client_secret, login(!0))
});