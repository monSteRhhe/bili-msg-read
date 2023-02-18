// ==UserScript==
// @name         bilibili消息一键已读
// @namespace    http://tampermonkey.net/
// @version      23.02.18
// @description  一键设置消息已读。
// @author       monSteRhhe
// @match        http*://message.bilibili.com/*
// @icon         https://www.bilibili.com/favicon.ico
// @grant        GM_addStyle
// @grant        GM_notification
// @require      https://cdnjs.cloudflare.com/ajax/libs/cash/8.1.3/cash.min.js
// @require      https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js
// @run-at       document-end
// ==/UserScript==
/* globals axios, $, waitForKeyElements */

(function() {
    'use strict';

    // 添加触发
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

    document.getElementsByClassName('container')[0].addEventListener('DOMNodeInserted', function() {
        if(document.getElementsByClassName('msgread')[0] == null) {
            $('ul.list').append('<div class="msgread">√　一键已读</div>');
        }
    })

    // 监控点击
    $(document).on('click', 'div.msgread', async() => {
        await UnreadNum();
        if(unread_count > 0) {
            MsgSessions('');
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
    async function UnreadNum() {
        var num = 0;
        await axios({
            url: 'https://api.vc.bilibili.com/session_svr/v1/session_svr/single_unread?unread_type=0&show_dustbin=1&build=0&mobi_app=web',
            withCredentials: true // 跨域使用凭证
        })
        .then(function(response) {
            num = response.data.data.unfollow_unread + response.data.data.follow_unread; // 未读消息总数
        })
        window.unread_count = num;
    }

    // 获取消息
    function MsgSessions(endts) {
        var api = '';
        if(endts == '') {
            api = 'https://api.vc.bilibili.com/session_svr/v1/session_svr/get_sessions?session_type=1&group_fold=1&unfollow_fold=0&sort_rule=2&build=0&mobi_app=web';
        } else {
            api = 'https://api.vc.bilibili.com/session_svr/v1/session_svr/get_sessions?session_type=1&group_fold=1&unfollow_fold=0&sort_rule=2&end_ts=' + endts + '&build=0&mobi_app=web';
        }

        axios({
            url: api,
            withCredentials: true // 跨域使用凭证
        })
        .then(async(response) => {
            var session_list = response.data.data.session_list;
            for(var i = 0; i < session_list.length; i++) {
                if(session_list[i].unread_count > 0) {
                    var ti = session_list[i].talker_id;
                    var as = session_list[i].ack_seqno;
                    var bj = GetCookie();
                    MsgRead(ti, as, bj);
                }
                await UnreadNum();
                if(unread_count > 0) {
                    if(i == session_list.length - 1) {
                        var endts = session_list[i].session_ts;
                        MsgSessions(endts);
                    }
                } else {
                    GM_notification({
                        text: '消息全部已读。',
                        title: 'Bili.Msg.Read',
                        image: 'https://www.bilibili.com/favicon.ico',
                        timeout: 2000,
                    });
                    break;
                }
            }
        })
    }

    // 设置已读
    function MsgRead(ti, as, bj) {
        var api = 'https://api.vc.bilibili.com/session_svr/v1/session_svr/update_ack?talker_id=' + ti + '&session_type=1&ack_seqno=' + as + '&build=0&mobi_app=web&csrf_token=' + bj +'&csrf=' + bj;
        axios({
            method: 'post',
            url: api,
            withCredentials: true // 跨域使用凭证
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