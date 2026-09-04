'use client';

import { useEffect, useState } from 'react';
import { get } from '@/lib/admin-fetch';
import type { ApiAuditEntry, Paged } from '@/lib/api-types';
import { Badge, Button, EmptyState, Panel } from '@/components/admin/ui';

export default function AuditPage() {
  const [data, setData] = useState<Paged<ApiAuditEntry> | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        setData(await get<Paged<ApiAuditEntry>>(`audit?page=${page}&pageSize=50`));
      } catch {
        setData({ items: [], page: 1, pageSize: 50, totalCount: 0, totalPages: 0 });
      }
    })();
  }, [page]);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-lg font-medium">Activity</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Append-only record of every change. Nothing in the dashboard can edit or remove these entries.
        </p>
      </div>

      <Panel>
        {data === null ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
        ) : data.items.length === 0 ? (
          <EmptyState title="No activity recorded yet" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">When</th>
                    <th className="pb-2 pr-4 font-medium">Who</th>
                    <th className="pb-2 pr-4 font-medium">Action</th>
                    <th className="pb-2 pr-4 font-medium">What</th>
                    <th className="pb-2 font-medium">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.items.map((e) => (
                    <tr key={e.id}>
                      <td className="py-2 pr-4 align-top font-mono text-xs text-muted-foreground">
                        {new Date(e.atUtc).toLocaleString()}
                      </td>
                      <td className="py-2 pr-4 align-top text-xs">{e.userEmail}</td>
                      <td className="py-2 pr-4 align-top">
                        <Badge tone={e.action === 'Delete' ? 'muted' : 'neutral'}>{e.action}</Badge>
                      </td>
                      <td className="py-2 pr-4 align-top text-xs text-muted-foreground">{e.summary}</td>
                      <td className="py-2 align-top font-mono text-[0.7rem] text-muted-foreground/70">
                        {e.ipAddress ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">
                  Page {data.page} of {data.totalPages} · {data.totalCount} entries
                </span>
                <div className="flex gap-2">
                  <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={page >= data.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Panel>
    </>
  );
}
