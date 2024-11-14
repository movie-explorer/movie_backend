import { randomBytes, createHmac } from 'crypto'

interface UserData {
    cookie: string
    ttl: number
    salt: string
}

export class Auth {
    #storage: Map<string, UserData>
    #secret: string
    #ttl: number

    constructor(secret: string, ttl: number) {
        console.log(`Setting up auth storage with ttl of ${ttl}`)
        this.#storage = new Map<string, UserData>()
        this.#secret = secret
        this.#ttl = ttl
    }

    private getStorage = (userId: string) => this.#storage.get(userId)
    private delField = (userId: string) => this.#storage.delete(userId)
    private updateStorage = (userId: string, data: UserData) => this.#storage.set(userId, data)
    private userIdFromCookie = (cookie: string): string => cookie.split('.')[0]

    private genCookie = (userId: string, salt: string) => {
        const cookie = this.getIdentifier(userId)
        const signature = this.generateSignature(cookie, salt)
        return `${cookie}.${signature}`
    }


    private getIdentifier = (userId: string): string => {
        const keyBuffer = Buffer.from(userId)
        const result = keyBuffer.toString('base64')
        return result
    }

    private generateSignature = (data: string, salt: string): string => {
        const hmac = createHmac('sha256', this.#secret)
        hmac.update(data + salt)
        return hmac.digest('base64')
    }

    private verifySignature = (cookie: string, salt: string): boolean => {
        const [data, signature] = cookie.split('.')
        const expectedSignature = this.generateSignature(data, salt)
        return signature === expectedSignature;
    }

    private cleaner = (userId: string) => {
        setTimeout(() => {
           this.delField(userId)
        }, this.#ttl)
    }

    isUserLoggedin = (cookie: string): boolean => {
        const userId = this.userIdFromCookie(cookie)
        const userData = this.getStorage(userId)
        if (!userData) {
            return false
        }
        const { ttl, salt } = userData
        if (ttl < Date.now()) {
            this.delField(userId)
            return false;
        }
        if (!this.verifySignature(cookie, salt)) {
            return false;
        }
        return true;
    }

    setLoggedIn = (userId: string): string => {
        const salt = randomBytes(16).toString('hex')
        const cookie = this.genCookie(userId, salt)
	const encodedId = Buffer.from(userId).toString('base64')
        const userData: UserData = {
            cookie: cookie,
            ttl: Date.now() + this.#ttl,
            salt: salt
        }
        this.updateStorage(encodedId, userData)
	this.cleaner(encodedId)
        return cookie
    }

    setLoggedOut = (cookie: string) => {
        this.delField(this.userIdFromCookie(cookie))
        return
    }
}