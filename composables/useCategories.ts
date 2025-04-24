import type { FetchTableDataResult } from "~/types/Table";

export function useCategories() {
    return useLazyAsyncData<FetchTableDataResult>(
      'categoryData',
      () =>
        $fetch('/api/categories', {
          method: 'GET',
          headers: buildRequestHeaders(useAuth().token.value)
        }),
      {
        default: () => ({
          success: false,
          data: { totalRecordCount: 0, rows: [] }
        }),
        server: false
      }
    )
  }
  