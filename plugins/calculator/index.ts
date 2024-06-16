
import { clipboard } from 'electron';
import { create, all } from "mathjs";
import { CommonListItem, PublicPlugin } from 'shared/types/plugin';

const DECIMAL_SEPARATOR = '.'
const ARG_SEPARATOR = ','

const mathjs = create(all, {
  relTol: 1e-12,
  absTol: 1e-15,
  matrix: 'Matrix',
  number: 'BigNumber',
  precision: 64,
  predictable: false,
  randomSeed: null
})

export class Calculator {
  public static isValidInput(input: string): boolean {
    const blackListInputs = ["version", "i"];

    if (input.length === 0) {
      return false;
    }

    if (blackListInputs.find((b) => input === b) !== undefined) {
      return false;
    }

    let result;
    try {
      // Mathjs throws an error when input cannot be evaluated
      result = mathjs.evaluate?.(this.normalizeInput(input));
    } catch (e) {
      return false;
    }

    if (result === undefined) {
      return false;
    }

    return !isNaN(result)
      || false;
  }

  private static normalizeInput(input: string) {
    return input.replace(
      new RegExp(`\\${DECIMAL_SEPARATOR}|\\${ARG_SEPARATOR}`, 'g'),
      (match) => match === DECIMAL_SEPARATOR ? '.' : ',');
  }

  public static calculate(input: string): string {
    const result: string = mathjs.evaluate?.(this.normalizeInput(input)).toString();
    return result.replace(
      new RegExp(',|\\.', 'g'),
      (match) => match === '.' ? DECIMAL_SEPARATOR : ARG_SEPARATOR);
  }
}

const COMMAND = 'calculator'

class CalculatorPlugin implements PublicPlugin {
  app: any

  icon = 'https://img.icons8.com/plasticine/100/000000/apple-calculator.png'
  title = '计算器'
  subtitle = '快捷计算表达式'

  constructor(app: any) {
    this.app = app
  }

  onInput(
    keyword: string
  ) {
    if (Calculator.isValidInput(keyword)) {
      const result = Calculator.calculate(keyword)
      this.app.setList([
        {
          title: `= ${result}`,
          subtitle: '点击复制到剪切板',
          icon: 'https://img.icons8.com/plasticine/100/000000/apple-calculator.png',
          text: `${result}`,
          key: 'plugin:calculator',
          onEnter: (item: CommonListItem) => {
            clipboard.writeText(String(item.text))
          }
        }
      ])
    } else {
      this.app.setList([])
    }
  }
}

export default (app: any) => new CalculatorPlugin(app)