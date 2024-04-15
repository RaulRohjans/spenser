export interface User {
    email: string,
    username: string,
    password?: string
}

export interface JwtPayload extends User {
    scope: Array<'test' | 'user'>;
    exp: number;
}