import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { Platform } from "react-native";
import { getApiUrl } from "@/lib/query-client";

export type PhotoStatus = "available" | "missing" | "none";

export interface PhotoInfo {
  status: PhotoStatus;
  uri: string | null;
  exists: boolean;
}

const PHOTOS_DIR = "weeklyPhotos";

function getPhotosDirectory(): string {
  if (Platform.OS === "web") {
    return "";
  }
  return `${FileSystem.documentDirectory}${PHOTOS_DIR}/`;
}

function getChallengePhotosDirectory(challengeId: string): string {
  return `${getPhotosDirectory()}${challengeId}/`;
}

function getPermanentPhotoPath(challengeId: string, weekNumber: number, ext: string = "jpg"): string {
  return `${getChallengePhotosDirectory(challengeId)}week-${weekNumber}.${ext}`;
}

function getExtensionFromUri(uri: string): string {
  const uriLower = uri.toLowerCase();
  if (uriLower.includes(".png")) return "png";
  if (uriLower.includes(".heic")) return "heic";
  if (uriLower.includes(".heif")) return "heif";
  if (uriLower.includes(".webp")) return "webp";
  if (uriLower.includes(".gif")) return "gif";
  return "jpg";
}

function isTemporaryUri(uri: string): boolean {
  if (!uri) return false;
  const uriLower = uri.toLowerCase();
  return (
    uriLower.includes("/tmp/") ||
    uriLower.includes("/cache/") ||
    uriLower.includes("/caches/") ||
    uriLower.includes("imagepicker") ||
    uriLower.includes("expo-image") ||
    uriLower.startsWith("content://") ||
    uriLower.includes("/com.apple.mobileslideshow") ||
    (uriLower.includes("/var/mobile/") && !uriLower.includes("/documents/"))
  );
}

function isPermanentUri(uri: string, challengeId: string): boolean {
  if (!uri) return false;
  return uri.includes(`${PHOTOS_DIR}/${challengeId}/week-`);
}

export async function ensurePhotosDirectoryExists(challengeId: string): Promise<void> {
  if (Platform.OS === "web") return;
  
  try {
    const dir = getChallengePhotosDirectory(challengeId);
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  } catch (error) {
    console.log("Error creating photos directory:", error);
  }
}

function isRemoteUri(uri: string): boolean {
  if (!uri) return false;
  const uriLower = uri.toLowerCase();
  return uriLower.startsWith("http://") || 
         uriLower.startsWith("https://") || 
         uriLower.startsWith("data:");
}

function isRelativeServerUri(uri: string): boolean {
  if (!uri) return false;
  return uri.startsWith("/") && !uri.startsWith("//");
}

function resolveToFullUrl(uri: string): string {
  if (!uri) return uri;
  if (isRemoteUri(uri)) return uri;
  if (isRelativeServerUri(uri)) {
    try {
      const baseUrl = getApiUrl();
      return new URL(uri, baseUrl).href;
    } catch (e) {
      return uri;
    }
  }
  return uri;
}

export async function checkPhotoExists(uri: string | null | undefined): Promise<boolean> {
  if (!uri) return false;
  if (Platform.OS === "web") return true;
  
  if (isRemoteUri(uri) || isRelativeServerUri(uri)) {
    return true;
  }
  
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists;
  } catch (error) {
    return false;
  }
}

export async function getPhotoInfo(imageUri: string | null | undefined): Promise<PhotoInfo> {
  if (!imageUri) {
    return { status: "none", uri: null, exists: false };
  }
  
  if (Platform.OS === "web") {
    return { status: "available", uri: imageUri, exists: true };
  }
  
  const exists = await checkPhotoExists(imageUri);
  
  if (exists) {
    return { status: "available", uri: imageUri, exists: true };
  }
  
  return { status: "missing", uri: imageUri, exists: false };
}

export async function savePhotoToPermanentStorage(
  sourceUri: string,
  challengeId: string,
  weekNumber: number,
  compress: boolean = true
): Promise<string> {
  if (Platform.OS === "web") {
    return sourceUri;
  }
  
  try {
    await ensurePhotosDirectoryExists(challengeId);
    
    let processedUri = sourceUri;
    let ext = "jpg";
    
    if (compress) {
      try {
        const manipulated = await ImageManipulator.manipulateAsync(
          sourceUri,
          [{ resize: { height: 1200 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        processedUri = manipulated.uri;
        ext = "jpg";
      } catch (manipError) {
        console.log("Image manipulation failed, using original:", manipError);
        ext = getExtensionFromUri(sourceUri);
      }
    } else {
      ext = getExtensionFromUri(sourceUri);
    }
    
    const permanentPath = getPermanentPhotoPath(challengeId, weekNumber, ext);
    
    const existingInfo = await FileSystem.getInfoAsync(permanentPath);
    if (existingInfo.exists) {
      await FileSystem.deleteAsync(permanentPath, { idempotent: true });
    }
    
    await FileSystem.copyAsync({ from: processedUri, to: permanentPath });
    
    if (compress && processedUri !== sourceUri) {
      try {
        await FileSystem.deleteAsync(processedUri, { idempotent: true });
      } catch (e) {
      }
    }
    
    return permanentPath;
  } catch (error) {
    console.log("Failed to save photo to permanent storage:", error);
    return sourceUri;
  }
}

export async function migratePhotoIfNeeded(
  imageUri: string,
  challengeId: string,
  weekNumber: number
): Promise<{ newUri: string; migrated: boolean; exists: boolean }> {
  if (Platform.OS === "web") {
    return { newUri: imageUri, migrated: false, exists: true };
  }
  
  if (isPermanentUri(imageUri, challengeId)) {
    const exists = await checkPhotoExists(imageUri);
    return { newUri: imageUri, migrated: false, exists };
  }
  
  if (isTemporaryUri(imageUri)) {
    const exists = await checkPhotoExists(imageUri);
    
    if (exists) {
      const permanentUri = await savePhotoToPermanentStorage(imageUri, challengeId, weekNumber, true);
      return { newUri: permanentUri, migrated: true, exists: true };
    }
    
    return { newUri: imageUri, migrated: false, exists: false };
  }
  
  const exists = await checkPhotoExists(imageUri);
  return { newUri: imageUri, migrated: false, exists };
}

export async function deletePhoto(
  challengeId: string,
  weekNumber: number
): Promise<void> {
  if (Platform.OS === "web") return;
  
  try {
    const extensions = ["jpg", "png", "heic", "heif", "webp", "gif"];
    for (const ext of extensions) {
      const path = getPermanentPhotoPath(challengeId, weekNumber, ext);
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists) {
        await FileSystem.deleteAsync(path, { idempotent: true });
      }
    }
  } catch (error) {
    console.log("Error deleting photo:", error);
  }
}

async function fetchRemoteImageAsBase64(uri: string): Promise<string | null> {
  try {
    const response = await fetch(uri);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.log("Failed to fetch remote image:", e);
    return null;
  }
}

export async function getPhotoBase64ForPDF(imageUri: string | null | undefined): Promise<string | null> {
  if (!imageUri) return null;
  
  if (imageUri.startsWith("data:")) {
    return imageUri;
  }
  
  if (Platform.OS === "web" || isRemoteUri(imageUri) || isRelativeServerUri(imageUri)) {
    const fullUrl = resolveToFullUrl(imageUri);
    return fetchRemoteImageAsBase64(fullUrl);
  }
  
  try {
    const exists = await checkPhotoExists(imageUri);
    if (!exists) return null;
    
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    const uriLower = imageUri.toLowerCase();
    let mimeType = "image/jpeg";
    if (uriLower.includes(".png")) mimeType = "image/png";
    else if (uriLower.includes(".gif")) mimeType = "image/gif";
    else if (uriLower.includes(".webp")) mimeType = "image/webp";
    else if (uriLower.includes(".heic") || uriLower.includes(".heif")) mimeType = "image/heic";
    
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.log("Failed to convert photo to base64:", error);
    return null;
  }
}
