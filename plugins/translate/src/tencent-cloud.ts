import * as crypto from 'crypto';
import api from '@public/api'

function sha256(message: string, secret: string | crypto.BinaryLike, encoding?: crypto.BinaryToTextEncoding) {
    const hmac = crypto.createHmac('sha256', secret)
    if (encoding) {
      return hmac.update(message).digest(encoding)
    }
    return hmac.update(message).digest()
}

function getHash(message: string, encoding: crypto.BinaryToTextEncoding = 'hex') {
    const hash = crypto.createHash('sha256')
    return hash.update(message).digest(encoding)
}

function getDate(timestamp: number) {
    const date = new Date(timestamp * 1000)
    const year = date.getUTCFullYear()
    const month = ('0' + (date.getUTCMonth() + 1)).slice(-2)
    const day = ('0' + date.getUTCDate()).slice(-2)
    return `${year}-${month}-${day}`
}

async function request(options: {
  secretId: string, secretKey: string,
  endpoint: string, service: string, region: string, action: string, version: string,
  payload: string,
}){
    const { secretId: SECRET_ID, secretKey: SECRET_KEY, endpoint, service, region, action, version, payload } = options
    
    const timestamp = Math.floor(Date.now() / 1000)
    //时间处理, 获取世界时间日期
    const date = getDate(timestamp)

    // ************* 步骤 1：拼接规范请求串 *************
    const hashedRequestPayload = getHash(payload);
    const httpRequestMethod = "POST"
    const canonicalUri = "/"
    const canonicalQueryString = ""
    const canonicalHeaders = "content-type:application/json; charset=utf-8\n"
        + "host:" + endpoint + "\n"
        + "x-tc-action:" + action.toLowerCase() + "\n"
    const signedHeaders = "content-type;host;x-tc-action"

    const canonicalRequest = httpRequestMethod + "\n"
                         + canonicalUri + "\n"
                         + canonicalQueryString + "\n"
                         + canonicalHeaders + "\n"
                         + signedHeaders + "\n"
                         + hashedRequestPayload
    console.log(canonicalRequest)

    // ************* 步骤 2：拼接待签名字符串 *************
    const algorithm = "TC3-HMAC-SHA256"
    const hashedCanonicalRequest = getHash(canonicalRequest);
    const credentialScope = date + "/" + service + "/" + "tc3_request"
    const stringToSign = algorithm + "\n" +
                    timestamp + "\n" +
                    credentialScope + "\n" +
                    hashedCanonicalRequest
    console.log(stringToSign)

    // ************* 步骤 3：计算签名 *************
    const kDate = sha256(date, 'TC3' + SECRET_KEY)
    const kService = sha256(service, kDate as crypto.BinaryLike)
    const kSigning = sha256('tc3_request', kService as crypto.BinaryLike)
    const signature = sha256(stringToSign, kSigning as crypto.BinaryLike, 'hex')
    console.log(signature)

    // ************* 步骤 4：拼接 Authorization *************
    const authorization = algorithm + " " +
                    "Credential=" + SECRET_ID + "/" + credentialScope + ", " +
                    "SignedHeaders=" + signedHeaders + ", " +
                    "Signature=" + signature
    console.log(authorization)

    const headers = {
      Authorization: authorization,
      "Content-Type": "application/json; charset=utf-8",
      // Host: endpoint,
      "X-TC-Action": action,
      "X-TC-Timestamp": timestamp.toString(),
      "X-TC-Version": version,
      "X-TC-Region": region,
    }

    // const curlcmd = 'curl -X POST ' + "https://" + endpoint
    //                        + ' -H "Authorization: ' + authorization + '"'
    //                        + ' -H "Content-Type: application/json; charset=utf-8"'
    //                        + ' -H "Host: ' + endpoint + '"'
    //                        + ' -H "X-TC-Action: ' + action + '"'
    //                        + ' -H "X-TC-Timestamp: ' + timestamp.toString() + '"'
    //                        + ' -H "X-TC-Version: ' + version + '"'
    //                        + ' -H "X-TC-Region: ' + region + '"'
    //                        + " -d '" + payload + "'"
    // console.log(curlcmd, headers)

    const res = await api.fetch(`https://${endpoint}`, {
      headers,
      "body": payload,
      "method": "POST"
    });
    return res.json();
}

export const translate = async (text: string) => {
  return request({
    endpoint: 'tmt.tencentcloudapi.com',
    action: 'TextTranslate',
    version: '2018-03-21',
    region: 'ap-guangzhou',
    payload: JSON.stringify({ SourceText: text, Source: 'auto', Target: 'zh', ProjectId: 0 }),
    service: 'tmt',
    secretId: '',
    secretKey: '',
  })
}