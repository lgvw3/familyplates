import type { Annotation, AnnotationComment } from "@/types/scripture";

export type FeedActivity = {
  key: string;
  kind: "annotation" | "comment";
  occurredAt: Date;
  unseen: boolean;
  seenKeys: string[];
  annotation: Annotation;
  comment?: AnnotationComment;
  parentComment?: AnnotationComment;
  contextComments?: AnnotationComment[];
};

export type FeedCursor = {
  unseen: boolean;
  occurredAt: string;
  key: string;
};

export type FeedPage = {
  items: FeedActivity[];
  nextCursor: FeedCursor | null;
};
