import { postgresAdapter } from "@payloadcms/db-postgres";
import { cloudStoragePlugin } from "@payloadcms/plugin-cloud-storage";
import type { HandleDelete, HandleUpload } from "@payloadcms/plugin-cloud-storage/types";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import type { UploadApiResponse } from "cloudinary";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import { buildConfig } from "payload";
import sharp from "sharp";
import { fileURLToPath } from "url";

import { Catagory } from "./collections/Catagory";
import { FloorPlan } from "./collections/FloorPlan";
import { Media } from "./collections/Media";
import { Menu } from "./collections/Menu";
import { Reservation } from "./collections/Reservation";
import { TableLayout } from "./collections/TableLayout";
import { Testimonal } from "./collections/Testimonal";
import { Users } from "./collections/Users";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryAdapter = () => ({
  name: "cloudinary-adapter",

  async handleUpload({ file }: Parameters<HandleUpload>[0]) {
    try {
      const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "auto",
            public_id: `media/${file.filename.replace(/\.[^/.]+$/, "")}`,
            overwrite: false,
            use_filename: true,
          },
          (error, result) => {
            if (error) return reject(error);
            if (!result) return reject(new Error("No result from Cloudinary"));
            resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });

      file.filename = uploadResult.public_id;
      file.mimeType = uploadResult.format;
      file.filesize = uploadResult.bytes;
    } catch (err) {
      console.error("Cloudinary Upload Error:", err);
    }
  },

  async handleDelete({ filename }: Parameters<HandleDelete>[0]) {
    try {
      await cloudinary.uploader.destroy(
        `media/${filename.replace(/\.[^/.]+$/, "")}`
      );
    } catch (error) {
      console.error("Cloudinary Delete Error:", error);
    }
  },

  staticHandler() {
    return new Response("Not implemented", { status: 501 });
  },
});

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Catagory, Menu, Testimonal, Reservation, FloorPlan, TableLayout],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || "",
    },
  }),
  sharp,
  plugins: [
    cloudStoragePlugin({
      collections: {
        media: {
          adapter: cloudinaryAdapter,
          disableLocalStorage: true,
          generateFileURL: ({ filename }) =>
            cloudinary.url(`media/${filename}`, { secure: true }),
        },
      },
    }),
  ],
});