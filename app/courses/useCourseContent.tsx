"use client";

import { useEffect, useState } from "react";
import type { CourseContentOverride, CourseContentValue } from "../course-content";
import CourseContentEditButton, { type CourseContentField } from "./CourseContentEditButton";

export function useCourseContent({
  courseId,
  courseTitle,
  enabled = true,
  disabledOrigin,
}: {
  courseId: string;
  courseTitle: string;
  enabled?: boolean;
  disabledOrigin?: string;
}) {
  const [overrides, setOverrides] = useState<Record<string, CourseContentOverride>>({});
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    if (!enabled || (disabledOrigin && window.location.origin === disabledOrigin)) {
      return;
    }
    let active = true;
    fetch(`/api/course-content?courseId=${encodeURIComponent(courseId)}`, { cache: "no-store" })
      .then(async (response) => {
        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) throw new Error("课程内容接口返回了网页而不是数据");
        const result = await response.json() as { overrides?: CourseContentOverride[]; canEdit?: boolean; error?: string };
        if (!response.ok) throw new Error(result.error ?? "课程内容读取失败");
        return result;
      })
      .then((result) => {
        if (!active) return;
        setOverrides(Object.fromEntries((result.overrides ?? []).map((item) => [item.contentKey, item])));
        setCanEdit(result.canEdit === true);
      })
      .catch(() => {
        if (active) setCanEdit(false);
      });
    return () => { active = false; };
  }, [courseId, disabledOrigin, enabled]);

  function content<T extends CourseContentValue>(contentKey: string, source: T): T {
    return { ...source, ...(overrides[contentKey]?.content ?? {}) } as T;
  }

  function editor({
    levelId,
    unitLabel,
    section,
    contentKey,
    fields,
  }: {
    levelId: number;
    unitLabel?: string;
    section: string;
    contentKey: string;
    fields: CourseContentField[];
  }) {
    return <CourseContentEditButton
      courseId={courseId}
      courseTitle={courseTitle}
      levelId={levelId}
      unitLabel={unitLabel}
      section={section}
      contentKey={contentKey}
      fields={fields}
      overridden={Boolean(overrides[contentKey])}
      canEdit={canEdit}
      onSaved={(record) => setOverrides((current) => ({ ...current, [record.contentKey]: record }))}
      onReset={(key) => setOverrides((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      })}
    />;
  }

  return { canEdit, content, editor };
}
