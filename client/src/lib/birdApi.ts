import { apiRequest } from "./queryClient";
import { IdentificationResult } from "@shared/schema";

interface IdentifyImageParams {
  image: string;
  source: "camera" | "upload";
}

export async function identifyBirdImage({ image, source }: IdentifyImageParams): Promise<IdentificationResult> {
  const response = await apiRequest("POST", "/api/identify", { image, source });
  return await response.json();
}
