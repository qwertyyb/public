import { spawnSync } from "child_process";
import { makeArgs } from "./utils";

const mdls = (filePath: string, args?: { attrs: string[] }) => {
  return spawnSync('mdls', [filePath, ...makeArgs(args?.attrs || [], '-attr')], { encoding: 'utf-8' })
    .stdout.split('\n')
    .reduce<Record<string, string>>((acc, line) => {
      if (!line) return acc;
      const [key, value] = line.split(' = ')
      return {
        ...acc,
        [key.trim()]: value === '(null)' ? null : value?.trim().replace(/^"(.*)"$/, '$1')
      }
    }, {})
}

export default mdls
