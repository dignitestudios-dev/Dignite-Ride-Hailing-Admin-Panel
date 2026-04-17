import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createVehicleType,
  deleteVehicleType,
  getVehicleTypes,
  type CreateVehicleTypePayload,
  type RideType,
  type UpdateVehicleTypePayload,
  updateVehicleType,
} from "@/lib/api/vehicle-types.api";

export function useVehicleTypesQuery(
  page: number,
  limit: number,
  search: string,
  rideType: "all" | RideType
) {
  return useQuery({
    queryKey: ["vehicle-types", page, limit, search, rideType],
    queryFn: () => getVehicleTypes(page, limit, search, rideType),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useCreateVehicleTypeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateVehicleTypePayload) => createVehicleType(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-types"] });
    },
  });
}

export function useUpdateVehicleTypeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateVehicleTypePayload }) =>
      updateVehicleType(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-types"] });
    },
  });
}

export function useDeleteVehicleTypeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteVehicleType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-types"] });
    },
  });
}
