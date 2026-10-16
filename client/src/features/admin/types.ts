

export type CohortRecord = {
  id: number;
  name: string;
  startDate: string;
  endDate: string | null;
  status: "active" | "archived";
  createdAt: string;
};

export type ProgressData = {
  totalDays: number;
  userId: number;
  userName: string;
  userEmail: string;
  role: string;
  track: string | null;
  mentorName: string | null;
  startDate: string | null;
  currentDay: number;
  daysCompleted: number;
  morningToday: boolean;
  eveningToday: boolean;
};
