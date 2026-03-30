-- CreateTable
CREATE TABLE "_BabyListArticles" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_BabyListArticles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_BabyListArticles_B_index" ON "_BabyListArticles"("B");

-- AddForeignKey
ALTER TABLE "_BabyListArticles" ADD CONSTRAINT "_BabyListArticles_A_fkey" FOREIGN KEY ("A") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BabyListArticles" ADD CONSTRAINT "_BabyListArticles_B_fkey" FOREIGN KEY ("B") REFERENCES "BabyList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
