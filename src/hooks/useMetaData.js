import { useQuery } from '@tanstack/react-query'
// import { fetchAccountType, fetchIndustries, fetchSources, fetchStatus } from 'services/others.service';

export const useMetaData = () => {
    return useQuery({
        queryKey: ["meta"],
        queryFn: async () => {
            const [sources, status, industries,types] = await Promise.all([
                // fetchSources(),
                // fetchStatus(),
                // fetchIndustries(),
                // fetchAccountType(),
            ]);

            return {
                // sources: sources.options || [],
                // status: status.options || [],
                // industries: industries.options || [],
                // type: types.options || [],
            };
        },
        staleTime: 10 * 60 * 1000,
    });
}
