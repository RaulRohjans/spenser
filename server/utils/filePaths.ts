import { join } from 'node:path'

export const getPublicDir = () => join(process.cwd(), 'public')
export const getAvatarsDir = () => join(getPublicDir(), 'avatars')

export type AllowedMime =
    | 'image/png'
    | 'image/jpeg'
    | 'image/jpg'
    | 'image/svg+xml'
    | 'image/gif'

export const MIME_TO_EXT: Record<AllowedMime, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/svg+xml': '.svg',
    'image/gif': '.gif'
}

export const isAllowedMime = (mime: string): mime is AllowedMime => {
    return (
        mime === 'image/png' ||
        mime === 'image/jpeg' ||
        mime === 'image/jpg' ||
        mime === 'image/svg+xml' ||
        mime === 'image/gif'
    )
}


