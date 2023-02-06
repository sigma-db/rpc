export interface Client {
    result(value: boolean): Promise<void>;
}

export interface Server {
    checkPalindrome(value: string): Promise<void>;
}
