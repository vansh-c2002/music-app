import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { parseMusicXml } from "./parse-musicxml";

export interface SavedScore {
  id: string;
  title: string;
  fileName: string;
  createdAt: Date;
  updatedAt: Date;
  musicXml: string;
  thumbnailDataUrl: string | null;
  info: {
    keyFifths: number;
    keyMode: string;
    beats: number;
    beatType: number;
  };
}

export async function saveScore(
  uid: string,
  musicXml: string,
  fileName: string,
  thumbnailDataUrl: string | null
): Promise<string> {
  let info = { keyFifths: 0, keyMode: "major", beats: 4, beatType: 4 };
  let title = fileName.replace(/\.[^.]+$/, "");

  try {
    const parsed = parseMusicXml(musicXml);
    info = {
      keyFifths: parsed.info.keyFifths,
      keyMode: parsed.info.keyMode,
      beats: parsed.info.beats,
      beatType: parsed.info.beatType,
    };
    if (parsed.info.title && parsed.info.title !== "Untitled") {
      title = parsed.info.title;
    }
  } catch {
    // keep defaults
  }

  const docRef = await addDoc(collection(db, "users", uid, "scores"), {
    title,
    fileName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    musicXml,
    thumbnailDataUrl: thumbnailDataUrl ?? null,
    info,
  });

  return docRef.id;
}

export async function deleteScore(uid: string, scoreId: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "scores", scoreId));
}
