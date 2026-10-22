import { z } from "zod";

/** What the Management API sends, checked at run time. Only the fields the admin screens use. */

export const pageMetaSchema = z.object({ page: z.number(), limit: z.number(), total: z.number(), totalPages: z.number() });
export type PageMeta = z.infer<typeof pageMetaSchema>;

export const statusSchema = z.enum(["DRAFT", "PUBLISHED"]);
export type Status = z.infer<typeof statusSchema>;
export const visibilitySchema = z.enum(["PUBLIC", "AUTHENTICATED", "ROLES", "DRAFT"]);
export const kindSchema = z.enum(["CONCEPT", "QUESTION", "EXAMPLE"]);
export type Kind = z.infer<typeof kindSchema>;
export const difficultySchema = z.enum(["EASY", "MEDIUM", "HARD"]);

// ----- categories and sections
export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  status: statusSchema,
  visibility: visibilitySchema,
  order: z.number(),
  sectionCount: z.number(),
});
export type AdminCategory = z.infer<typeof categorySchema>;
export const categoriesData = z.object({ categories: z.array(categorySchema) });
export const categoryData = z.object({ category: categorySchema });

export const sectionSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  kind: kindSchema,
  status: statusSchema,
  order: z.number(),
  entryCount: z.number(),
});
export type AdminSection = z.infer<typeof sectionSchema>;
export const sectionsData = z.object({ sections: z.array(sectionSchema) });
export const sectionData = z.object({ section: sectionSchema });

// ----- entries
const tagRef = z.object({ name: z.string(), slug: z.string() });
export const entryListItemSchema = z.object({
  id: z.string(),
  sectionId: z.string(),
  kind: kindSchema,
  title: z.string(),
  slug: z.string(),
  difficulty: difficultySchema.nullable(),
  status: statusSchema,
  order: z.number(),
  tags: z.array(tagRef),
});
export type AdminEntryItem = z.infer<typeof entryListItemSchema>;
export const entriesData = z.object({ entries: z.array(entryListItemSchema) });

export const entryDetailSchema = entryListItemSchema.extend({
  summary: z.string().nullable(),
  body: z.string(),
  meta: z.record(z.unknown()).nullable(),
  related: z.array(z.object({ id: z.string(), title: z.string(), slug: z.string() })),
});
export type AdminEntry = z.infer<typeof entryDetailSchema>;
export const entryData = z.object({ entry: entryDetailSchema });
export const previewData = z.object({ html: z.string() });

// ----- tags
export const adminTagSchema = z.object({ id: z.string(), name: z.string(), slug: z.string(), entryCount: z.number(), createdAt: z.string() });
export type AdminTag = z.infer<typeof adminTagSchema>;
export const tagsData = z.object({ tags: z.array(adminTagSchema) });
export const tagData = z.object({ tag: adminTagSchema });

// ----- users and roles
export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  status: z.enum(["ACTIVE", "DISABLED"]),
  role: z.object({ id: z.string(), name: z.string() }),
  lastLoginAt: z.string().nullable(),
  activeSessions: z.number(),
  createdAt: z.string(),
});
export type AdminUser = z.infer<typeof userSchema>;
export const usersData = z.object({ users: z.array(userSchema) });
export const userData = z.object({ user: userSchema });
export const createdUserData = z.object({ user: userSchema, inviteLink: z.string().nullable() });
export const revokedData = z.object({ revoked: z.number() });

export const roleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  isSystem: z.boolean(),
  permissions: z.array(z.string()),
  userCount: z.number(),
});
export type AdminRole = z.infer<typeof roleSchema>;
export const rolesData = z.object({ roles: z.array(roleSchema) });
export const roleData = z.object({ role: roleSchema });
export const permissionsData = z.object({ permissions: z.array(z.object({ key: z.string(), description: z.string().nullable() })) });

// ----- settings, audit, jobs
export const settingSchema = z.object({
  key: z.string(),
  description: z.string(),
  public: z.boolean(),
  value: z.unknown(),
  default: z.unknown(),
  isDefault: z.boolean(),
  updatedAt: z.string().nullable(),
});
export type AdminSetting = z.infer<typeof settingSchema>;
export const settingsData = z.object({ settings: z.array(settingSchema) });

export const auditItemSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  action: z.string(),
  outcome: z.enum(["SUCCESS", "FAILURE"]),
  actor: z.object({ id: z.string(), email: z.string().nullable(), role: z.string().nullable() }).nullable(),
  entityType: z.string().nullable(),
  entityId: z.string().nullable(),
  ip: z.string().nullable(),
  requestId: z.string().nullable(),
});
export type AuditItem = z.infer<typeof auditItemSchema>;
export const auditData = z.object({ logs: z.array(auditItemSchema) });
export const auditMeta = z.object({ limit: z.number(), hasMore: z.boolean(), nextCursor: z.string().nullable().optional() });
export const auditDetailData = z.object({
  log: auditItemSchema.extend({ userAgent: z.string().nullable(), before: z.record(z.unknown()).nullable(), after: z.record(z.unknown()).nullable() }),
});
export const auditActionsData = z.object({ actions: z.array(z.object({ action: z.string(), count: z.number() })) });

export const jobsData = z.object({
  driver: z.string(),
  startedAt: z.string(),
  registeredJobs: z.array(z.string()),
  jobs: z.array(
    z.object({
      name: z.string(),
      enqueued: z.number(),
      succeeded: z.number(),
      retried: z.number(),
      deadLettered: z.number(),
      running: z.number(),
      lastError: z.string().nullable(),
      lastFinishedAt: z.string().nullable(),
    }),
  ),
  deadLetters: z.array(z.unknown()),
});
