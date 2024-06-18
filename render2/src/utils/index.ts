export const getTargetInfo = (result: Record<string, any[]>, target: any) => {
  let targetKey: string | null = null
  let targetIndex: number = -1
  for (const [name, list] of Object.entries(result)) {
    const index = list.indexOf(target)
    if (index !== -1) {
      // 找到了
      targetIndex = index
      targetKey = name
      break;
    }
  }
  return { targetKey, targetIndex }
}