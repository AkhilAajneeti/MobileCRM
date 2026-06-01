import { useQuery } from "@tanstack/react-query"
import { fetchCall } from "services/call.services"

export const useTraining = () => {
    return useQuery({
        queryKey: ["training"],
        queryFn: fetchCall,
        staleTime: 5 * 60 * 1000,
    })
}
