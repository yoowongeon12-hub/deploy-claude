-- CreateTable
CREATE TABLE `tbl_member` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `memberEmail` VARCHAR(191) NOT NULL,
    `memberPassword` VARCHAR(191) NOT NULL,
    `memberName` VARCHAR(191) NOT NULL,
    `memberAge` INTEGER NOT NULL,
    `memberCreateAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tbl_member_memberEmail_key`(`memberEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_todo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `memberId` INTEGER NOT NULL,
    `content` VARCHAR(200) NOT NULL,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,

    INDEX `tbl_todo_memberId_createdAt_idx`(`memberId`, `createdAt` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_post` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(200) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `author_name` VARCHAR(100) NOT NULL,
    `view_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `tbl_post_created_at_idx`(`created_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tbl_comment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `post_id` INTEGER NOT NULL,
    `content` VARCHAR(2000) NOT NULL,
    `author_name` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `tbl_comment_post_id_created_at_idx`(`post_id`, `created_at` ASC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tbl_todo` ADD CONSTRAINT `tbl_todo_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `tbl_member`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tbl_comment` ADD CONSTRAINT `tbl_comment_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `tbl_post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
