import { File, Paths, Directory } from "expo-file-system";

const PHOTO_DIR_NAME = "meal-photos";

/**
 * Copy a temp photo URI to the persistent app document directory.
 * Returns the new persistent URI.
 */
export async function persistPhoto(tempUri: string): Promise<string> {
  const photoDir = new Directory(Paths.document, PHOTO_DIR_NAME);
  if (!photoDir.exists) {
    photoDir.create();
  }

  const filename = `meal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
  const src = new File(tempUri);
  const dest = new File(photoDir, filename);
  src.copy(dest);
  return dest.uri;
}
