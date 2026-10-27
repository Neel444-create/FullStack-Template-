import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Search } from "lucide-react"
import { Suspense, useState } from "react"

import { ItemsService } from "@/client"
import { DataTable } from "@/components/Common/DataTable"
import AddItem from "@/components/Items/AddItem"
import { columns } from "@/components/Items/columns"
import PendingItems from "@/components/Pending/PendingItems"
import { Input } from "@/components/ui/input"

function getItemsQueryOptions(search: string) {
  const normalizedSearch = search.trim()
  return {
    queryFn: async () =>
      (
        await ItemsService.readItems({
          query: {
            skip: 0,
            limit: 100,
            search: normalizedSearch || undefined,
          },
        })
      ).data,
    queryKey: ["items", normalizedSearch],
  }
}

export const Route = createFileRoute("/_layout/items")({
  component: Items,
  head: () => ({
    meta: [
      {
        title: "Items - FastAPI Template",
      },
    ],
  }),
})

function ItemsTableContent({ search }: { search: string }) {
  const { data: items } = useSuspenseQuery(getItemsQueryOptions(search))

  if (items.data.length === 0) {
    const hasSearch = search.trim().length > 0
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">
          {hasSearch ? "No items match your search" : "You don't have any items yet"}
        </h3>
        <p className="text-muted-foreground">
          {hasSearch ? "Try a different title or description." : "Add a new item to get started"}
        </p>
      </div>
    )
  }

  return <DataTable columns={columns} data={items.data} />
}

function ItemsTable({ search }: { search: string }) {
  return (
    <Suspense fallback={<PendingItems />}>
      <ItemsTableContent search={search} />
    </Suspense>
  )
}

function Items() {
  const [search, setSearch] = useState("")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Items</h1>
          <p className="text-muted-foreground">Create and manage your items</p>
        </div>
        <AddItem />
      </div>
      <div className="max-w-md">
        <Input
          aria-label="Search items"
          placeholder="Search titles and descriptions..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      <ItemsTable search={search} />
    </div>
  )
}
