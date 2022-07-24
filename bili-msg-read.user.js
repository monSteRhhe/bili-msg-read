// ==UserScript==
// @name         bilibili消息一键已读
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  一键设置消息已读。
// @author       monSteRhhe
// @match        http*://message.bilibili.com/*
// @icon         https://www.bilibili.com/favicon.ico
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @run-at       document-end
// @grant        GM_addStyle
// @grant        GM_notification
// ==/UserScript==

(function() {
    'use strict';

    // 添加按钮
    GM_addStyle('\
    .msgread {\
        color: #6b757b;\
        position: relative;\
        line-height: 2rem;\
        cursor: pointer;\
    }\
    .msgread:hover {\
        color: #00a0d8;\
    }\
    ')

    setInterval(function() {
        if(document.getElementsByClassName('msgread')[0] == null) {
            $('ul.list').append('<div class="msgread">√　一键已读</div>');
        }
    }, 1000)

    // 监控点击
    $(document).on('click', '.msgread', function() {
        if(UnreadNum() > 0) {
            MsgSessions('')
        } else {
            GM_notification({
                text: '消息全部已读。',
                title: 'Bili.Msg.Read',
                image: 'https://www.bilibili.com/favicon.ico',
                timeout: 2000,
            });
        }
    })

    // 未读数
    function UnreadNum() {
        var api = 'https://api.vc.bilibili.com/session_svr/v1/session_svr/single_unread';
        var num = 0;

        $.ajax({
            url: api,
            type: 'GET',
            async: false,
            xhrFields: {
                withCredentials: true
            },
            success: function(result) {
                num = result.data.unfollow_unread + result.data.follow_unread;
            }
        })

        return num;
    }

    // 获取消息
    function MsgSessions(endts) {
        var api = '';
        if(endts == '') {
            api = 'https://api.vc.bilibili.com/session_svr/v1/session_svr/get_sessions?session_type=1&group_fold=1&unfollow_fold=0&sort_rule=2&build=0&mobi_app=web';
        } else {
            api = 'https://api.vc.bilibili.com/session_svr/v1/session_svr/get_sessions?session_type=1&group_fold=1&unfollow_fold=0&sort_rule=2&end_ts=' + endts + '&build=0&mobi_app=web';
        }

        $.ajax({
            url: api,
            type: 'GET',
            async: false,
            xhrFields: {
                withCredentials: true
            },
            success: function(result) {
                var session_list = result.data.session_list;
                for(var i = 0; i < session_list.length; i++) {
                    if(session_list[i]['unread_count'] > 0) {
                        var ti = session_list[i]['talker_id'];
                        var as = session_list[i]['ack_seqno'];
                        var bj = GetCookie();
                        MsgRead(ti, as, bj);
                    }
                    if(UnreadNum() > 0) {
                        if(i == session_list.length - 1) {
                            var endts = session_list[i]['session_ts'];
                            MsgSessions(endts);
                        }
                    } else {
                        GM_notification({
                            text: '消息全部已读。',
                            title: 'Bili.Msg.Read',
                            image: 'https://www.bilibili.com/favicon.ico',
                            timeout: 2000,
                        });
                    }
                }
            }
        })
    }

    // 设置已读
    function MsgRead(ti, as, bj) {
        var api = 'https://api.vc.bilibili.com/session_svr/v1/session_svr/update_ack?talker_id=' + ti + '&session_type=1&ack_seqno=' + as + '&build=0&mobi_app=web&csrf_token=' + bj +'&csrf=' + bj;

        $.ajax({
            url: api,
            type: 'POST',
            async: true,
            xhrFields: {
                withCredentials: true
            }
        })
    }

    // 获取bili_jct
    function GetCookie() {
        var cookieArr = document.cookie.split(';');

        for(var i = 0; i < cookieArr.length; i++) {
            if(cookieArr[i].split('=')[0] == ' bili_jct') {
                var value = cookieArr[i].split('=')[1];
                return value;
            }
        }
    }
})();