export type PublicConfigState = {
    ready: boolean
    dailyReset: boolean
    demo: boolean
    umamiScriptUrl: string
    umamiWebsiteId: string
}

export const usePublicConfigStore = defineStore('publicConfig', {
    state: (): PublicConfigState => ({
        ready: false,
        dailyReset: false,
        demo: false,
        umamiScriptUrl: '',
        umamiWebsiteId: ''
    }),
    actions: {
        reset() {
            this.ready = false
            this.dailyReset = false
            this.demo = false
            this.umamiScriptUrl = ''
            this.umamiWebsiteId = ''
        },
        loadFrom(obj: Partial<PublicConfigState>) {
            if (typeof obj.dailyReset === 'boolean') this.dailyReset = obj.dailyReset
            if (typeof obj.demo === 'boolean') this.demo = obj.demo
            if (typeof obj.umamiScriptUrl === 'string') this.umamiScriptUrl = obj.umamiScriptUrl
            if (typeof obj.umamiWebsiteId === 'string') this.umamiWebsiteId = obj.umamiWebsiteId
            this.ready = true
        }
    },
    persist: true
})


