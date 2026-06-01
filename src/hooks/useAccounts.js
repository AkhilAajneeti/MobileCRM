import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { fetchAccounts } from "services/account.service"

export const useAccounts = ({limit,page,filters}) => {
    return useQuery({
        queryKey: ["accounts",page,limit,filters],
        queryFn: ()=>fetchAccounts({limit,page,filters}),
        placeholderData: keepPreviousData,
    })
}
