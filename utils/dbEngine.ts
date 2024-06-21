import pg from 'pg'
import { Kysely, PostgresDialect } from 'kysely'
import type { DB } from 'kysely-codegen'
import type { CustomSQLQueryBuilder } from '~/types/Data'

const { dbName, dbHost, dbUser, dbPassword, dbPort } = useRuntimeConfig()

if (!dbName || !dbHost || !dbUser || !dbPassword) {
    console.error(
        'The PostgreSQL database instance configuration is invalid. Please make sure the .env is set correctly.'
    )
}

console.log(dbName, dbHost, dbUser, dbPassword, dbPort)

const dialect = new PostgresDialect({
    pool: new pg.Pool({
        database: dbName as string,
        host: dbHost as string,
        user: dbUser as string,
        password: dbPassword as string,
        port: Number(dbPort),
        max: 10
    })
})

export const db = new Kysely<DB>({
    dialect
})

export const applySearchFilter = function (
    qb: CustomSQLQueryBuilder,
    search: string | undefined,
    searchColumn: string
): CustomSQLQueryBuilder {
    // If no search term is provided, return the unmodified query builder
    if (!search) return qb

    // Case insensitive string compare
    return qb.where(({ eb, fn, cast }) =>
        eb(
            fn('upper', [
                cast(db.dynamic.ref(searchColumn.toLowerCase()), 'text')
            ]),

            'like',

            `%${search.toUpperCase()}%`
        )
    )
}
