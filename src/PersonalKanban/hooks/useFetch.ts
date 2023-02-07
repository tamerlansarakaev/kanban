import {Dispatch, SetStateAction, useEffect, useState} from "react";

interface IFetchResult {
    req: () => void,
    loading: boolean,
    error: string,
    setLoading:  Dispatch<SetStateAction<boolean>>

}
interface IOptions {
    autoSetLoading: boolean
}
const useFetch = (callback: CallableFunction, options?: IOptions): IFetchResult => {
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string>('')

    const req = async () => {
        try {
            callback()
        } catch (e) {
            const err_ = e as Error
            setError(err_.message)

        } finally {
            if (options?.autoSetLoading) {
                setLoading(false)
            }
        }
    }

    return {req, loading, setLoading, error}
}

export default useFetch