import { get, ref, set } from "firebase/database";
import { database } from "./firebase";

export async function seedLevelConfig() {
  const levelRef = ref(database, "level_config");

  const snapshot = await get(levelRef);

  if (!snapshot.exists()) {
    await set(levelRef, {
      1: {
        level: 1,
        requiredPoint: 0,
        createdAt: Date.now(),
      },
      2: {
        level: 2,
        requiredPoint: 100,
        createdAt: Date.now(),
      },
      3: {
        level: 3,
        requiredPoint: 200,
        createdAt: Date.now(),
      },
      4: {
        level: 4,
        requiredPoint: 400,
        createdAt: Date.now(),
      },
      5: {
        level: 5,
        requiredPoint: 800,
        createdAt: Date.now(),
      },
      6: {
        level: 6,
        requiredPoint: 1600,
        createdAt: Date.now(),
      },
      7: {
        level: 7,
        requiredPoint: 3200,
        createdAt: Date.now(),
      },
      8: {
        level: 8,
        requiredPoint: 6400,
        createdAt: Date.now(),
      },
      9: {
        level: 9,
        requiredPoint: 12800,
        createdAt: Date.now(),
      },
      10: {
        level: 10,
        requiredPoint: 25600,
        createdAt: Date.now(),
      },
    });

    console.log("Level Config created!");
  }
}