import type * as faceapiType from "@vladmandic/face-api";

let faceapi: typeof faceapiType | null = null;

export async function getFaceApi() {
  if (typeof window === "undefined") return null;
  if (!faceapi) {
    faceapi = await import("@vladmandic/face-api");
  }
  return faceapi;
}

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";

let modelsLoaded = false;

export async function loadFaceApiModels() {
  const api = await getFaceApi();
  if (!api) return false;
  if (modelsLoaded) return true;

  try {
    await Promise.all([
      api.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      api.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      api.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
    return true;
  } catch (error) {
    console.error("Gagal memuat model face-api:", error);
    return false;
  }
}

export async function getFaceDescriptorFromBase64(base64Image: string): Promise<Float32Array | null> {
  const api = await getFaceApi();
  if (!api) return null;
  
  const isLoaded = await loadFaceApiModels();
  if (!isLoaded) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Image;
    img.onload = async () => {
      try {
        const detection = await api
          .detectSingleFace(img, new api.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptor();
        
        if (!detection) {
          resolve(null);
        } else {
          resolve(detection.descriptor);
        }
      } catch (err) {
        console.error("Error detecting face from image:", err);
        resolve(null);
      }
    };
    img.onerror = () => {
      resolve(null);
    };
  });
}

export function compareFaceDescriptors(desc1: number[] | Float32Array, desc2: number[] | Float32Array, threshold = 0.45): { match: boolean; distance: number } {
  const arr1 = desc1 instanceof Float32Array ? Array.from(desc1) : desc1;
  const arr2 = desc2 instanceof Float32Array ? Array.from(desc2) : desc2;

  if (arr1.length !== arr2.length || arr1.length === 0) {
    return { match: false, distance: 1 };
  }

  let sum = 0;
  for (let i = 0; i < arr1.length; i++) {
    sum += Math.pow(arr1[i] - arr2[i], 2);
  }
  const distance = Math.sqrt(sum);
  return {
    match: distance < threshold,
    distance,
  };
}
