import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";
import { auth } from "./auth.js";

const db = getDatabase();

// File management functions
export function loadFiles() {
  const filesRef = ref(db, 'files');
  return new Promise((resolve, reject) => {
    onValue(filesRef, (snapshot) => {
      if (snapshot.exists()) {
        resolve(snapshot.val());
      } else {
        reject(new Error("No files available"));
      }
    }, { onlyOnce: true });
  });
}
