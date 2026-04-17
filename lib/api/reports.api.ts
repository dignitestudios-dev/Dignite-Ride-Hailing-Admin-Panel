import { API } from "./axios";

export type ReportStatus = "pending" | "resolved" | "rejected" | string;
export type ReportPersonType = "user" | "driver" | string;

export interface ReportListItem {
  id: string;
  reportId: string;
  reporterName: string;
  reporterType: string;
  isReporterDeactivatedByAdmin: boolean;
  reportedPersonName: string;
  reportedPersonType: string;
  isReportedPersonDeactivatedByAdmin: boolean;
  reportReason: string;
  date: string;
  status: ReportStatus;
}

export interface MostReportedEntity {
  entityId: string;
  name: string;
  type: string;
  reportCount: number;
  isDeactivatedByAdmin: boolean;
}

export interface ReportsStats {
  totalReportsReceived: number;
  pendingReports: number;
  resolvedReports: number;
  rejectedReports: number;
  mostReportedEntities: MostReportedEntity[];
}

export interface PaginatedReports {
  data: ReportListItem[];
  stats: ReportsStats;
  pagination: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

export interface ReportPersonInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: ReportPersonType;
  isDeactivatedByAdmin: boolean;
}

export interface ReportDetail {
  reportId: string;
  reporterInfo: ReportPersonInfo | null;
  reportedPersonInfo: ReportPersonInfo | null;
  reportReason: string;
  description: string;
  status: ReportStatus;
  relatedDetails: Record<string, unknown> | null;
  createdAt: string;
  resolvedAt: string | null;
  adminNotes: string | null;
}

export async function getReports(
  page = 1,
  limit = 30,
  status: "all" | "pending" | "resolved" | "rejected" = "all"
): Promise<PaginatedReports> {
  let url = `/reports?page=${page}&limit=${limit}`;
  if (status !== "all") {
    url += `&status=${encodeURIComponent(status)}`;
  }

  const response = await API.get(url);
  const raw = response.data ?? {};
  const source = raw?.data?.results ?? [];
  const rows = Array.isArray(source) ? source : [];

  const data: ReportListItem[] = rows.map((item: any) => ({
    id: String(item?._id ?? item?.reportId ?? item?.id ?? ""),
    reportId: String(item?.reportId ?? item?._id ?? item?.id ?? ""),
    reporterName: String(item?.reporterName ?? "—"),
    reporterType: String(item?.reporterType ?? "—"),
    isReporterDeactivatedByAdmin: Boolean(item?.isReporterDeactivatedByAdmin),
    reportedPersonName: String(item?.reportedPersonName ?? "—"),
    reportedPersonType: String(item?.reportedPersonType ?? "—"),
    isReportedPersonDeactivatedByAdmin: Boolean(item?.isReportedPersonDeactivatedByAdmin),
    reportReason: String(item?.reportReason ?? "—"),
    date: String(item?.date ?? item?.createdAt ?? ""),
    status: String(item?.status ?? "pending"),
  }));

  const statsRaw = raw?.data?.stats ?? {};
  const mostReportedRaw = Array.isArray(statsRaw?.mostReportedEntities)
    ? statsRaw.mostReportedEntities
    : [];

  const stats: ReportsStats = {
    totalReportsReceived: Number(statsRaw?.totalReportsReceived ?? data.length),
    pendingReports: Number(statsRaw?.pendingReports ?? 0),
    resolvedReports: Number(statsRaw?.resolvedReports ?? 0),
    rejectedReports: Number(statsRaw?.rejectedReports ?? 0),
    mostReportedEntities: mostReportedRaw.map((entity: any) => ({
      entityId: String(entity?.entityId ?? entity?._id?.id ?? ""),
      name: String(entity?.name ?? "—"),
      type: String(entity?.type ?? entity?._id?.type ?? "—"),
      reportCount: Number(entity?.reportCount ?? 0),
      isDeactivatedByAdmin: Boolean(entity?.isDeactivatedByAdmin),
    })),
  };

  const pagination = raw?.pagination ?? {};
  return {
    data,
    stats,
    pagination: {
      total: Number(pagination?.total ?? data.length),
      totalPages: Number(pagination?.totalPages ?? 1),
      page: Number(pagination?.currentPage ?? pagination?.page ?? page),
      limit: Number(pagination?.limit ?? limit),
    },
  };
}

export async function getReportById(reportId: string): Promise<ReportDetail> {
  const response = await API.get(`/reports/${reportId}`);
  const raw = response.data ?? {};
  const data = raw?.data ?? {};

  const mapPersonInfo = (person: any): ReportPersonInfo | null => {
    if (!person) return null;
    return {
      id: String(person?.id ?? person?._id ?? ""),
      name: String(person?.name ?? "—"),
      email: String(person?.email ?? "—"),
      phone: String(person?.phone ?? person?.phoneNumber ?? "—"),
      type: String(person?.type ?? "user"),
      isDeactivatedByAdmin: Boolean(person?.isDeactivatedByAdmin),
    };
  };

  return {
    reportId: String(data?.reportId ?? reportId),
    reporterInfo: mapPersonInfo(data?.reporterInfo),
    reportedPersonInfo: mapPersonInfo(data?.reportedPersonInfo),
    reportReason: String(data?.reportReason ?? "—"),
    description: String(data?.description ?? ""),
    status: String(data?.status ?? "pending"),
    relatedDetails:
      data?.relatedDetails && typeof data.relatedDetails === "object"
        ? (data.relatedDetails as Record<string, unknown>)
        : null,
    createdAt: String(data?.createdAt ?? ""),
    resolvedAt: data?.resolvedAt ? String(data.resolvedAt) : null,
    adminNotes: data?.adminNotes ? String(data.adminNotes) : null,
  };
}

export async function resolveReport(reportId: string, adminNotes = "") {
  const response = await API.patch(`/reports/${reportId}/resolved`, { adminNotes });
  return response.data;
}
