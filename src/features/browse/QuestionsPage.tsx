import { useCallback, useMemo } from "react";
import { getCategories, getQuestions } from "@/features/catalog/api";
import { EntryFilters } from "@/features/catalog/EntryFilters";
import { EntryResults } from "@/features/catalog/EntryResults";
import { PAGE_SIZE, useListParams } from "@/features/catalog/list-params";
import { TopicSelect } from "@/features/browse/TopicSelect";
import { useRenderCount } from "@/shared/dev/render-count";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { useFetch } from "@/shared/hooks/useFetch";
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";

/**
 * QUESTIONS PAGE: /questions. Every question of every topic, filtered by topic, difficulty and search text.
 * The filters live in the URL (/questions?category=react&difficulty=HARD&search=hooks&page=2), like the section page.
 * The list, states and pager are the same EntryResults as the section page; only the request differs.
 */
export function QuestionsPage() {
  useRenderCount("QuestionsPage");
  useDocumentTitle("Questions");

  const { page, difficulty, search, category, to, change } = useListParams();
  const pageLink = useCallback((next: number) => to({ page: next }), [to]);
  const clearLink = useMemo(() => to({ difficulty: undefined, search: "", category: undefined }), [to]);

  // The topics for the select, and for the label on each card. A failure here only costs the select, not the list.
  const topics = useFetch((signal) => getCategories(signal), []);
  const topicList = useMemo(() => (topics.status === "success" ? topics.data : []), [topics]);
  const topicName = useCallback((slug: string) => topicList.find((topic) => topic.slug === slug)?.name, [topicList]);

  const entries = useFetch((signal) => getQuestions({ page, limit: PAGE_SIZE, difficulty, search, category }, signal), [page, difficulty, search, category]);

  const filtered = difficulty !== undefined || search.trim() !== "" || category !== undefined;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Questions" }]} />
        <h1 className="text-3xl font-bold tracking-tight">Questions</h1>
        <p className="max-w-2xl text-muted">Every interview question from every topic. Pick a topic, a difficulty, or search.</p>
      </header>

      <EntryResults
        entries={entries}
        scope="questions"
        pageLink={pageLink}
        clearTo={clearLink}
        filtered={filtered}
        emptyText="There are no published questions yet."
        topicName={topicName}
        filters={
          <div className="space-y-3">
            <TopicSelect topics={topicList} value={category} onChange={(value) => change({ category: value })} />
            <EntryFilters
              difficulty={difficulty}
              search={search}
              searchLabel="Search all questions"
              onDifficulty={(value) => change({ difficulty: value })}
              onSearch={(value) => change({ search: value }, { replace: true })}
            />
          </div>
        }
      />
    </div>
  );
}
