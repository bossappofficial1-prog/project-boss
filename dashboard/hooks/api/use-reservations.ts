import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reservationApi, type CreateReservationPayload } from "@/lib/apis/reservation";

const KEYS = {
  list: (outletId: string, date?: string) => ["reservations", outletId, date] as const,
};

export function useReservations(outletId: string | undefined, date?: string) {
  return useQuery({
    queryKey: KEYS.list(outletId ?? "", date),
    queryFn: () => reservationApi.list({ outletId: outletId!, date }),
    enabled: !!outletId,
    select: (res) => res.data,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReservationPayload) => reservationApi.create(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["reservations", variables.outletId],
      });
    },
  });
}

export function useUpdateReservationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, outletId }: { id: string; status: string; outletId: string }) =>
      reservationApi.updateStatus(id, status, outletId),
    onSuccess: (_, { outletId }) => {
      queryClient.invalidateQueries({
        queryKey: ["reservations", outletId],
      });
    },
  });
}
