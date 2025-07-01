export enum ContentType {
  text = 0,
  image = 1
}

export const getHash = async (data: Buffer) => {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // 将缓冲区转换为字节数组
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(""); // 将字节数组转换为十六进制字符串
  return hashHex;
}