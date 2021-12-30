/* Created by iflytek on 2020/03/01.
 *
 * 运行前：请先填写 appid、apiSecret、apiKey
 * 
 * 在线语音合成调用demo
 * 此demo只是一个简单的调用示例，不适合用到实际生产环境中
 *
 * 在线语音合成 WebAPI 接口调用示例 接口文档（必看）：https://www.xfyun.cn/doc/tts/online_tts/API.html
 * 错误码链接：
 * https://www.xfyun.cn/document/error-code （code返回错误码时必看）
 * 
 */
const CryptoJS = require('crypto-js')
const WebSocket = require('ws')
var log = require('log4node')
var fs = require('fs')

// 系统配置 
const config = {
    // 请求地址
    hostUrl: "wss://tts-api.xfyun.cn/v2/tts",
    host: "tts-api.xfyun.cn",
    //在控制台-我的应用-在线语音合成（流式版）获取
    appid: "",
    //在控制台-我的应用-在线语音合成（流式版）获取
    apiSecret: "",
    //在控制台-我的应用-在线语音合成（流式版）获取
    apiKey: "",
    uri: "/v2/tts",
}


// 获取当前时间 RFC1123格式
let date = (new Date().toUTCString())
// 设置当前临时状态为初始化

let wssUrl = config.hostUrl + "?authorization=" + getAuthStr(date) + "&date=" + date + "&host=" + config.host

const init_length = 0
let current_length = init_length
const end_length = 90

function getAuthStr(date) {
    let signatureOrigin = `host: ${config.host}\ndate: ${date}\nGET ${config.uri} HTTP/1.1`
    let signatureSha = CryptoJS.HmacSHA256(signatureOrigin, config.apiSecret)
    let signature = CryptoJS.enc.Base64.stringify(signatureSha)
    let authorizationOrigin = `api_key="${config.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
    let authStr = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(authorizationOrigin))
    return authStr
}

function getTTS(length){
    let ws = new WebSocket(wssUrl)
    const text = `角度为${length}度`
    const audioFilename = `${length}deg`

    ws.on('error', (err) => {
        log.error("websocket connect err: " + err)
    })

    // 鉴权签名

    // 传输数据
    function send(text) {
        let frame = {
            // 填充common
            "common": {
                "app_id": config.appid
            },
            // 填充business
            "business": {
                "aue": "lame",
                "sfl": 1,
                "auf": "audio/L16;rate=16000",
                "vcn": "xiaoyan",
                "tte": "UTF8"
            },
            // 填充data
            "data": {
                "text": Buffer.from(text).toString('base64'),
                "status": 2
            }
        }
        ws.send(JSON.stringify(frame))
    }

    // 保存文件
    function save(data, filename) {
        fs.writeFile(`${filename}.mp3`, data, { flag: 'a' }, (err) => {
            if (err) {
                log.error('save error: ' + err)
                return 
            }

            log.info(`文件${filename}保存成功`)
        })
    }

    // 连接建立完毕，读取数据进行识别
    ws.on('open', () => {
        log.info("websocket connect!")
        send(text)
        ws.on('message', (data, err) => {
            if (err) {
                log.error('message error: ' + err)
                return
            }

            let res = JSON.parse(data)

            if (res.code != 0) {
                log.error(`${res.code}: ${res.message}`)
                ws.close()
                return
            }

            let audio = res.data.audio
            let audioBuf = Buffer.from(audio, 'base64')
            
            save(audioBuf, audioFilename)

            if (res.code == 0 && res.data.status == 2) {
                ws.close()
                ws.on('close',()=>{
                    log.info('connect close!')
                    if (current_length < end_length){
                        current_length = current_length + 1
                        getTTS(current_length)
                    }
                })
            }
        })
    })
}

// 得到结果后进行处理，仅供参考，具体业务具体对待

// 资源释放
// ws.on('close', () => {
//     log.info('connect close!')
// })

// 连接错误


getTTS(current_length)