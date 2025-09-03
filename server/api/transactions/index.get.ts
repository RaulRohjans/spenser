import { ensureAuth } from '~~/server/utils/auth'
import { db } from '~~/server/db/client'
import { categories, transactions } from '~~/server/db/schema'
import { and, asc, desc, eq, sql, inArray } from 'drizzle-orm'
import { makeMultiColumnSearch } from '~~/server/db/utils'

export default defineEventHandler(async (event) => {
	// Read body params
	const {
		q: search,
		page,
		limit,
		sort,
		order,
		startDate,
		endDate,
		groupCategory,
		categoryIds
	} = getQuery(event)
	const user = ensureAuth(event)

	// Build query to fetch transactions
	const parsedLimit: number = parseInt(limit?.toString() || '') || 100
	const parsedPage: number = parseInt(page?.toString() || '') || 1
	const parsedStartDate: Date = new Date(Number(startDate))
	const parsedEndDate: Date = new Date(Number(endDate))

	/*
	 * In order to use select column alias in the where clause, we need
	 * to use a subquery to fetch the data and set the where with the
	 * alias in the main select
	 */
	const baseWhere = and(
		eq(transactions.deleted, false),
		eq(transactions.user, user.id)
	)
	const rangeStart =
		startDate && parsedStartDate
			? sql`${transactions.date} >= ${parsedStartDate}`
			: undefined
	const rangeEnd =
		endDate && parsedEndDate
			? sql`${transactions.date} <= ${parsedEndDate}`
			: undefined

	const sortKey = (sort?.toString() || 'id') as
		| 'id'
		| 'name'
		| 'value'
		| 'date'
		| 'category'
		| 'category_name'
		| 'category_icon'
		| 'category_deleted'
		| 'tz_offset_minutes'
	const orderDir = (order as 'asc' | 'desc') || 'asc'

	const isGrouped = String(groupCategory || '').toLowerCase() === 'true'

	// Parse categoryIds (string | string[] | undefined) into number[]
	const categoryIdList: number[] = Array.isArray(categoryIds)
		? (categoryIds as unknown[])
			.map((v) => Number(v))
			.filter((n) => Number.isFinite(n))
		: categoryIds != null
			? [Number(categoryIds)].filter((n) => Number.isFinite(n))
			: []

	const sortColumn =
		sortKey === 'category_name'
			? categories.name
			: sortKey === 'category_icon'
				? categories.icon
				: sortKey === 'category_deleted'
					? categories.deleted
					: sortKey === 'name'
						? transactions.name
						: sortKey === 'value'
							? transactions.value
							: sortKey === 'date'
								? transactions.date
								: sortKey === 'category'
									? transactions.category
									: sortKey === 'tz_offset_minutes'
										? transactions.tz_offset_minutes
										: transactions.id

	const mainSearch = makeMultiColumnSearch(
		[
			'transaction.id',
			'transaction.name',
			'transaction.value',
			'transaction.date',
			'transaction.tz_offset_minutes',
			'category.name',
			'category.icon',
			'category.id'
		],
		search?.toString()
	)

	let query
	if (!isGrouped) {
		query = db
			.select({
				category_icon: categories.icon,
				category_name: categories.name,
				category_deleted: categories.deleted,
				id: transactions.id,
				value: transactions.value,
				date: transactions.date,
				name: transactions.name,
				category: transactions.category,
				tz_offset_minutes: transactions.tz_offset_minutes
			})
			.from(transactions)
			.innerJoin(categories, eq(categories.id, transactions.category))
			.where(
				and(
					baseWhere,
					...(rangeStart ? [rangeStart] : []),
					...(rangeEnd ? [rangeEnd] : []),
					...(mainSearch ? [mainSearch] : []),
					...(categoryIdList.length ? [inArray(transactions.category, categoryIdList)] : [])
				)
			)
			.$dynamic()

		query = query
			.orderBy(orderDir === 'desc' ? desc(sortColumn) : asc(sortColumn))
			.offset((parsedPage - 1) * parsedLimit)
			.limit(parsedLimit)
	} else {
		// Group by category: id => category id, value => sum, category_name/icon/deleted preserved
		const grouped = db
			.select({
				id: categories.id,
				category_name: categories.name,
				category_icon: categories.icon,
				category_deleted: categories.deleted,
				value: sql<number>`sum(${transactions.value})`.as('value')
			})
			.from(transactions)
			.innerJoin(categories, eq(categories.id, transactions.category))
			.where(
				and(
					baseWhere,
					...(rangeStart ? [rangeStart] : []),
					...(rangeEnd ? [rangeEnd] : []),
					...(categoryIdList.length ? [inArray(transactions.category, categoryIdList)] : [])
				)
			)
			.groupBy(
				categories.id,
				categories.name,
				categories.icon,
				categories.deleted
			)

		// Wrap grouped select so we can apply search/sort/pagination
		const g = grouped.as('main')
		const gColumnMap = {
			id: g.id,
			category_name: g.category_name,
			category_icon: g.category_icon,
			category_deleted: g.category_deleted,
			value: g.value
		}
		const gSortCol = gColumnMap[sortKey as keyof typeof gColumnMap] || g.id

		let gQuery = db.select().from(g).$dynamic()
		const like = '%' + String(search || '') + '%'
		const gSearch = search
			? sql`${g.category_name}::text ILIKE ${like} OR ${g.value}::text ILIKE ${like} OR ${g.id}::text ILIKE ${like}`
			: undefined
		if (gSearch) gQuery = gQuery.where(and(gSearch))
		query = gQuery
			.orderBy(orderDir === 'desc' ? desc(gSortCol) : asc(gSortCol))
			.offset((parsedPage - 1) * parsedLimit)
			.limit(parsedLimit)
	}
	/* ----------------------------------------------------------------- */

	// Get total record count
	let totalQuery
	if (!isGrouped) {
		totalQuery = db
			.select({ total: sql<number>`count(*)` })
			.from(transactions)
			.innerJoin(categories, eq(categories.id, transactions.category))
			.where(
				and(
					baseWhere,
					...(rangeStart ? [rangeStart] : []),
					...(rangeEnd ? [rangeEnd] : []),
					...(mainSearch ? [mainSearch] : []),
					...(categoryIdList.length ? [inArray(transactions.category, categoryIdList)] : [])
				)
			)
			.$dynamic()
	} else {
		const grouped = db
			.select({ id: categories.id })
			.from(transactions)
			.innerJoin(categories, eq(categories.id, transactions.category))
			.where(
				and(
					baseWhere,
					...(rangeStart ? [rangeStart] : []),
					...(rangeEnd ? [rangeEnd] : []),
					...(categoryIdList.length ? [inArray(transactions.category, categoryIdList)] : [])
				)
			)
			.groupBy(categories.id)
			.as('g')

		// Apply search to grouped total if present
		const gName = sql`(select ${categories.name} from ${categories} where ${categories.id} = g.id)`
		const like = '%' + String(search || '') + '%'
		const gSearch = search
			? sql`${gName}::text ILIKE ${like} OR g.value::text ILIKE ${like} OR g.id::text ILIKE ${like}`
			: undefined
		totalQuery = db
			.select({ total: sql<number>`count(*)` })
			.from(grouped)
			.$dynamic()
		if (gSearch) totalQuery = totalQuery.where(and(gSearch))
	}

	const totalRecordsRes = await totalQuery.then((r) => r[0])

	// Get rows
	let rowRes
	try {
		rowRes = await query
	} catch (e) {
		console.log((e as Error).message)
	}

	if (!totalRecordsRes)
		throw createError({
			statusCode: 500,
			statusMessage: 'Could not load total transaction count.'
		})

	return {
		success: true,
		data: {
			totalRecordCount: Number(totalRecordsRes.total),
			rows: rowRes
		}
	}
})
