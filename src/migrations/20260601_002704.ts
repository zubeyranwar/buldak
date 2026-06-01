import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_reservation_status" AS ENUM('pending', 'confirmed', 'cancelled');
  CREATE TYPE "public"."enum_table_layout_type" AS ENUM('square', 'round', 'rectangle');
  CREATE TYPE "public"."enum_table_layout_zone" AS ENUM('window', 'main-floor', 'bar-area', 'patio', 'private');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "catagory" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"is_default" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "menu" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"date" timestamp(3) with time zone NOT NULL,
  	"catagory_id" integer NOT NULL,
  	"price" numeric NOT NULL,
  	"old_price" numeric,
  	"volume" varchar,
  	"label" varchar,
  	"kcal" numeric,
  	"image_id" integer NOT NULL,
  	"slug" varchar NOT NULL,
  	"content" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "testimonal" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"video_url" varchar NOT NULL,
  	"cover_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "reservation_booked_chairs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"table_id" integer NOT NULL,
  	"chair_id" varchar NOT NULL
  );
  
  CREATE TABLE "reservation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"customer_name" varchar NOT NULL,
  	"customer_phone" varchar NOT NULL,
  	"customer_email" varchar,
  	"reservation_date" timestamp(3) with time zone NOT NULL,
  	"duration" numeric DEFAULT 90,
  	"status" "enum_reservation_status" DEFAULT 'confirmed',
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "floor_plan" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"background_image_id" integer,
  	"canvas_width" numeric DEFAULT 1100,
  	"canvas_height" numeric DEFAULT 700,
  	"theme_table_fill_color" varchar DEFAULT '#d4a96a',
  	"theme_chair_fill_color" varchar DEFAULT '#a8c5a0',
  	"theme_text_fill_color" varchar DEFAULT '#374151',
  	"theme_selection_color" varchar DEFAULT '#3b82f6',
  	"theme_booked_color" varchar DEFAULT '#ef4444',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "table_layout_chairs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"chair_id" varchar,
  	"seat_label" varchar,
  	"relative_position_x" numeric DEFAULT 0,
  	"relative_position_y" numeric DEFAULT 0
  );
  
  CREATE TABLE "table_layout" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"table_number" varchar,
  	"floor_id" integer,
  	"type" "enum_table_layout_type" DEFAULT 'square' NOT NULL,
  	"zone" "enum_table_layout_zone",
  	"capacity" numeric DEFAULT 4,
  	"position_x" numeric DEFAULT 100 NOT NULL,
  	"position_y" numeric DEFAULT 100 NOT NULL,
  	"position_rotation" numeric DEFAULT 0,
  	"width" numeric DEFAULT 60,
  	"height" numeric DEFAULT 60,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"catagory_id" integer,
  	"menu_id" integer,
  	"testimonal_id" integer,
  	"reservation_id" integer,
  	"floor_plan_id" integer,
  	"table_layout_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "menu" ADD CONSTRAINT "menu_catagory_id_catagory_id_fk" FOREIGN KEY ("catagory_id") REFERENCES "public"."catagory"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "menu" ADD CONSTRAINT "menu_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "testimonal" ADD CONSTRAINT "testimonal_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reservation_booked_chairs" ADD CONSTRAINT "reservation_booked_chairs_table_id_table_layout_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."table_layout"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reservation_booked_chairs" ADD CONSTRAINT "reservation_booked_chairs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reservation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "floor_plan" ADD CONSTRAINT "floor_plan_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "table_layout_chairs" ADD CONSTRAINT "table_layout_chairs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."table_layout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "table_layout" ADD CONSTRAINT "table_layout_floor_id_floor_plan_id_fk" FOREIGN KEY ("floor_id") REFERENCES "public"."floor_plan"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_catagory_fk" FOREIGN KEY ("catagory_id") REFERENCES "public"."catagory"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_menu_fk" FOREIGN KEY ("menu_id") REFERENCES "public"."menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_testimonal_fk" FOREIGN KEY ("testimonal_id") REFERENCES "public"."testimonal"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reservation_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_floor_plan_fk" FOREIGN KEY ("floor_plan_id") REFERENCES "public"."floor_plan"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_table_layout_fk" FOREIGN KEY ("table_layout_id") REFERENCES "public"."table_layout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "catagory_updated_at_idx" ON "catagory" USING btree ("updated_at");
  CREATE INDEX "catagory_created_at_idx" ON "catagory" USING btree ("created_at");
  CREATE INDEX "menu_catagory_idx" ON "menu" USING btree ("catagory_id");
  CREATE INDEX "menu_image_idx" ON "menu" USING btree ("image_id");
  CREATE UNIQUE INDEX "menu_slug_idx" ON "menu" USING btree ("slug");
  CREATE INDEX "menu_updated_at_idx" ON "menu" USING btree ("updated_at");
  CREATE INDEX "menu_created_at_idx" ON "menu" USING btree ("created_at");
  CREATE INDEX "testimonal_cover_image_idx" ON "testimonal" USING btree ("cover_image_id");
  CREATE INDEX "testimonal_updated_at_idx" ON "testimonal" USING btree ("updated_at");
  CREATE INDEX "testimonal_created_at_idx" ON "testimonal" USING btree ("created_at");
  CREATE INDEX "reservation_booked_chairs_order_idx" ON "reservation_booked_chairs" USING btree ("_order");
  CREATE INDEX "reservation_booked_chairs_parent_id_idx" ON "reservation_booked_chairs" USING btree ("_parent_id");
  CREATE INDEX "reservation_booked_chairs_table_idx" ON "reservation_booked_chairs" USING btree ("table_id");
  CREATE INDEX "reservation_updated_at_idx" ON "reservation" USING btree ("updated_at");
  CREATE INDEX "reservation_created_at_idx" ON "reservation" USING btree ("created_at");
  CREATE INDEX "floor_plan_background_image_idx" ON "floor_plan" USING btree ("background_image_id");
  CREATE INDEX "floor_plan_updated_at_idx" ON "floor_plan" USING btree ("updated_at");
  CREATE INDEX "floor_plan_created_at_idx" ON "floor_plan" USING btree ("created_at");
  CREATE INDEX "table_layout_chairs_order_idx" ON "table_layout_chairs" USING btree ("_order");
  CREATE INDEX "table_layout_chairs_parent_id_idx" ON "table_layout_chairs" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "table_layout_table_number_idx" ON "table_layout" USING btree ("table_number");
  CREATE INDEX "table_layout_floor_idx" ON "table_layout" USING btree ("floor_id");
  CREATE INDEX "table_layout_updated_at_idx" ON "table_layout" USING btree ("updated_at");
  CREATE INDEX "table_layout_created_at_idx" ON "table_layout" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_catagory_id_idx" ON "payload_locked_documents_rels" USING btree ("catagory_id");
  CREATE INDEX "payload_locked_documents_rels_menu_id_idx" ON "payload_locked_documents_rels" USING btree ("menu_id");
  CREATE INDEX "payload_locked_documents_rels_testimonal_id_idx" ON "payload_locked_documents_rels" USING btree ("testimonal_id");
  CREATE INDEX "payload_locked_documents_rels_reservation_id_idx" ON "payload_locked_documents_rels" USING btree ("reservation_id");
  CREATE INDEX "payload_locked_documents_rels_floor_plan_id_idx" ON "payload_locked_documents_rels" USING btree ("floor_plan_id");
  CREATE INDEX "payload_locked_documents_rels_table_layout_id_idx" ON "payload_locked_documents_rels" USING btree ("table_layout_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "catagory" CASCADE;
  DROP TABLE "menu" CASCADE;
  DROP TABLE "testimonal" CASCADE;
  DROP TABLE "reservation_booked_chairs" CASCADE;
  DROP TABLE "reservation" CASCADE;
  DROP TABLE "floor_plan" CASCADE;
  DROP TABLE "table_layout_chairs" CASCADE;
  DROP TABLE "table_layout" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_reservation_status";
  DROP TYPE "public"."enum_table_layout_type";
  DROP TYPE "public"."enum_table_layout_zone";`)
}
