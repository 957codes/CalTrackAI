// Web stub — no file system persistence needed, browser handles blob URLs

export async function persistPhoto(uri: string): Promise<string> {
  return uri;
}
