export const makeArgs = (array: string[], argName: string) => (
  array.map(item => [argName, item]).flat()
)