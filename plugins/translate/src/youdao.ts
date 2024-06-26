import * as crypto from 'crypto'

/*
console.log(await youDaoTranslate("秋风不燥，时光不老，岁月静好，你我都好"));
{
    "code": 0,
    "dictResult": {},
    "translateResult": [
        [
            {
                "tgt": "The autumn wind is not dry, time is not old, years are quiet, you and I are good",
                "src": "秋风不燥，时光不老，岁月静好，你我都好",
                "srcPronounce": "qiū fēng bù zào, shí guāng bù lăo, suì yuè jìng hăo, nĭ wŏ dōuhăo"
            }
        ]
    ],
    "type": "zh-CHS2en"
}
*/

export const translate = async (text: string) => {
  const getMd5YD = function (e) {
    return crypto.createHash("md5").update(e.toString()).digest("hex")
  }
  const getSignYD = function (o, e) {
    return getMd5YD(`client=fanyideskweb&mysticTime=${o}&product=webfanyi&key=${e}`);
  }
  const o = (new Date).getTime();
  const e = "fsdsogkndfokasodnaso";
  const bodyJson = {
    i: text,
    from: "auto",
    to: "",
    dictResult: 'true',
    keyid: "webfanyi",
    sign: getSignYD(o, e),
    client: "fanyideskweb",
    product: "webfanyi",
    appVersion: "1.0.0",
    vendor: "web",
    pointParam: "client,mysticTime,product",
    mysticTime: o + '',
    keyfrom: "fanyi.web",
    mid: '1',
    screen: '1',
    model: '1',
    network: "wifi",
    abtest: '0',
    yduuid: "abcdefg",
  }
  const res = await window.publicApp.fetch("https://dict.youdao.com/webtranslate", {
    "headers": {
      "content-type": "application/x-www-form-urlencoded",
      "Referer": "https://fanyi.youdao.com/",
      "cookie": "OUTFOX_SEARCH_USER_ID_NCOO=1; OUTFOX_SEARCH_USER_ID=-1@127.0.0.1"
    },
    "body": new URLSearchParams(bodyJson).toString(),
    "method": "POST"
  });
  const resBase64 = res.text;
  const key = Buffer.from("08149da73c59ce62555b01e92f34e838", "hex")
  const iv = Buffer.from("d2bb1bfde83b38c344366357b79cae1c", "hex");
  const r = crypto.createDecipheriv("aes-128-cbc", key, iv);
  let s = r.update(resBase64, "base64", "utf8") as string;
  return s += r.final("utf-8")
}