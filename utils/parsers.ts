import type { TableSearch } from '@/types/Table'

export const parseSeachQuery = function(query: string) {
    /* The search may have the format @column <search text>
     * So we have to account for this logic
     */

    // Check if there is a valid column name
    if(query[0] === '@' && query[1] !== '' && query[1] !== ' ') {
        const split = query.split(' ')

        //The column name will be the first split without the @
        return {
            column: split[0].substring(1).trim(),
            query: query.replace(split[0], '').trim()
        } as TableSearch
    }

    return {
        query
    } as TableSearch
}