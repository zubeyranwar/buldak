import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "table_layout" ADD COLUMN "current_chair_count" numeric DEFAULT 4;
  UPDATE "table_layout"
  SET "current_chair_count" = COALESCE(chair_counts.count, "table_layout"."capacity", 4)
  FROM (
    SELECT "_parent_id", COUNT(*)::numeric AS count
    FROM "table_layout_chairs"
    GROUP BY "_parent_id"
  ) AS chair_counts
  WHERE "table_layout"."id" = chair_counts."_parent_id";

  ALTER TABLE "reservation" ADD COLUMN "party_size" numeric DEFAULT 2 NOT NULL;

  CREATE TABLE "reservation_reserved_tables" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"table_id" integer NOT NULL
  );

  ALTER TABLE "reservation_reserved_tables" ADD CONSTRAINT "reservation_reserved_tables_table_id_table_layout_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."table_layout"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reservation_reserved_tables" ADD CONSTRAINT "reservation_reserved_tables_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."reservation"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "reservation_reserved_tables_order_idx" ON "reservation_reserved_tables" USING btree ("_order");
  CREATE INDEX "reservation_reserved_tables_parent_id_idx" ON "reservation_reserved_tables" USING btree ("_parent_id");
  CREATE INDEX "reservation_reserved_tables_table_idx" ON "reservation_reserved_tables" USING btree ("table_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE "reservation_reserved_tables" CASCADE;
  ALTER TABLE "reservation" DROP COLUMN "party_size";
  ALTER TABLE "table_layout" DROP COLUMN "current_chair_count";`)
}
