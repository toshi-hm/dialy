-- CreateTable
CREATE TABLE "diary_entries" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT,

    CONSTRAINT "diary_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diary_entry_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,

    CONSTRAINT "diary_entry_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "diary_entries_date_idx" ON "diary_entries"("date");

-- CreateIndex
CREATE INDEX "diary_entries_user_id_idx" ON "diary_entries"("user_id");

-- CreateIndex
-- MVP版: date のみで一意性を保証。
-- userId が NULL の場合、PostgreSQL の UNIQUE 制約は NULL 同士を重複扱いしないため
-- @@unique([date, userId]) では日付一意性を担保できない。
-- Phase 2 でマルチユーザー対応する際は (date, user_id) の複合 UNIQUE に変更する。
CREATE UNIQUE INDEX "diary_entries_date_key" ON "diary_entries"("date");

-- CreateIndex
CREATE INDEX "diary_entry_tags_entry_id_idx" ON "diary_entry_tags"("entry_id");

-- CreateIndex
CREATE UNIQUE INDEX "diary_entry_tags_entry_id_name_key" ON "diary_entry_tags"("entry_id", "name");

-- AddForeignKey
ALTER TABLE "diary_entry_tags" ADD CONSTRAINT "diary_entry_tags_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "diary_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
