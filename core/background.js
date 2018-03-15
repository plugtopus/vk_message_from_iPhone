function devices() {
    return {
        iphone: {
            client_id: localStorage.iphone_client_id || "3140623",
            client_secret: localStorage.iphone_client_secret || "VeWdmVclDCtn6ihuP1nt",
            name: "iPhone",
            access_token: localStorage.iphone_access_token || "",
            fallback: {
                client_id: "3087106"
            }
        }
    }
}

var $requests = {},
    $authTabId = -1,
    $vkTabId = -1,
    $deviceTypes = ["iphone"],
    $devicesUpdateGist = "a0b9e0e3a7bc86691022",
    $messages = {
        can_not_publish_poll: {
            title: "Внимание",
            body: "Публикация опросов с яблочком невозможна. Запись отправлена обычным способом."
        },
        auth_error: {
            body: "Не удалось авторизоваться."
        },
        device_unavailable: {
            body: 'К сожалению, данное устройство временно недоступно.'
        }
    },
    $currentId = -1;

function intercept(e) {
    var t = e.requestBody.formData.to_id[0],
        a = e.requestBody.formData.Message[0],
        o = {
            latitude: "",
            longitude: ""
        },
        r = e.requestBody.formData.friends_only[0],
        c = (e.requestBody.formData.postpone || "")[0],
        s = e.requestBody.formData.official[0],
        n = e.requestBody.formData.signed[0],
        i = [],
        d = e.requestBody.formData.facebook_export[0],
        l = e.requestBody.formData.status_export[0];
    "1" == d && i.push("facebook"), "1" == l && i.push("twitter");
    for (var u = [], _ = 2, h = 1; h < _; h++)
        if (e.requestBody.formData["attach" + h]) {
            var v = e.requestBody.formData["attach" + h + "_type"],
                p = e.requestBody.formData["attach" + h];
            if ("poll" == v) continue;
            if ("share" == v && (v = e.requestBody.formData.url, p = ""), "map" == v) {
                var f = p[0].split("_");
                o.latitude = f[0], o.longitude = f[1]
            } else u.push(v + p);
            _ += 1
        }
    wallPost({
        owner_id: t,
        message: a,
        attachments: u.join(),
        lat: o.latitude,
        long: o.longitude,
        friends_only: r,
        publish_date: c,
        from_group: s,
        signed: n,
        services: i.join(","),
        tab_id: e.tabId
    }, e.tabId)
}

function checkUser() {
    return localStorage.saved_id == $currentId
}

function wallPost(e, t) {
    localStorage.access_token = currentDevice().access_token, checkUser() || (localStorage.access_token = "", clearDevicesTokens()), e.access_token = localStorage.access_token, $.ajax({
        type: "POST",
        url: "https://api.vk.com/method/wall.post",
        data: e
    }).done(function(a) {
        var o = !1;
        if (delete $requests[e.captcha_sid], a.response) o = !0;
        else if (a.error && (14 == a.error.error_code && ($requests[a.error.captcha_sid] = e), 5 == a.error.error_code)) {
            $requests.no_token = e;
            var r = currentDevice();
            chrome['tabs'].create({
                url: "html/login.html?client_id=" + r.client_id + "&client_secret=" + r.client_secret + "&device_name=" + r.name
            }, function(e) {
                $authTabId = e.id
            })
        }(t = parseInt(t || e.tab_id, 10)) && t > -1 && chrome['tabs'].sendRequest(t, {
            type: "server_response",
            success: o,
            data: a,
            request_data: e
        })
    })
}

function showMessage(e, t) {
    chrome['tabs'].sendRequest(t, {
        type: "show_message",
        message: $messages[e]
    })
}

function currentDevice() {
    return devices()[$deviceTypes[currentDeviceIndex()]]
}

function currentDeviceIndex() {
    return localStorage.current_device || 0
}

function updateDeviceInfo(e) {
    $.ajax({
        type: "GET",
        url: "https://api.github.com/gists/" + $devicesUpdateGist
    }).done(function(t) {
        for (var a in t.files) {
            var o = $.parseJSON(t.files[a].content);
            localStorage[a + "_client_id"] = o.client_id, localStorage[a + "_client_secret"] = o.client_secret
        }
        e()
    }).fail(function(t) {
        e()
    })
}

function retryAuth() {
    var e = currentDevice();
    chrome['tabs'].sendRequest($authTabId, {
        type: "retry_login",
        new_client_id: e.client_id,
        new_client_secret: e.client_secret
    })
}

function focusOnTab(e) {
    -1 != e && chrome['tabs'].update(e, {
        selected: !0
    })
}

function clearDevicesTokens() {
    for (var e in $deviceTypes) localStorage[$deviceTypes[e] + "_access_token"] = ""
}

chrome.webRequest.onBeforeRequest.addListener(function(e) {
    var t = parseInt(localStorage.with_apple);
    if (t && "post" == e.requestBody.formData.act && e.requestBody.formData.to_id && t) return $vkTabId = e.tabId, intercept(e), {
        cancel: !0
    }
}, {
    urls: ["*://vk.com/al_wall.php", "*://new.vk.com/al_wall.php"],
    types: ["xmlhttprequest"]
}, ["requestBody", "blocking"]), chrome['tabs'].onUpdated.addListener(function(e, t, a) {
    var o = $authTabId;
    if (-1 !== o && t.url && e == o) {
        -1 === t.url.indexOf("#error") && -1 === t.url.indexOf("security breach") || (chrome['tabs'].remove(e), focusOnTab($vkTabId), $requests.no_token.tab_id && showMessage("auth_error", $requests.no_token.tab_id));
        var r = t.url.match(/#access_token=(\w+).*user_id=(\d+)/);
        if (r) {
            var c = r[1],
                s = r[2];
            localStorage[$deviceTypes[currentDeviceIndex()] + "_access_token"] = c, localStorage.saved_id = s, chrome['tabs'].remove(e), focusOnTab($vkTabId);
            var n = $requests.no_token;
            delete $requests.no_token, n && wallPost(n, $vkTabId)
        }
    }
}), chrome['extension'].onRequest.addListener(function(e, t, a) {
    var o = e.data;
    if ("saveSettings" == e.method) {
        for (var r in o) localStorage[r] = o[r];
        a(localStorage)
    }
    if ("getSettings" == e.method && a(localStorage), "resendRequest" == e.method) {
        var c = $requests[o.captcha_sid];
        c && (c.captcha_sid = o.captcha_sid, c.captcha_key = o.captcha_key, wallPost(c, t.tab.id))
    }
    if ("updateId" == e.method && ($currentId = o.uid), "login" == e.method) {
        var s = $authTabId;
        if (-1 === s || t.tab.id != s) return;
        localStorage[$deviceTypes[currentDeviceIndex()] + "_access_token"] = o.access_token, localStorage.saved_id = o.user_id, chrome['tabs'].remove(t.tab.id), focusOnTab($vkTabId);
        var n = $requests.no_token;
        delete $requests.no_token, n && wallPost(n, $vkTabId)
    }
    if ("updateDeviceInfo" == e.method && updateDeviceInfo(retryAuth), "deviceUnavailable" == e.method) {
        chrome['tabs'].remove($authTabId);
        var i = currentDevice();
        i.fallback ? chrome['tabs'].create({
            url: "https://oauth.vk.com/authorize?client_id=" + i.fallback.client_id + "&scope=wall&response_type=token"
        }, function(e) {
            $authTabId = e.id
        }) : (focusOnTab($vkTabId), showMessage("device_unavailable", $vkTabId))
    }
    "clearData" == e.method && localStorage.clear()
});