import type { IPluginCommand } from "@public/shared";

const formatCurrency = (amount: number) => {
  // JS 精度有问题, 简单处理一下
  return Math.round(amount * 100) / 100;
}

// 常用的几个汇率 CNY <-> HK <-> US <-> JP
const fetchExchangeRate = async () => {
  const r = await window.publicApp.fetch("https://www.safe.gov.cn/json/rmbData.json");
  const json: { currency: string; para1: string; middlerate: number; para2: string }[] =
    await r.json();
  const USDtoCNY = json.find(
    (i) => i.currency === "美元" && i.para1 === "人民币"
  )!;
  const EUtoCNY = json.find(
    (i) => i.currency === "欧元" && i.para1 === "人民币"
  )!;
  const JPtoCNY = json.find(
    (i) => i.currency === "日元" && i.para1 === "人民币"
  )!;
  const HKtoCNY = json.find(
    (i) => i.currency === "港元" && i.para1 === "人民币"
  )!;
  return {
    USDtoCNY: Number(USDtoCNY.para2) / USDtoCNY.middlerate,
    EUtoCNY: Number(EUtoCNY.para2) / EUtoCNY.middlerate,
    JPtoCNY: Number(JPtoCNY.para2) / JPtoCNY.middlerate,
    HKtoCNY: Number(HKtoCNY.para2) / HKtoCNY.middlerate,
    CNYtoUSD: USDtoCNY.middlerate / Number(USDtoCNY.para2),
    CNYtoEU: EUtoCNY.middlerate / Number(EUtoCNY.para2),
    CNYtoJP: JPtoCNY.middlerate / Number(JPtoCNY.para2),
    CNYtoHK: HKtoCNY.middlerate / Number(HKtoCNY.para2),
  };
}

const toCurrency = async (amount: number, source: string, to: string = 'CNY') => {
  if (!['USD', 'EU', 'JP', 'HK'].includes(source)) {
    return ''
  }
  const rate = await fetchExchangeRate()
  if (rate) {
    if (source === 'USD') {
      return formatCurrency(rate.USDtoCNY * amount)
    } else if (source === 'EU') {
      return formatCurrency(rate.EUtoCNY * amount)
    } else if (source === 'JP') {
      return formatCurrency(rate.JPtoCNY * amount)
    } else if (source === 'HK') {
      return formatCurrency(rate.HKtoCNY * amount)
    }
  }
  return ''
}

const toCurrencies = async (amount: number, source: string = 'CNY', to: string[] = ['USD', 'EU', 'JP', 'HK']) => {
  const rates = await fetchExchangeRate()
  if (rates) {
    const results: [string, number][] = []
    for (const item of to) {
      if (item === 'USD') {
        results.push(['USD', formatCurrency(rates.CNYtoUSD * amount)])
      } else if (item === 'EU') {
        results.push(['EU', formatCurrency(rates.CNYtoEU * amount)])
      } else if (item === 'JP') {
        results.push(['JP', formatCurrency(rates.CNYtoJP * amount)])
      } else if (item === 'HK') {
        results.push(['HK', formatCurrency(rates.CNYtoHK * amount)])
      }
    }
    return results
  }
  return []
}

// 从用户输入中提取金额和货币类型，如果货币类型是人民币，则转换为美元、欧元、日元和港元，否则转换为人民币
export const transformCurrency = async (keyword: string): Promise<IPluginCommand[]> => {
  // 解析货币输入的几种格式 $100、 100usd、 usd100、 usd 100、 100 usd
  let source: string = ''
  let amount: number = 0
  let match = keyword.match(/^(USD|EU|JP|HK|CNY|\$)\s?([\d\.]+)/i);
  if (match) {
    source = match[1].toUpperCase()
    source = source === '$' ? 'USD' : source
    amount = Number(match[2])
  } else if (keyword.match(/^([\d\.]+)\s?(USD|EU|JP|HK|CNY|\$)/i)) {
    match = keyword.match(/^([\d\.]+)\s?(USD|EU|JP|HK|CNY|\$)/i)!;
    source = match[2].toUpperCase()
    source = source === '$' ? 'USD' : source
    amount = Number(match[1])
  }
  if (!source || !amount) {
    return []
  }
  if (source === 'CNY') {
    const results = await toCurrencies(amount, source);
    return results.map((item) => {
      return {
        icon: "",
        name: "currency",
        title: `${amount} ${source} = ${item[1]} ${item[0]}`,
        value: item[1],
        subtitle: "汇率",
      };
    });
  }
  const result = await toCurrency(amount, source);
  return [
    {
      icon: "",
      name: "currency",
      title: `${amount} ${source} = ${result} CNY`,
      value: result,
      subtitle: "汇率",
    },
  ];
}