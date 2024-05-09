import pg from 'pg'
import { Kysely, PostgresDialect, sql } from 'kysely'
import type { SelectQueryBuilder } from 'kysely'
import type { DB } from 'kysely-codegen'

const {
    DB_NAME,
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_PORT
} = useRuntimeConfig()

if(!DB_NAME || !DB_HOST || !DB_USER || !DB_PASSWORD) {
    console.error('The PostgreSQL database instance configuration is invalid. Please make sure the .env is set correctly.')
}

const dialect = new PostgresDialect({
    pool: new pg.Pool({
        database: DB_NAME as string,
        host: DB_HOST as string,
        user: DB_USER as string,
        password: DB_PASSWORD as string,
        port: Number(DB_PORT),
        max: 10,
    })
})

export const db = new Kysely<DB>({
  dialect,
})

export const applySearchFilter = function(qb: SelectQueryBuilder<any, any, any>, search: string | undefined, searchColumn: string): SelectQueryBuilder<any, any, any> {
    // If no search term is provided, return the unmodified query builder    
    if (!search) return qb

    // Case insensitive string compare
    return qb.where(({ eb, fn, cast }) => eb(
        fn('upper', [
            cast(db.dynamic.ref(searchColumn.toLowerCase()), 'text')
        ]), 
        
        'like', 
        
        `%${search.toUpperCase()}%`
    ))
}