-- devchat_demo.ai_interaction definition

CREATE TABLE `ai_interaction` (
  `ai_interaction_id` varchar(36) NOT NULL,
  `ai_session_id` varchar(255) NOT NULL,
  `message_id` varchar(255) DEFAULT NULL,
  `ai_response` text,
  `ai_model` varchar(100) DEFAULT NULL,
  `context_data` json DEFAULT NULL,
  `response_time` int DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deleted_at` datetime DEFAULT NULL,
  `created_by` varchar(255) NOT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `deleted_by` varchar(255) DEFAULT NULL,
  `is_active` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`ai_interaction_id`),
  KEY `idx_ai_interaction_normal_sessionId` (`ai_session_id`),
  KEY `idx_ai_interaction_normal_messageId` (`message_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- devchat_demo.ai_session definition

CREATE TABLE `ai_session` (
  `ai_session_id` varchar(36) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `channel_id` varchar(255) DEFAULT NULL,
  `thread_id` varchar(255) DEFAULT NULL,
  `session_type` varchar(50) NOT NULL,
  `started_at` timestamp NOT NULL,
  `ended_at` timestamp NULL DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`ai_session_id`),
  KEY `idx_ai_session_normal_userId` (`user_id`),
  KEY `idx_ai_session_normal_channelId` (`channel_id`),
  KEY `idx_ai_session_normal_threadId` (`thread_id`),
  KEY `idx_ai_session_normal_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- devchat_demo.attachment definition

CREATE TABLE `attachment` (
  `attachment_id` varchar(36) NOT NULL,
  `message_id` varchar(255) DEFAULT NULL,
  `channel_id` varchar(255) DEFAULT NULL,
  `thread_id` varchar(255) DEFAULT NULL,
  `to_user_id` varchar(255) DEFAULT NULL,
  `file_name` varchar(255) NOT NULL,
  `original_file_name` varchar(255) NOT NULL,
  `file_path` text NOT NULL,
  `file_size` int NOT NULL,
  `file_type` varchar(100) NOT NULL,
  `folder` varchar(100) NOT NULL,
  `format` varchar(50) NOT NULL,
  `public_id` varchar(255) NOT NULL,
  `uploaded_by` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`attachment_id`),
  KEY `idx_attachment_normal_messageId` (`message_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- devchat_demo.audit_log definition

CREATE TABLE `audit_log` (
  `audit_log_id` varchar(36) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(100) NOT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `created_by` varchar(255) NOT NULL,
  PRIMARY KEY (`audit_log_id`),
  KEY `idx_audit_log_normal_userId` (`user_id`),
  KEY `idx_audit_log_normal_entityType` (`entity_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- devchat_demo.channel definition

CREATE TABLE `channel` (
  `channel_id` varchar(36) NOT NULL,
  `channel_name` varchar(255) NOT NULL,
  `group_id` varchar(255) NOT NULL,
  `channel_description` varchar(255) DEFAULT NULL,
  `created_by` varchar(255) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`channel_id`),
  KEY `idx_channel_unique_name` (`channel_name`),
  KEY `idx_channel_normal_group` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- devchat_demo.code_block definition

CREATE TABLE `code_block` (
  `code_block_id` varchar(36) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `to_user_id` varchar(255) DEFAULT NULL,
  `channel_id` varchar(255) DEFAULT NULL,
  `language` varchar(50) NOT NULL,
  `code` text NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deleted_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`code_block_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- devchat_demo.code_collaboration definition

CREATE TABLE `code_collaboration` (
  `code_collaboration_id` varchar(36) NOT NULL,
  `code_block_id` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `created_by` varchar(255) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`code_collaboration_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- devchat_demo.direct_message definition

CREATE TABLE `direct_message` (
  `direct_message_id` varchar(36) NOT NULL,
  `from_user_id` varchar(255) NOT NULL,
  `to_user_id` varchar(255) NOT NULL,
  `parent_message_id` varchar(255) DEFAULT NULL,
  `content` text NOT NULL,
  `code_block_id` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`direct_message_id`),
  UNIQUE KEY `REL_aaf6406545e70b16d4fdbd1083` (`code_block_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- devchat_demo.friend_request definition

CREATE TABLE `friend_request` (
  `friend_request_id` varchar(36) NOT NULL,
  `from_user_id` varchar(255) NOT NULL,
  `to_user_id` varchar(255) NOT NULL,
  `message` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(255) NOT NULL,
  PRIMARY KEY (`friend_request_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- devchat_demo.`group` definition

CREATE TABLE `group` (
  `group_id` varchar(36) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text,
  `avatar` varchar(255) DEFAULT NULL,
  `created_by` varchar(255) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `is_active` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`group_id`),
  KEY `idx_group_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- devchat_demo.group_invitation definition

CREATE TABLE `group_invitation` (
  `group_invitation_id` varchar(36) NOT NULL,
  `from_user_id` varchar(255) NOT NULL,
  `to_user_id` varchar(255) NOT NULL,
  `group_id` varchar(255) NOT NULL,
  `message` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(255) NOT NULL,
  PRIMARY KEY (`group_invitation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- devchat_demo.message definition

CREATE TABLE `message` (
  `message_id` varchar(36) NOT NULL,
  `channel_id` varchar(255) NOT NULL,
  `parent_message_id` varchar(255) DEFAULT NULL,
  `content` text NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `deleted_at` datetime DEFAULT NULL,
  `sender_id` varchar(255) NOT NULL,
  `code_block_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`message_id`),
  UNIQUE KEY `REL_6bf75fb69daacbb0781e9dd15b` (`code_block_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- devchat_demo.migrations definition

CREATE TABLE `migrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `timestamp` bigint NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- devchat_demo.notification definition

CREATE TABLE `notification` (
  `notification_id` varchar(36) NOT NULL,
  `to_user_id` varchar(255) NOT NULL,
  `notification_title` varchar(255) NOT NULL,
  `notification_content` varchar(255) NOT NULL,
  `notification_source` varchar(255) NOT NULL,
  `is_read` tinyint NOT NULL DEFAULT '0',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `toUserId` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`notification_id`),
  KEY `idx_notification_normal_toUserId` (`toUserId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- devchat_demo.password_reset_token definition

CREATE TABLE `password_reset_token` (
  `password_reset_token_id` varchar(36) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `verify_code` varchar(10) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `attempts` int NOT NULL DEFAULT '0',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`password_reset_token_id`),
  KEY `idx_password_reset_token_normal_userId` (`user_id`),
  KEY `idx_password_reset_token_normal_verifyCode` (`verify_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- devchat_demo.permission definition

CREATE TABLE `permission` (
  `permission_id` varchar(36) NOT NULL,
  `permission_code` varchar(100) NOT NULL,
  `permission_name` varchar(200) NOT NULL,
  `permission_description` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(255) NOT NULL,
  `updated_by` varchar(255) DEFAULT NULL,
  `deleted_by` varchar(255) DEFAULT NULL,
  `is_active` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`permission_id`),
  UNIQUE KEY `IDX_bbb1d0904fff8197fcc1425a22` (`permission_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- devchat_demo.report definition

CREATE TABLE `report` (
  `report_id` varchar(36) NOT NULL,
  `content` varchar(255) DEFAULT NULL,
  `created_by` varchar(255) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `message_id` varchar(255) NOT NULL,
  `message_type` varchar(255) NOT NULL,
  PRIMARY KEY (`report_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- devchat_demo.report_category definition

CREATE TABLE `report_category` (
  `report_category_id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `is_removed` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`report_category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- devchat_demo.report_report_category definition

CREATE TABLE `report_report_category` (
  `report_report_category_id` varchar(36) NOT NULL,
  `report_id` varchar(255) NOT NULL,
  `report_category_id` varchar(255) NOT NULL,
  PRIMARY KEY (`report_report_category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- devchat_demo.supported_programming_language definition

CREATE TABLE `supported_programming_language` (
  `supported_programming_language_id` varchar(36) NOT NULL,
  `language_code` varchar(50) NOT NULL,
  `language_name` varchar(100) NOT NULL,
  `language_icon` text,
  `language_version` varchar(50) DEFAULT NULL,
  `syntax_highlighting` text,
  `code_executions` int NOT NULL DEFAULT '0',
  `is_executable` tinyint NOT NULL DEFAULT '0',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `created_by` varchar(255) NOT NULL,
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updated_by` varchar(255) NOT NULL,
  `is_active` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`supported_programming_language_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- devchat_demo.task definition

CREATE TABLE `task` (
  `task_id` varchar(36) NOT NULL,
  `assignee_id` varchar(255) DEFAULT NULL,
  `group_id` varchar(255) NOT NULL,
  `created_by` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `status` int NOT NULL DEFAULT '0',
  `priority` int NOT NULL DEFAULT '1',
  `start_date` timestamp NULL DEFAULT NULL,
  `due_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- devchat_demo.thread definition

CREATE TABLE `thread` (
  `thread_id` varchar(36) NOT NULL,
  `thread_name` varchar(255) NOT NULL,
  `message_id` varchar(255) NOT NULL,
  `channel_id` varchar(255) NOT NULL,
  `created_by` varchar(255) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`thread_id`),
  UNIQUE KEY `REL_93b930acb465111c491d847656` (`message_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- devchat_demo.thread_message definition

CREATE TABLE `thread_message` (
  `thread_message_id` varchar(36) NOT NULL,
  `content` text NOT NULL,
  `parent_message_id` varchar(255) DEFAULT NULL,
  `sender_id` varchar(255) NOT NULL,
  `thread_id` varchar(255) NOT NULL,
  `channel_id` varchar(255) NOT NULL,
  `code_block_id` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`thread_message_id`),
  UNIQUE KEY `REL_c5238c6d26e7a9e27008b8cadf` (`code_block_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- devchat_demo.todo definition

CREATE TABLE `todo` (
  `todo_id` varchar(36) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `priority` int NOT NULL DEFAULT '1',
  `status` int NOT NULL DEFAULT '0',
  `due_date` datetime DEFAULT NULL,
  `is_active` tinyint NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`todo_id`),
  KEY `idx_todo_normal_userId` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- devchat_demo.`user` definition

CREATE TABLE `user` (
  `user_id` varchar(36) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `avatar_url` text,
  `is_active` tinyint NOT NULL DEFAULT '1',
  `email_verified` tinyint NOT NULL DEFAULT '0',
  `email_verification_token` text,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `last_login` datetime DEFAULT NULL,
  `timezone` varchar(50) DEFAULT NULL,
  `is_admin` tinyint NOT NULL DEFAULT '0',
  `is_bot` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `idx_user_unique_username` (`username`),
  UNIQUE KEY `idx_user_unique_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- devchat_demo.user_friend definition

CREATE TABLE `user_friend` (
  `user_friend_id` varchar(36) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `friend_id` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_friend_id`),
  UNIQUE KEY `IDX_bc1cde790176bded7ee2fedb4c` (`user_id`,`friend_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- devchat_demo.user_group definition

CREATE TABLE `user_group` (
  `user_group_id` varchar(36) NOT NULL,
  `group_id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `added_by` varchar(255) NOT NULL,
  `joined_at` datetime DEFAULT NULL,
  `invited_at` datetime NOT NULL,
  PRIMARY KEY (`user_group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- devchat_demo.user_language_collection definition

CREATE TABLE `user_language_collection` (
  `user_language_collection_id` varchar(36) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `language_id` varchar(255) NOT NULL,
  `proficiency_level` varchar(50) NOT NULL,
  `order_index` int NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `created_by` varchar(255) NOT NULL,
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `updated_by` varchar(255) NOT NULL,
  `is_active` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`user_language_collection_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- devchat_demo.user_message_delete definition

CREATE TABLE `user_message_delete` (
  `user_message_delete_id` varchar(36) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `message_id` varchar(255) NOT NULL,
  `deleted_at` datetime NOT NULL,
  PRIMARY KEY (`user_message_delete_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;