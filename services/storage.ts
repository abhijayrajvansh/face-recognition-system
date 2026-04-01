import { getAdminStorage } from "@/lib/firebase-admin";

export const uploadBufferToStorage = async ({
  buffer,
  contentType,
  path,
}: {
  buffer: Buffer;
  contentType: string;
  path: string;
}) => {
  const bucket = getAdminStorage().bucket();
  const file = bucket.file(path);

  await file.save(buffer, {
    resumable: false,
    contentType,
    metadata: {
      contentType,
    },
  });

  return {
    storagePath: path,
    downloadURL: `gs://${bucket.name}/${path}`,
  };
};
