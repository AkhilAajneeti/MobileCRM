import { useQuery } from '@tanstack/react-query'
import { fetchLeadsById } from 'services/leads.service'


export const useLeadDetails = (id,mode) => {
    return useQuery({
        queryKey: ["leadDetails", id],
        queryFn: () => fetchLeadsById(id),
        enabled: !!id && mode === "view",
    })
}
