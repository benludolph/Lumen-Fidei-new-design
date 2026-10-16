

export interface AdminTestimonyPart {
  id: number;
  testimonyId: number;
  partNumber: number;
  title: string;
  videoUrl: string;
  unlockKey: string;
}

export interface AdminTestimony {
  id: number;
  position: number;
  personName: string;
  description: string;
  thumbnailUrl: string;
  fullVideoUrl: string;
  parts: AdminTestimonyPart[];
}
