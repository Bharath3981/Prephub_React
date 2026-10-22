import { mget } from "@/features/admin/admin-api";
import { jobsData } from "@/features/admin/schemas";
import { Empty, PageHeader, Table, TableSkeleton, td } from "@/features/admin/ui";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { useFetch } from "@/shared/hooks/useFetch";
import { Button } from "@/shared/ui/Button";
import { ErrorState } from "@/shared/ui/ErrorState";

/** /admin/jobs: the background job queue (counts since the API started). Read only. */
export function JobsPage() {
  useDocumentTitle("Background jobs · Admin");
  const jobs = useFetch((signal) => mget(jobsData, "/jobs", undefined, signal), []);
  return (
    <div>
      <PageHeader
        title="Background jobs"
        crumbs={[{ label: "Background jobs" }]}
        description="Work the API does after the response (for example sending a password email). Counts reset when the API restarts."
        action={
          <Button variant="secondary" onClick={jobs.reload}>
            Refresh
          </Button>
        }
      />
      {jobs.status === "loading" && <TableSkeleton />}
      {jobs.status === "error" && <ErrorState title="Could not load the jobs" error={jobs.error} onRetry={jobs.reload} />}
      {jobs.status === "success" && (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Driver: <b>{jobs.data.driver}</b>. Started {new Date(jobs.data.startedAt).toLocaleString()}.
          </p>
          {jobs.data.jobs.length === 0 ? (
            <Empty>No jobs are registered.</Empty>
          ) : (
            <Table head={["Job", "Queued", "Done", "Retried", "Failed for good", "Running", "Last error"]} caption="Jobs">
              {jobs.data.jobs.map((job) => (
                <tr key={job.name}>
                  <td className={td}>
                    <code>{job.name}</code>
                  </td>
                  <td className={td}>{job.enqueued}</td>
                  <td className={td}>{job.succeeded}</td>
                  <td className={td}>{job.retried}</td>
                  <td className={td}>{job.deadLettered}</td>
                  <td className={td}>{job.running}</td>
                  <td className={`${td} text-danger`}>{job.lastError ?? "-"}</td>
                </tr>
              ))}
            </Table>
          )}
          <p className="text-sm">Dead letters (jobs that failed after every retry): {jobs.data.deadLetters.length === 0 ? "none" : jobs.data.deadLetters.length}</p>
        </div>
      )}
    </div>
  );
}
