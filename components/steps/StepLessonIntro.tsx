import type { Lesson } from "@/types/lesson";
import { RichText } from "@/components/ui/RichText";

function ConceptCard({ label, small }: { label: string; small?: boolean }) {
  return (
    <div
      className={`rounded-2xl border border-divider border-t-4 border-t-primary bg-surface flex items-center justify-center px-3 ${
        small ? "py-3" : "py-5"
      }`}
      style={{ boxShadow: "0 2px 8px var(--theme-primary-soft)" }}
    >
      <span
        className={`${small ? "type-body-lg" : "type-title"} font-bold text-heading text-center`}
      >
        {label}
      </span>
    </div>
  );
}

export function StepLessonIntro({ lesson }: { lesson: Lesson }) {
  const ungrouped = lesson.concepts.filter((c) => !c.group);
  const groupMap = new Map<string, typeof lesson.concepts>();
  for (const c of lesson.concepts) {
    if (!c.group) continue;
    const arr = groupMap.get(c.group) ?? [];
    arr.push(c);
    groupMap.set(c.group, arr);
  }
  const groups = Array.from(groupMap.entries());
  const hasGroups = groups.length > 0;

  const topLevelItems = [
    ...ungrouped.map((c) => ({ kind: "concept" as const, label: c.type })),
    ...groups.map(([name]) => ({ kind: "group" as const, label: name })),
  ];

  return (
    <div className="space-y-8">
      <h1 className="type-heading font-bold text-heading">{lesson.title}</h1>

      <div className="rounded-2xl border border-divider bg-surface px-7 py-6 shadow-sm space-y-3">
        <p className="type-body-lg font-bold text-label">
          الْفِكْرَةُ الرَّئِيسِيَّةُ
        </p>
        <p className="type-title text-heading">
          <RichText text={lesson.introduction} />
        </p>
      </div>

      {hasGroups ? (
        <div className="space-y-4">
          <div
            className={`grid gap-3`}
            style={{
              gridTemplateColumns: `repeat(${topLevelItems.length}, minmax(0, 1fr))`,
            }}
          >
            {topLevelItems.map((item) => (
              <ConceptCard key={item.label} label={item.label} />
            ))}
          </div>

          {groups.map(([name, children]) => {
            const title = children.find((c) => c.group_title)?.group_title ?? name;
            return (
              <div
                key={name}
                className="rounded-2xl border border-divider bg-surface-hover px-4 py-4 space-y-3"
              >
                <p className="type-body-lg font-bold text-label text-center">
                  {title}
                </p>
                <div className="flex flex-col gap-3">
                  {children.map((c) => (
                    <ConceptCard key={c.type} label={c.type} small />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {lesson.concepts.map((concept) => (
            <ConceptCard key={concept.type} label={concept.type} />
          ))}
        </div>
      )}

      {lesson.intro_bonus && (
        <div className="rounded-2xl border border-primary-border bg-primary-soft px-7 py-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <svg
              aria-hidden="true"
              className="h-5 w-5 text-primary-text"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2l1.6 4.8L18.5 8l-4.9 1.2L12 14l-1.6-4.8L5.5 8l4.9-1.2L12 2zM18 14l.9 2.7L21.5 18l-2.6 1.3L18 22l-.9-2.7L14.5 18l2.6-1.3L18 14zM6 13l.7 2.1L9 16l-2.3.9L6 19l-.7-2.1L3 16l2.3-.9L6 13z" />
            </svg>
            <p className="type-body-lg font-bold text-primary-text">
              {lesson.intro_bonus.title}
            </p>
          </div>
          <p className="type-body-lg text-body">
            <RichText text={lesson.intro_bonus.body} />
          </p>
        </div>
      )}
    </div>
  );
}
