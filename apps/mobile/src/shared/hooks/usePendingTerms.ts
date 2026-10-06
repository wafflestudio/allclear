import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContext } from "react";
import { useProfile } from "@/shared/contexts/profileContext";
import { serviceContext } from "@/shared/contexts/serviceContext";
import { resolveShouldShowTermsModal } from "@/shared/utils/appModalFlow";
import type { TermService } from "@/usecases/term";

const usePendingTerms = (enabled = true) => {
	const { termService } = useContext(serviceContext);
	const { user, isLoading: isProfileLoading } = useProfile();
	const queryClient = useQueryClient();
	const {
		data: pendingTerms = [],
		isFetched: hasFetchedPendingTerms,
		isError: hasPendingTermsError,
		isFetching,
	} = usePendingTermsQuery(termService, enabled && !isProfileLoading && !!user);
	const agreeTermsMutation = useAgreeTerms(termService, queryClient);
	const shouldShowTermsModal = resolveShouldShowTermsModal({
		enabled,
		isProfileLoading,
		isAuthenticated: Boolean(user),
		isFetching,
		hasFetchedPendingTerms,
		hasPendingTermsError,
		pendingTermCount: pendingTerms.length,
	});

	return {
		pendingTerms,
		isSubmitting: agreeTermsMutation.isPending,
		shouldShowTermsModal,
		handleAgreeTerms: agreeTermsMutation.mutate,
	};
};

export default usePendingTerms;

const usePendingTermsQuery = (termService: TermService, enabled: boolean) => {
	return useQuery({
		queryKey: ["terms"],
		queryFn: () => termService.listTerms(),
		select: (data) => data.data,
		enabled,
		staleTime: 60 * 1000,
		retry: false,
	});
};

const useAgreeTerms = (
	termService: TermService,
	queryClient: ReturnType<typeof useQueryClient>,
) => {
	return useMutation({
		mutationFn: ({ termUuids }: { termUuids: string[] }) =>
			termService.agreeTerms({ termUuids }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["terms"] });
		},
	});
};
